import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FacultyContent } from "./faculty-content";

export default async function AdminFacultyPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const user = session.user as { role: string; departmentId: string };
    if (user.role !== "admin") redirect("/");

    const departmentId = user.departmentId;

    const [facultyList, allSubjects] = await Promise.all([
        prisma.faculty.findMany({
            where: { departmentId },
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
                    },
                    orderBy: { code: "asc" },
                },
            },
            orderBy: { employeeId: "asc" },
        }),
        prisma.subject.findMany({
            where: {
                OR: [
                    { departmentId },
                    { isCore: false }
                ]
            },
            select: {
                id: true,
                name: true,
                code: true,
                year: true,
                isCore: true,
                departmentId: true,
                isHonor: true,
                isMinor: true,
                isOpenElective: true,
                isProfessionalElective: true,
                department: {
                    select: {
                        code: true
                    }
                }
            },
            orderBy: [{ year: "asc" }, { code: "asc" }],
        }),
    ]);

    return (
        <div className="container mx-auto py-10 px-6 max-w-7xl">
            <FacultyContent 
                initialFaculty={facultyList as any} 
                allSubjects={allSubjects as any}
                currentDepartmentId={departmentId}
            />
        </div>
    );
}
