import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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
  const body = await req.json();
  const status = body?.status;
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const reqRecord = await prisma.facultyTimeslotRequest.findFirst({
    where: { id: requestId },
    include: { faculty: true },
  });
  if (!reqRecord || reqRecord.faculty.departmentId !== departmentId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (status === "approved") {
    // 1. Check for Conflicts
    const record = reqRecord as any;
    const { facultyId, dayOfWeek, startTime, targetSlotId, endTime } = record;

    console.log("Approving faculty request:", { facultyId, dayOfWeek, startTime, targetSlotId });

    // Find the slot to move
    const slotToMove = targetSlotId
      ? await prisma.timetableSlot.findUnique({ where: { id: targetSlotId }, include: { timetable: true } })
      : null;

    console.log("Slot to move:", slotToMove);

    if (!slotToMove && targetSlotId) {
      return NextResponse.json({ error: "Target slot not found" }, { status: 400 });
    }

    if (slotToMove) {
      // A. Room Conflict
      const roomClash = await prisma.timetableSlot.findFirst({
        where: {
          roomId: slotToMove.roomId,
          dayOfWeek,
          startTime,
          id: { not: targetSlotId }
        },
        include: { timetable: { include: { department: true } } }
      });
      if (roomClash) {
        console.log("Room clash detected:", roomClash);
        return NextResponse.json({
          error: `Room Clash: ${roomClash.timetable.department.code} Year ${roomClash.timetable.year} is using this room.`
        }, { status: 409 });
      }

      // B. Faculty Conflict
      const facultyClash = await prisma.timetableSlot.findFirst({
        where: {
          facultyId,
          dayOfWeek,
          startTime,
          id: { not: targetSlotId }
        }
      });
      if (facultyClash) {
        console.log("Faculty clash detected:", facultyClash);
        return NextResponse.json({ error: "Faculty Clash: Teacher has another class at this time." }, { status: 409 });
      }

      // C. Student/Year Conflict
      const yearClash = await prisma.timetableSlot.findFirst({
        where: {
          timetableId: slotToMove.timetableId,
          dayOfWeek,
          startTime,
          id: { not: targetSlotId }
        }
      });
      if (yearClash) {
        console.log("Year clash detected:", yearClash);
        return NextResponse.json({ error: "Year Clash: This year already has a class scheduled at this time." }, { status: 409 });
      }

      // 2. Perform the Move
      console.log("Updating slot:", targetSlotId, "to", { dayOfWeek, startTime, endTime });
      await prisma.timetableSlot.update({
        where: { id: targetSlotId },
        data: { dayOfWeek, startTime, endTime }
      });
    }
  }

  await prisma.facultyTimeslotRequest.update({
    where: { id: requestId },
    data: { status },
  });
  return NextResponse.json({ ok: true });
}
