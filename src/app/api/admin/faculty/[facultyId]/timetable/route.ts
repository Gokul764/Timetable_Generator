import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: { facultyId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = session.user as { role: string; departmentId: string };
        if (user.role !== "admin" && user.role !== "super_admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { facultyId } = params;

        // Verify faculty exists and belongs to the same department if role is admin
        const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId },
        });

        if (!faculty) {
            return new NextResponse("Faculty not found", { status: 404 });
        }

        if (user.role === "admin" && faculty.departmentId !== user.departmentId) {
            return new NextResponse("Forbidden: Different Department", { status: 403 });
        }

        const slots = await prisma.timetableSlot.findMany({
            where: { facultyId },
            include: {
                timetable: true,
                room: true,
                subject: true,
            },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        });

        return NextResponse.json(slots);
    } catch (error) {
        console.error("Error fetching faculty timetable:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
