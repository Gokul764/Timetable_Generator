import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying AIML & AIDS Faculty Designations...");
    const depts = ["AIML", "AIDS"];

    for (const deptCode of depts) {
        console.log(`\nChecking Department: ${deptCode}`);
        const dept = await prisma.department.findUnique({
            where: { code: deptCode }
        });

        if (!dept) {
            console.error(`${deptCode} Department not found!`);
            continue;
        }

        const faculty = await prisma.faculty.findMany({
            where: { departmentId: dept.id },
            include: { user: true }
        });

        console.log(`Found ${faculty.length} faculty in ${deptCode}.`);

        let correctCount = 0;
        faculty.forEach(f => {
            if (f.designation) {
                console.log(`[OK] ${f.user.name}: ${f.designation}`);
                correctCount++;
            } else {
                console.log(`[FAIL] ${f.user.name}: NO DESIGNATION`);
            }
        });

        console.log(`Results for ${deptCode}: ${correctCount}/${faculty.length} faculty have designations.`);
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
