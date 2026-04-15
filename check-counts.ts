import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const depts = await prisma.department.findMany({
        include: {
            _count: {
                select: { students: true }
            }
        }
    });

    console.log("Department Student Counts:");
    depts.forEach(d => {
        console.log(`${d.code}: ${d._count.students}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
