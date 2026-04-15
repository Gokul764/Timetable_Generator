import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  if (role !== "admin" || !departmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const roomId = body?.roomId;
  if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { department: true },
  });
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.departmentId === departmentId) {
    return NextResponse.json({ error: "Cannot request your own department room" }, { status: 400 });
  }

  await prisma.roomRequest.create({
    data: {
      requestingDeptId: departmentId,
      owningDeptId: room.departmentId,
      roomId: room.id,
      reason: body.reason ?? null,
    },
  });
  return NextResponse.json({ ok: true });
}
