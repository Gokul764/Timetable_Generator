import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAllYearsTimetable } from "@/lib/timetable-generator";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;

  if (role !== "admin" || !departmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { requestId } = await params;

  // 1. Fetch the request
  const facultyRequest = await prisma.facultyTimeslotRequest.findUnique({
    where: { id: requestId },
    include: { faculty: { include: { user: true } } },
  });

  if (!facultyRequest || facultyRequest.faculty.departmentId !== departmentId) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  try {
    // 2. Temporarily "approve" the request so the GA picks it up
    // We use a transaction to ensure we can roll back if needed, 
    // but GA itself does many DB operations. 
    // To keep it simple, we'll mark it as approved, run GA, and then finalize.
    await prisma.facultyTimeslotRequest.update({
      where: { id: requestId },
      data: { status: "approved" },
    });

    // 3. Re-generate the entire department's timetable
    // This ensures we check for global room conflicts across all years
    const results = await generateAllYearsTimetable(departmentId);

    // 4. Evaluate success (all years must be success / 0 hard violations)
    const success = results.every((r: any) => r.success);
    const totalViolations = results.reduce((acc: number, r: any) => acc + r.hardViolations, 0);

    const finalStatus = success ? "approved" : "rejected";

    // 5. Final status update
    await prisma.facultyTimeslotRequest.update({
      where: { id: requestId },
      data: { status: finalStatus },
    });

    // 6. Notify Faculty
    await prisma.notification.create({
      data: {
        userId: facultyRequest.faculty.userId,
        title: success ? "Constraint Approved (AI Verified)" : "Constraint Rejected (AI Conflict)",
        message: success 
          ? `Your request for ${facultyRequest.startTime} on Day ${facultyRequest.dayOfWeek} has been approved and the timetable is updated.`
          : `Your request was rejected because it caused ${totalViolations} scheduling conflicts.`,
        type: success ? "SUCCESS" : "ERROR",
      },
    });

    if (!success) {
      return NextResponse.json({ 
        error: `AI could not find a valid schedule. Detected ${totalViolations} hard violations. Request rejected.`,
        violations: totalViolations
      }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Timetable re-generated successfully with 0 conflicts." });
  } catch (err) {
    console.error("AI Verification Error:", err);
    // Attempt rescue
    await prisma.facultyTimeslotRequest.update({
        where: { id: requestId },
        data: { status: "pending" },
      });
    return NextResponse.json({ error: "An error occurred during AI re-generation." }, { status: 500 });
  }
}
