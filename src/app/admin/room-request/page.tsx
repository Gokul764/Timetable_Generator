import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomRequestForm } from "./room-request-form";

export default async function AdminRoomRequestPage() {
  const session = await getServerSession(authOptions);
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  if (!departmentId) redirect("/admin");

  const [myDept, otherDepartments, rooms] = await Promise.all([
    prisma.department.findUnique({
      where: { id: departmentId },
      include: { rooms: true },
    }),
    prisma.department.findMany({
      where: { id: { not: departmentId } },
      include: { rooms: true },
      orderBy: { name: "asc" },
    }),
    prisma.room.findMany({ where: { departmentId: { not: departmentId } }, include: { department: true } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request room from another department</h1>
        <p className="text-muted-foreground mt-1">
          Send a request to Super Admin to use a room from another department
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New room request</CardTitle>
          <CardDescription>
            Select the department and room you want to use. Super Admin will approve or reject.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomRequestForm
            departmentId={departmentId}
            rooms={rooms.map((r) => ({ id: r.id, name: r.name, code: r.code, departmentName: r.department.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
