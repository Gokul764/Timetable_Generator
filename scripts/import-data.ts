import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Generic Import Script
 * 
 * Usage: 
 * 1. Define your data as strings or load from files.
 * 2. Update the main function to call the appropriate import functions.
 * 3. Run with `npx tsx scripts/import-data.ts`
 */

async function importSubjects(deptCode: string, csvData: string) {
    console.log(`Importing subjects for ${deptCode}...`);
    const dept = await prisma.department.findUnique({ where: { code: deptCode } });
    if (!dept) throw new Error(`Department ${deptCode} not found`);

    const lines = csvData.trim().split('\n');
    let count = 0;

    for (const line of lines) {
        const [code, name, year, semester, isLab, isHonor, isMinor, isAddOn, isProfessionalElective, isOpenElective, isCore] = line.split(',').map(s => s.trim());

        await prisma.subject.upsert({
            where: { code_departmentId: { code, departmentId: dept.id } },
            update: {
                name,
                year: parseInt(year),
                semester: parseInt(semester),
                isLab: isLab === 'true',
                isHonor: isHonor === 'true',
                isMinor: isMinor === 'true',
                isAddOn: isAddOn === 'true',
                isProfessionalElective: isProfessionalElective === 'true',
                isOpenElective: isOpenElective === 'true',
                isCore: isCore !== 'false', // Default to true if not explicitly false
            },
            create: {
                code,
                name,
                departmentId: dept.id,
                year: parseInt(year),
                semester: parseInt(semester),
                isLab: isLab === 'true',
                isHonor: isHonor === 'true',
                isMinor: isMinor === 'true',
                isAddOn: isAddOn === 'true',
                isProfessionalElective: isProfessionalElective === 'true',
                isOpenElective: isOpenElective === 'true',
                isCore: isCore !== 'false',
            }
        });
        count++;
    }
    console.log(`Imported ${count} subjects.`);
}

async function importStudents(deptCode: string, csvData: string) {
    console.log(`Importing students for ${deptCode}...`);
    const dept = await prisma.department.findUnique({ where: { code: deptCode } });
    if (!dept) throw new Error(`Department ${deptCode} not found`);

    const passwordHash = await hash("password", 10);
    const lines = csvData.trim().split('\n');
    let count = 0;

    for (const line of lines) {
        const [rollNo, name, year] = line.split(',').map(s => s.trim());
        const email = `${rollNo.toLowerCase()}@college.edu`;

        await prisma.user.upsert({
            where: { email },
            update: { name },
            create: {
                email,
                name,
                passwordHash,
                role: "student",
                departmentId: dept.id,
                studentProfile: {
                    create: {
                        rollNo,
                        departmentId: dept.id,
                        year: parseInt(year),
                    }
                }
            }
        });
        count++;
    }
    console.log(`Imported ${count} students.`);
}

async function main() {
    // Example usage:
    // await importSubjects('AIML', `CS301,Data Structures,2,3,false,false,false,false,false`);
    // await importStudents('AIML', `21AL101,Akash G,3`);

    console.log("Please uncomment the function calls in main() and add your data to start importing.");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
