import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  if (role !== "admin" || !departmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const timetable = await prisma.timetable.findFirst({
    where: { id, departmentId },
  });
  if (!timetable) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: any = {};
  if (typeof body.isPublished === "boolean") data.isPublished = body.isPublished;
  if (typeof body.year === "number") data.year = body.year;
  if (typeof body.semester === "number") data.semester = body.semester;

  await prisma.timetable.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;

  if (role !== "admin" || !departmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const timetable = await prisma.timetable.findFirst({
    where: { id, departmentId },
  });

  if (!timetable) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.timetable.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
