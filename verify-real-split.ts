import { PrismaClient } from "@prisma/client";
import { generateTimetableForDepartment } from "./src/lib/timetable-generator";

const prisma = new PrismaClient();

async function verifySplitWithRealData() {
    console.log("Verifying Venue Split with Real Data...");

    // Test with CSE (1014 students -> ~253 per year)
    // 253 students / 60 capacity = 4.2 -> 5 rooms needed per slot

    const deptCode = "CSE";
    const dept = await prisma.department.findUnique({ where: { code: deptCode } });
    if (!dept) throw new Error("CSE Dept not found");

    const year = 3;

    const currentCount = await prisma.student.count({ where: { departmentId: dept.id, year } });
    console.log(`CSE Year ${year} student count: ${currentCount}`);

    // Expectation: ~253 students
    if (currentCount < 200) {
        console.warn("Warning: Student count seems low for Real Data test. Did seed run for CSE?");
    }

    // Generate
    console.log("Generating timetable for CSE Year 3...");
    const { timetableId } = await generateTimetableForDepartment(dept.id, year, 1);
    console.log("Generated Timetable ID:", timetableId);

    // Analyze Slots
    const slots = await prisma.timetableSlot.findMany({
        where: { timetableId },
        include: { room: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    const slotsByTime: Record<string, number> = {};
    for (const slot of slots) {
        const key = `${slot.dayOfWeek}-${slot.startTime}`;
        slotsByTime[key] = (slotsByTime[key] || 0) + 1;
    }

    // Check splits
    let maxRoomsUsed = 0;
    for (const [key, count] of Object.entries(slotsByTime)) {
        if (count > maxRoomsUsed) maxRoomsUsed = count;
        if (count >= 4) {
            console.log(`[PASS] ${key}: Used ${count} rooms for batch of ~${currentCount} students.`);
        }
    }

    if (maxRoomsUsed >= 4) {
        console.log("SUCCESS: Split logic handles real world data correctly.");
    } else {
        console.error(`FAILURE: Max rooms used for a slot was ${maxRoomsUsed}. Expected >= 4 for ~250 students.`);
    }
}

verifySplitWithRealData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
