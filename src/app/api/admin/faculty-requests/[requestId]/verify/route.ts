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
  const facultyRequest = await prisma.facultyTimeslotRequest.findUnique({
    where: { id: requestId },
    include: { 
      faculty: { include: { user: true } },
      targetSlot: { include: { subject: true, timetable: true } }
    },
  });

  if (!facultyRequest || facultyRequest.faculty.departmentId !== departmentId) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // logic for SMART MOVE
  if (facultyRequest.isMoveRequest && facultyRequest.targetSlot) {
    try {
      const { targetSlot } = facultyRequest;
      const targetDay = facultyRequest.dayOfWeek;
      const targetStart = facultyRequest.startTime;
      const targetEnd = facultyRequest.endTime;

      // 1. Check Room Conflict
      const roomConflict = await prisma.timetableSlot.findFirst({
        where: {
          roomId: targetSlot.roomId,
          dayOfWeek: targetDay,
          startTime: targetStart,
          // Exclude the slot we are moving
          NOT: { id: targetSlot.id }
        },
        include: { subject: true }
      });

      if (roomConflict) {
        return NextResponse.json({ 
          error: `Room conflict: ${roomConflict.subject?.name || "Another class"} is already scheduled in this room at the target time.` 
        }, { status: 400 });
      }

      // 2. Check Student Group Conflict (Year/Sem/Dept)
      const studentConflict = await prisma.timetableSlot.findFirst({
        where: {
          timetableId: targetSlot.timetableId,
          dayOfWeek: targetDay,
          startTime: targetStart,
          NOT: { id: targetSlot.id }
        },
        include: { subject: true }
      });

      if (studentConflict) {
        return NextResponse.json({ 
          error: `Student conflict: This year group already has a ${studentConflict.subject?.name || "class"} at the target time.` 
        }, { status: 400 });
      }

      // 3. Check Faculty Conflict (the requester themselves)
      const facultyConflict = await prisma.timetableSlot.findFirst({
        where: {
          facultyId: facultyRequest.facultyId,
          dayOfWeek: targetDay,
          startTime: targetStart,
          NOT: { id: targetSlot.id }
        },
        include: { subject: true }
      });

      if (facultyConflict) {
        return NextResponse.json({ 
          error: `Faculty conflict: You already have ${facultyConflict.subject?.name || "another class"} at the target time.` 
        }, { status: 400 });
      }

      // NO CONFLICTS -> Apply Move directly
      await prisma.$transaction([
        prisma.timetableSlot.update({
          where: { id: targetSlot.id },
          data: {
            dayOfWeek: targetDay,
            startTime: targetStart,
            endTime: targetEnd
          }
        }),
        prisma.facultyTimeslotRequest.update({
          where: { id: requestId },
          data: { status: "approved" }
        }),
        prisma.notification.create({
          data: {
            userId: facultyRequest.faculty.userId,
            title: "Move Request Approved",
            message: `Your class ${targetSlot.subject?.name} has been moved to ${targetStart} on Day ${targetDay}.`,
            type: "SUCCESS",
          }
        })
      ]);

      return NextResponse.json({ ok: true, message: "Class moved successfully! No global re-generation was needed." });

    } catch (err) {
      console.error("Smart Move Error:", err);
      return NextResponse.json({ error: "Failed to apply move." }, { status: 500 });
    }
  }

  // FALLBACK: Old GA Verification for general constraints
  try {
    // 2. Temporarily "approve" the request so the GA picks it up
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
