import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugGenerator() {
    const departmentCode = "CSE"; // Adjust as needed
    const year = 3; // Adjust as needed

    const department = await prisma.department.findUnique({
        where: { code: departmentCode },
    });

    if (!department) {
        console.error("Department not found");
        return;
    }

    const subjects = await prisma.subject.findMany({
        where: { departmentId: department.id, year },
    });

    const faculty = await prisma.faculty.findMany({
        where: { departmentId: department.id },
        include: { subjects: true, user: true },
    });

    console.log(`Found ${subjects.length} subjects and ${faculty.length} faculty for ${departmentCode} Year ${year}`);

    for (const sub of subjects) {
        const eligibleFaculty = faculty.filter((f) =>
            f.subjects.some((s) => s.id === sub.id)
        );

        console.log(`Subject: ${sub.code} - ${sub.name}`);
        console.log(`  Mapped Faculty Count: ${eligibleFaculty.length}`);
        if (eligibleFaculty.length > 0) {
            console.log(`  Mapped Faculty: ${eligibleFaculty.map(f => f.user.name).join(", ")}`);
        } else {
            console.log(`  No mapped faculty found! Generator will fallback.`);
        }
    }
}

debugGenerator()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
