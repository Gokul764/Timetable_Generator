
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking AGRI Year 1 Subjects...");
    const subjects = await prisma.subject.findMany({
        where: {
            department: { code: "AGRI" },
            year: 1
        },
        orderBy: { semester: 'asc' }
    });

    console.table(subjects.map(s => ({
        Code: s.code,
        Name: s.name,
        Year: s.year,
        Semester: s.semester
    })));

    const sem1 = subjects.filter(s => s.semester === 1).length;
    const sem2 = subjects.filter(s => s.semester === 2).length;
    console.log(`\nSem 1 Subjects: ${sem1}`);
    console.log(`Sem 2 Subjects: ${sem2}`);
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
