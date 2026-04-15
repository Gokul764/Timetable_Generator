
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Timetables...");

    const timetables = await prisma.timetable.findMany({
        include: {
            department: true,
            _count: {
                select: { slots: true }
            }
        }
    });

    if (timetables.length === 0) {
        console.log("No timetables found.");
    } else {
        console.table(timetables.map(t => ({
            Dept: t.department.code,
            Year: t.year,
            Sem: t.semester,
            Slots: t._count.slots,
            Published: t.isPublished
        })));
    }

    // Check slots for a specific timetable if exists
    if (timetables.length > 0) {
        const firstId = timetables[0].id;
        const slots = await prisma.timetableSlot.findMany({
            where: { timetableId: firstId },
            take: 5,
            include: { subject: true, room: true, faculty: { include: { user: true } } }
        });

        console.log("\nSample Slots:");
        slots.forEach(s => {
            console.log(`${s.dayOfWeek} ${s.startTime}-${s.endTime}: ${s.subject?.code} in ${s.room.code} by ${s.faculty.user.name}`);
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
