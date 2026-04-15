import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  if (role !== "admin" || !departmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { slotId } = await params;
  const body = await req.json().catch(() => ({}));

  const slot = await prisma.timetableSlot.findFirst({
    where: { id: slotId },
    include: { timetable: true },
  });
  if (!slot || slot.timetable.departmentId !== departmentId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: { subjectId?: string; roomId?: string; facultyId?: string; type?: string } = {};
  if (body.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: body.subjectId, departmentId },
    });
    if (subject) updates.subjectId = subject.id;
  }

  if (body.roomId) {
    const room = await prisma.room.findFirst({
      where: { id: body.roomId, departmentId },
    });
    if (room) updates.roomId = room.id;
  }
  if (body.facultyId) {
    const faculty = await prisma.faculty.findFirst({
      where: { id: body.facultyId, departmentId },
    });
    if (faculty) updates.facultyId = faculty.id;
  }
  if (body.type) {
    updates.type = body.type;
  }

  await prisma.timetableSlot.update({
    where: { id: slotId },
    data: updates,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  if (role !== "admin" || !departmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { slotId } = await params;

  const slot = await prisma.timetableSlot.findFirst({
    where: { id: slotId },
    include: { timetable: true },
  });
  if (!slot || slot.timetable.departmentId !== departmentId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.timetableSlot.delete({
    where: { id: slotId },
  });
  return NextResponse.json({ ok: true });
}
