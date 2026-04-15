import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StudentsContent } from "./students-content";

export default async function AdminStudentsPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/auth/signin");
    }

    if (!session.user.departmentId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-destructive">Configuration Error</h2>
                    <p className="text-muted-foreground">Admin account has no department assigned.</p>
                </div>
            </div>
        );
    }

    const students = await prisma.student.findMany({
        where: {
            departmentId: session.user.departmentId,
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                }
            },
            subjects: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                }
            },
        },
        orderBy: {
            rollNo: 'asc',
        },
    });

    const subjects = await prisma.subject.findMany({
        where: { departmentId: session.user.departmentId },
        select: {
            id: true,
            name: true,
            code: true,
            year: true,
        },
        orderBy: { code: 'asc' },
    });

    return (
        <div className="container mx-auto py-8 px-4 md:px-8 max-w-7xl">
            <StudentsContent 
                initialStudents={students as any} 
                allSubjects={subjects} 
            />
        </div>
    );
}
