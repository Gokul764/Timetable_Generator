import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSubjectsSchema = z.object({
    subjectIds: z.array(z.string()),
});

export async function PUT(
    req: Request,
    { params }: { params: { facultyId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { facultyId } = params;
        const body = await req.json();
        const { subjectIds } = updateSubjectsSchema.parse(body);

        // Verify admin belongs to same department as faculty
        // Or just is an admin of that department.
        const user = session.user as { role: string; departmentId: string };

        if (user.role !== "admin" && user.role !== "super_admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId },
        });

        if (!faculty) {
            return new NextResponse("Faculty not found", { status: 404 });
        }

        if (user.role === "admin" && faculty.departmentId !== user.departmentId) {
            return new NextResponse("Forbidden: Different Department", { status: 403 });
        }

        // Update subjects
        // Use set to replace all existing connections
        const updatedFaculty = await prisma.faculty.update({
            where: { id: facultyId },
            data: {
                subjects: {
                    set: subjectIds.map((id) => ({ id })),
                },
            },
            include: { subjects: true },
        });

        return NextResponse.json(updatedFaculty);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.error("Error updating faculty subjects:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
