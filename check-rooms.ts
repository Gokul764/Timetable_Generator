
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Venues (Rooms) for AIDS...");
    const rooms = await prisma.room.findMany({
        where: {
            department: { code: "AIDS" }
        }
    });

    if (rooms.length === 0) {
        console.log("No venues found for AIDS.");
    } else {
        console.table(rooms.map(r => ({
            Code: r.code,
            Name: r.name,
            Capacity: r.capacity
        })));
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
