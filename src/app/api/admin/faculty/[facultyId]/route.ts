import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ facultyId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const admin = session.user as { role: string; departmentId: string };
        const { facultyId } = await params;

        const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId },
            include: { user: true }
        });

        if (!faculty || faculty.departmentId !== admin.departmentId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Delete the User (cascades to Faculty record)
        await prisma.user.delete({
            where: { id: faculty.userId },
        });

        return new NextResponse("Success", { status: 200 });
    } catch (error) {
        console.error("Error deleting faculty:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
