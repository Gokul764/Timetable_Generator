import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const faculty = await prisma.faculty.findFirst({
        include: { subjects: true, department: true },
    });

    if (!faculty) {
        console.log("No faculty found.");
        return;
    }

    const text = `Faculty: ${faculty.employeeId} (${faculty.department.code})`;
    console.log(text);
    console.log("Subjects:", faculty.subjects.map(s => s.code).join(", "));

    const subjectCount = await prisma.subject.count();
    console.log(`Total Subjects: ${subjectCount}`);

    const facultyWithSubjects = await prisma.faculty.count({
        where: { subjects: { some: {} } }
    });
    console.log(`Faculty with subjects: ${facultyWithSubjects}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
