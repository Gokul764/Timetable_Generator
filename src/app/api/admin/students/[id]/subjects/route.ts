import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSubjectsSchema = z.object({
    subjectIds: z.array(z.string()),
});

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params;
        const body = await req.json();
        const { subjectIds } = updateSubjectsSchema.parse(body);

        const student = await prisma.student.findUnique({
            where: { id },
            include: { department: true }
        });

        if (!student) {
            return new NextResponse("Student not found", { status: 404 });
        }

        // Admins can only manage students in their department
        if (user.role === "admin" && student.departmentId !== user.departmentId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Update the relation
        await prisma.student.update({
            where: { id },
            data: {
                subjects: {
                    set: subjectIds.map((id) => ({ id })),
                },
            },
        });

        return new NextResponse("Success", { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.error("Error updating student subjects:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
