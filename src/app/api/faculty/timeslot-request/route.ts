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

  await prisma.facultyTimeslotRequest.create({
    data: {
      facultyId: facultyId as string,
      dayOfWeek,
      startTime: String(startTime),
      endTime: String(endTime),
      reason: reason ?? null,
      status: status === "approved" ? "approved" : "pending",
    },
  });
  return NextResponse.json({ ok: true });
}
