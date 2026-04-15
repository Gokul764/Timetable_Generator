import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSubjectSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1),
    year: z.number().min(1).max(4),
    semester: z.number().min(1).max(8),
    classesPerWeek: z.number().min(1).max(10),
    isLab: z.boolean(),
    labSessionsPerWeek: z.number().min(0).max(5),
    isHonor: z.boolean().optional(),
    isMinor: z.boolean().optional(),
    isAddOn: z.boolean().optional(),
    isProfessionalElective: z.boolean().optional(),
    isOpenElective: z.boolean().optional(),
    isCore: z.boolean().optional(),
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
        const {
            name,
            code,
            year,
            semester,
            classesPerWeek,
            isLab,
            labSessionsPerWeek,
            isHonor,
            isMinor,
            isAddOn,
            isProfessionalElective,
            isOpenElective,
            isCore
        } = createSubjectSchema.parse(body);

        const departmentId = user.departmentId;

        // Check if code exists in dept
        const existing = await prisma.subject.findFirst({
            where: {
                code,
                departmentId,
            },
        });

        if (existing) {
            return new NextResponse("Subject code already exists in this department", { status: 409 });
        }

        // Enforce mutual exclusivity: Honor > Minor > AddOn > ProfElective > OpenElective > Core
        const categories = {
            isHonor: !!isHonor,
            isMinor: !!isMinor,
            isAddOn: !!isAddOn,
            isProfessionalElective: !!isProfessionalElective,
            isOpenElective: !!isOpenElective,
            isCore: isCore !== undefined ? !!isCore : true,
        };

        const priority = ['isHonor', 'isMinor', 'isAddOn', 'isProfessionalElective', 'isOpenElective', 'isCore'] as const;
        const selected = priority.find(p => categories[p]) || 'isCore';

        const finalCategories = {
            isHonor: selected === 'isHonor',
            isMinor: selected === 'isMinor',
            isAddOn: selected === 'isAddOn',
            isProfessionalElective: selected === 'isProfessionalElective',
            isOpenElective: selected === 'isOpenElective',
            isCore: selected === 'isCore',
        };

        const subject = await prisma.subject.create({
            data: {
                name,
                code,
                departmentId,
                year,
                semester,
                classesPerWeek: classesPerWeek || 3,
                isLab: !!isLab,
                labSessionsPerWeek: isLab ? (labSessionsPerWeek || 1) : 0,
                ...finalCategories,
            },
        });

        return NextResponse.json(subject);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.error("Error creating subject:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
