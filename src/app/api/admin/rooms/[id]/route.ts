import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateRoomSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    capacity: z.number().min(1),
    type: z.enum(["classroom", "lab", "seminar_hall"]),
    isAvailable: z.boolean(),
});

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
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

        const { id } = params;
        const body = await req.json();
        const { name, code, capacity, type, isAvailable } = updateRoomSchema.parse(body);

        const room = await prisma.room.findUnique({
            where: { id },
        });

        if (!room) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (user.role === "admin" && room.departmentId !== user.departmentId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Check code uniqueness if changed
        if (code !== room.code) {
            const existing = await prisma.room.findFirst({
                where: {
                    code,
                    departmentId: room.departmentId,
                    id: { not: id },
                },
            });
            if (existing) {
                return new NextResponse("Room code already exists in this department", { status: 409 });
            }
        }

        const updatedRoom = await prisma.room.update({
            where: { id },
            data: {
                name,
                code,
                capacity,
                type,
                isAvailable,
            },
        });

        return NextResponse.json(updatedRoom);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.error("Error updating room:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
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

        const room = await prisma.room.findUnique({
            where: { id: params.id },
        });

        if (!room) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (user.role === "admin" && room.departmentId !== user.departmentId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.room.delete({
            where: { id: params.id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting room:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
