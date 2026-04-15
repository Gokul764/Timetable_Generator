import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSlotSchema = z.object({
    timetableId: z.string(),
    subjectId: z.string(),
    roomId: z.string(),
    facultyId: z.string(),
    dayOfWeek: z.number().min(0).max(4),
    startTime: z.string(),
    endTime: z.string(),
    studentCount: z.number().min(0).optional(),
    type: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const role = (session?.user as { role?: string })?.role;
        const departmentId = (session?.user as { departmentId?: string })?.departmentId;
        if (role !== "admin" || !departmentId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const data = createSlotSchema.parse(body);

        // Verify timetable belongs to department
        const timetable = await prisma.timetable.findFirst({
            where: { id: data.timetableId, departmentId },
        });
        if (!timetable) {
            return new NextResponse("Timetable not found", { status: 404 });
        }

        // Verify resources belong to department
        const [subject, room, faculty] = await Promise.all([
            prisma.subject.findFirst({ where: { id: data.subjectId, departmentId } }),
            prisma.room.findFirst({ where: { id: data.roomId, departmentId } }),
            prisma.faculty.findFirst({ where: { id: data.facultyId, departmentId } }),
        ]);

        if (!subject || !room || !faculty) {
            return new NextResponse("Invalid resource ID(s)", { status: 400 });
        }

        const newSlot = await prisma.timetableSlot.create({
            data: {
                timetableId: data.timetableId,
                subjectId: data.subjectId,
                roomId: data.roomId,
                facultyId: data.facultyId,
                dayOfWeek: data.dayOfWeek,
                startTime: data.startTime,
                endTime: data.endTime,
                type: data.type || "theory",
                studentCount: data.studentCount || 0,
            },
        });

        return NextResponse.json(newSlot, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.error("Error creating timetable slot:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
