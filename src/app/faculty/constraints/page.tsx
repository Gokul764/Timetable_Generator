import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FacultyTimeslotRequestForm } from "./faculty-timeslot-request-form";
import { DAYS } from "@/lib/utils";

export default async function FacultyRequestSlotPage() {
  const session = await getServerSession(authOptions);
  const facultyId = (session?.user as { facultyId?: string })?.facultyId;
  if (!facultyId) return null;

  const slots = await prisma.timetableSlot.findMany({
    where: { facultyId },
    include: {
      subject: true,
      room: true,
      timetable: true,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Set Teaching Constraints</h1>
        <p className="text-muted-foreground mt-1">
          Specify your preferred teaching times or mark blocks where you are unavailable. The AI scheduler will automatically integrate these rules during timetable generation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Availability Request</CardTitle>
          <CardDescription>
            Choose the day and time you wish to specify constraints for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FacultyTimeslotRequestForm
            facultyId={facultyId}
            days={[...DAYS]}
            currentSlots={slots.map(s => ({
              id: s.id,
              label: `${s.subject?.name || "Unknown"} (${DAYS[s.dayOfWeek]} ${s.startTime})`,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
