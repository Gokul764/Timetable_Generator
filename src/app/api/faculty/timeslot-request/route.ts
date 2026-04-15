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
  const body = await req.json();
  const { dayOfWeek, startTime, endTime, reason, targetSlotId } = body;
  
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

  // If a specific slot is being moved, verify it belongs to this faculty
  if (targetSlotId) {
    const slot = await prisma.timetableSlot.findFirst({
      where: {
        id: targetSlotId,
        facultyId: facultyId as string,
      },
    });
    if (!slot) {
      return NextResponse.json({ error: "Invalid class selection" }, { status: 400 });
    }
  }

  const request = await prisma.facultyTimeslotRequest.create({
    data: {
      facultyId: facultyId as string,
      dayOfWeek,
      startTime: String(startTime),
      endTime: String(endTime),
      reason: reason ?? null,
      targetSlotId: targetSlotId || null,
      isMoveRequest: !!targetSlotId,
      status: "pending",
    },
  });

  // Notify Admins in the same department
  const typeLabel = targetSlotId ? "move request" : (reason?.includes("[UNAVAILABLE]") ? "unavailability block" : "preference");

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
        title: "New Faculty Request",
        message: `${faculty.user.name} has submitted a new ${typeLabel}.`,
        type: "INFO",
      })),
    });
  }

  return NextResponse.json({ ok: true, requestId: request.id });
}
