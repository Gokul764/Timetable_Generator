import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RoomsContent } from "./rooms-content";

export default async function AdminRoomsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const user = session.user as { role: string; departmentId: string };
    if (user.role !== "admin") redirect("/");

    const departmentId = user.departmentId;

    const rooms = await prisma.room.findMany({
        where: { departmentId },
        orderBy: [{ code: "asc" }],
    });

    return <RoomsContent initialRooms={rooms as any} />;
}
