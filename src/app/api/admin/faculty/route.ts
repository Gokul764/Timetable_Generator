import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createFacultySchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    employeeId: z.string().optional(),
    designation: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const admin = session.user as { role: string; departmentId: string };
        if (admin.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { name, email, password, employeeId, designation } = createFacultySchema.parse(body);

        // Check for existing user
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return new NextResponse("User already exists", { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    role: "faculty",
                    departmentId: admin.departmentId,
                },
            });

            const faculty = await tx.faculty.create({
                data: {
                    userId: user.id,
                    departmentId: admin.departmentId,
                    employeeId,
                    designation,
                },
            });

            return { user, faculty };
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.error("Error creating faculty:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
