import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const user = session.user as { role: string; departmentId: string };

        if (user.role !== "admin" && user.role !== "super_admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const subject = await prisma.subject.findUnique({
            where: { id },
        });

        if (!subject) {
            return new NextResponse("Subject not found", { status: 404 });
        }

        // Admins can only toggle subjects in their department
        if (user.role === "admin" && subject.departmentId !== user.departmentId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updatedSubject = await prisma.subject.update({
            where: { id },
            data: {
                isActive: !subject.isActive,
            },
        });

        return NextResponse.json(updatedSubject);
    } catch (error) {
        console.error("Error toggling subject status:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
