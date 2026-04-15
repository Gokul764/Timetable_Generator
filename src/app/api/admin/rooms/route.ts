import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createRoomSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    capacity: z.number().min(1),
    type: z.enum(["classroom", "lab", "seminar_hall"]),
    isAvailable: z.boolean().default(true),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = session.user as { role: string; departmentId: string };
        if (user.role !== "admin" && user.role !== "super_admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { name, code, capacity, type, isAvailable } = createRoomSchema.parse(body);

        const departmentId = user.departmentId;

        // Check code uniqueness within department
        const existing = await prisma.room.findFirst({
            where: {
                code,
                departmentId,
            },
        });

        if (existing) {
            return new NextResponse("Room code already exists in this department", { status: 409 });
        }

        const room = await prisma.room.create({
            data: {
                name,
                code,
                capacity,
                type,
                isAvailable,
                departmentId,
            },
        });

        return NextResponse.json(room);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.error("Error creating room:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
