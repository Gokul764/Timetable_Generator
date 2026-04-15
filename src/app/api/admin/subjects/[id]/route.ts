import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSubjectSchema = z.object({
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
        } = updateSubjectSchema.parse(body);

        const subject = await prisma.subject.findUnique({
            where: { id: params.id },
        });

        if (!subject) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (user.role === "admin" && subject.departmentId !== user.departmentId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Check for code uniqueness if changed
        if (code !== subject.code) {
            const existing = await prisma.subject.findFirst({
                where: {
                    code,
                    departmentId: subject.departmentId,
                    id: { not: params.id }
                }
            });
            if (existing) {
                return new NextResponse("Subject code already exists", { status: 409 });
            }
        }

        // If any category is being updated, we should re-evaluate mutual exclusivity
        let finalCategories = {};
        const anyCategoryUpdate = [isHonor, isMinor, isAddOn, isProfessionalElective, isOpenElective, isCore].some(v => v !== undefined);

        if (anyCategoryUpdate) {
            const categories = {
                isHonor: isHonor !== undefined ? !!isHonor : !!subject.isHonor,
                isMinor: isMinor !== undefined ? !!isMinor : !!subject.isMinor,
                isAddOn: isAddOn !== undefined ? !!isAddOn : !!subject.isAddOn,
                isProfessionalElective: isProfessionalElective !== undefined ? !!isProfessionalElective : !!subject.isProfessionalElective,
                isOpenElective: isOpenElective !== undefined ? !!isOpenElective : !!subject.isOpenElective,
                isCore: isCore !== undefined ? !!isCore : !!subject.isCore,
            };

            const priority = ['isHonor', 'isMinor', 'isAddOn', 'isProfessionalElective', 'isOpenElective', 'isCore'] as const;
            const selected = priority.find(p => categories[p]) || 'isCore';

            finalCategories = {
                isHonor: selected === 'isHonor',
                isMinor: selected === 'isMinor',
                isAddOn: selected === 'isAddOn',
                isProfessionalElective: selected === 'isProfessionalElective',
                isOpenElective: selected === 'isOpenElective',
                isCore: selected === 'isCore',
            };
        }

        const updatedSubject = await prisma.subject.update({
            where: { id: params.id },
            data: {
                name: name || undefined,
                code: code || undefined,
                year: year || undefined,
                semester: semester || undefined,
                classesPerWeek: classesPerWeek || undefined,
                isLab: isLab !== undefined ? isLab : undefined,
                labSessionsPerWeek: isLab ? (labSessionsPerWeek || undefined) : (isLab === false ? 0 : undefined),
                ...finalCategories,
            },
        });

        return NextResponse.json(updatedSubject);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse("Invalid request data", { status: 400 });
        }
        console.error("Error updating subject:", error);
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

        const subject = await prisma.subject.findUnique({
            where: { id: params.id },
        });

        if (!subject) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (user.role === "admin" && subject.departmentId !== user.departmentId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.subject.delete({
            where: { id: params.id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting subject:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
