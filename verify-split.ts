import { PrismaClient } from "@prisma/client";
import { generateTimetableForDepartment } from "./src/lib/timetable-generator";

const prisma = new PrismaClient();

async function verifySplit() {
    console.log("Setting up test data for Venue Split...");

    // 1. Setup Data
    // Ensure we have enough students in a department to trigger split
    const deptCode = "CSE";
    const dept = await prisma.department.findUnique({ where: { code: deptCode } });
    if (!dept) throw new Error("Dept not found");

    const year = 3;

    // Mock: Force student count to 120 for this test context without creating 120 records if possible?
    // The generator calls `prisma.student.count`. We should populate real students or mock the function.
    // Since we can't easily mock imports in this runtime without setup, let's just ensure we have students.

    const currentCount = await prisma.student.count({ where: { departmentId: dept.id, year } });
    console.log(`Current student count: ${currentCount}`);

    // We need > 60 students. Seed usually gives 120.
    // We need rooms with capacity < 120. Seed gives capacity 60.
    // So splitting *should* happen if count > 60.

    // 2. Run Generator
    console.log("Running generator...");
    const timetableId = await generateTimetableForDepartment(dept.id, year, 1);
    console.log("Generated Timetable ID:", timetableId);

    // 3. Verify Splits
    const slots = await prisma.timetableSlot.findMany({
        where: { timetableId },
        include: { room: true, subject: true },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    // Group by day+time
    const slotsByTime: Record<string, typeof slots> = {};
    for (const slot of slots) {
        const key = `${slot.dayOfWeek}-${slot.startTime}`;
        if (!slotsByTime[key]) slotsByTime[key] = [];
        slotsByTime[key].push(slot);
    }

    // Check for multiples
    let splitFound = false;
    for (const [key, parallelSlots] of Object.entries(slotsByTime)) {
        if (parallelSlots.length > 1) {
            // Check if they are the SAME subject
            const subjectIds = new Set(parallelSlots.map(s => s.subjectId));
            if (subjectIds.size === 1) {
                console.log(`[PASS] Found split for ${key}: ${parallelSlots.length} rooms used for Subject ${parallelSlots[0].subject?.code}`);
                console.log(`       Rooms: ${parallelSlots.map(s => s.room.name).join(", ")}`);
                splitFound = true;
            }
        }
    }

    if (splitFound) {
        console.log("SUCCESS: Venue splitting logic is working.");
    } else {
        console.log("WARNING: No venue splitting observed. Check student count vs room capacity.");
        console.log("Room capacities:", (await prisma.room.findMany({ where: { departmentId: dept.id } })).map(r => r.capacity));
    }
}

verifySplit()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
