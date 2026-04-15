import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const departments = ["AIML", "AIDS", "CSE", "IT"];

    for (const code of departments) {
        console.log(`\nChecking Department: ${code}`);
        const faculty = await prisma.faculty.findMany({
            where: { department: { code } },
            include: { user: true },
            take: 5
        });

        faculty.forEach((f, i) => {
            console.log(`${i + 1}. ${f.user.name} (${f.user.email})`);
        });
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
