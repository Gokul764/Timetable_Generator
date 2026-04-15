import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const facultyId = (session?.user as { facultyId?: string })?.facultyId;
  if (!facultyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const { dayOfWeek, startTime, endTime, reason, status } = body;
  if (
    typeof dayOfWeek !== "number" ||
    dayOfWeek < 0 ||
    dayOfWeek > 4 ||
    !startTime ||
    !endTime
  ) {
    return NextResponse.json({ error: "Invalid day or time" }, { status: 400 });
  }

  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId as string },
    include: { user: true }
  });

  if (!faculty) {
    return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
  }

  const request = await prisma.facultyTimeslotRequest.create({
    data: {
      facultyId: facultyId as string,
      dayOfWeek,
      startTime: String(startTime),
      endTime: String(endTime),
      reason: reason ?? null,
      status: "pending", // Always pending initially now
    },
  });

  // Notify Admins in the same department
  const admins = await prisma.user.findMany({
    where: {
      role: "admin",
      departmentId: faculty.departmentId,
    },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "New Faculty Constraint",
        message: `${faculty.user.name} has submitted a new ${reason?.includes("[UNAVAILABLE]") ? "unavailability block" : "preference"}.`,
        type: "INFO",
      })),
    });
  }

  return NextResponse.json({ ok: true, requestId: request.id });
}
