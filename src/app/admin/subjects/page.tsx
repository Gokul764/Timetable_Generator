import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SubjectsContent } from "./subjects-content";

export default async function AdminSubjectsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const user = session.user as { role: string; departmentId: string };
    if (user.role !== "admin") redirect("/");

    const departmentId = user.departmentId;

    const subjects = await prisma.subject.findMany({
        where: { departmentId },
        orderBy: [{ year: "asc" }, { semester: "asc" }, { code: "asc" }],
    });

    return <SubjectsContent initialSubjects={subjects as any} />;
}
