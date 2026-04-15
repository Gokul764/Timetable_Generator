import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateStudentSchema = z.object({
    rollNo: z.string().optional(),
    year: z.number().min(1).max(4).optional(),
});

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const admin = session.user as { role: string; departmentId: string };
        if (admin.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { id } = await params;

        const student = await prisma.student.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!student) {
            return new NextResponse("Student not found", { status: 404 });
        }

        if (student.departmentId !== admin.departmentId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Delete the User (which cascades to Student because of onDelete: Cascade in Student model)
        // OR better: delete both explicitly or via the User since it's the parent.
        await prisma.user.delete({
            where: { id: student.userId },
        });

        return new NextResponse("Success", { status: 200 });
    } catch (error) {
        console.error("Error deleting student:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const admin = session.user as { role: string; departmentId: string };
        const { id } = await params;

        const body = await req.json();
        const data = updateStudentSchema.parse(body);

        const student = await prisma.student.findUnique({
            where: { id }
        });

        if (!student || student.departmentId !== admin.departmentId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updated = await prisma.student.update({
            where: { id },
            data
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
