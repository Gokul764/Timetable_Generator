import { PrismaClient } from "@prisma/client";
import { generateAllYearsTimetable } from "./src/lib/timetable-generator";

const prisma = new PrismaClient();

async function verifyNoConflicts() {
    console.log("Verifying Multi-Year Conflict Fix Across All Departments...");

    const depts = await prisma.department.findMany();
    if (depts.length === 0) {
        console.error("No departments found. Please run seed first.");
        return;
    }

    const allConflicts: string[] = [];

    for (const dept of depts) {
        console.log(`Checking ${dept.code}...`);

        const slots = await prisma.timetableSlot.findMany({
            where: {
                timetable: {
                    departmentId: dept.id
                }
            },
            include: {
                room: true,
                faculty: { include: { user: true } },
                timetable: true
            }
        });

        const roomUsage: Record<string, string> = {}; // "day-time-roomId" -> year-sem
        const facultyUsage: Record<string, string> = {}; // "day-time-facultyId" -> year-sem

        for (const slot of slots) {
            const timeKey = `${slot.dayOfWeek}-${slot.startTime}`;

            // Room conflict check
            const roomKey = `${timeKey}-${slot.roomId}`;
            if (roomUsage[roomKey] && roomUsage[roomKey] !== `Y${slot.timetable.year}S${slot.timetable.semester}`) {
                allConflicts.push(`[${dept.code}] Room Conflict: Room ${slot.room.name} used by both ${roomUsage[roomKey]} and Y${slot.timetable.year}S${slot.timetable.semester} at ${timeKey}`);
            }
            roomUsage[roomKey] = `Y${slot.timetable.year}S${slot.timetable.semester}`;

            // Faculty conflict check
            const facultyKey = `${timeKey}-${slot.facultyId}`;
            if (facultyUsage[facultyKey] && facultyUsage[facultyKey] !== `Y${slot.timetable.year}S${slot.timetable.semester}`) {
                allConflicts.push(`[${dept.code}] Faculty Conflict: Faculty ${slot.faculty.user.name} assigned to both ${facultyUsage[facultyKey]} and Y${slot.timetable.year}S${slot.timetable.semester} at ${timeKey}`);
            }
            facultyUsage[facultyKey] = `Y${slot.timetable.year}S${slot.timetable.semester}`;
        }
    }

    if (allConflicts.length === 0) {
        console.log("✅ SUCCESS: No multi-year conflicts detected in any department!");
    } else {
        console.log(`❌ FAILED: Found ${allConflicts.length} conflicts:`);
        allConflicts.slice(0, 20).forEach(c => console.log(`  - ${c}`));
        if (allConflicts.length > 20) console.log(`  ... and ${allConflicts.length - 20} more.`);
    }
}

verifyNoConflicts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
