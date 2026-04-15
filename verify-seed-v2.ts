
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying Seed Data...");

    const depts = await prisma.department.findMany({
        include: {
            _count: {
                select: { students: true, faculty: true, subjects: true }
            }
        }
    });

    console.table(depts.map(d => ({
        Code: d.code,
        Name: d.name,
        Students: d._count.students,
        Faculty: d._count.faculty,
        Subjects: d._count.subjects
    })));

    const aidsStudents = await prisma.student.count({
        where: { department: { code: "AIDS" } }
    });
    console.log(`\nSpecific Check - AIDS Students: ${aidsStudents}`);

    const agriStudents = await prisma.student.count({
        where: { department: { code: "AGRI" } }
    });
    console.log(`Specific Check - AGRI Students: ${agriStudents}`);

    // Verify Subject Enrollments
    const enrollmentCheck = await prisma.student.findFirst({
        where: { department: { code: "AGRI" }, year: 3 },
        include: { subjects: true }
    });

    if (enrollmentCheck) {
        console.log(`\nSample Enrollment Check (AGRI Year 3 Student):`);
        console.log(`Student: ${enrollmentCheck.rollNo}`);
        console.log(`Enrolled in ${enrollmentCheck.subjects.length} subjects: ${enrollmentCheck.subjects.map(s => s.code).join(", ")}`);
    } else {
        console.log("\nNo AGRI Year 3 student found for enrollment check.");
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
