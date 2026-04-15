import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAYS, TIMETABLE_PERIODS } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { EditSlotForm } from "./edit-slot-form";
import { cn } from "@/lib/utils";
import { AdminDownloadTimetableButton } from "./admin-download-timetable-button";
import { EditTimetableDialog } from "./edit-timetable-dialog";
import { YearNavigation } from "./year-navigation";
import { AddSlotForm } from "./add-slot-form";

export default async function AdminTimetableEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  if (!departmentId) redirect("/admin");

  const { id } = await params;
  const allTimetables = await prisma.timetable.findMany({
    where: { departmentId },
    select: { id: true, year: true, semester: true },
    orderBy: [{ year: "asc" }, { semester: "asc" }],
  });

  const timetable = await prisma.timetable.findFirst({
    where: { id, departmentId },
    include: {
      slots: {
        include: {
          room: true,
          faculty: { include: { user: true } },
          subject: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });
  if (!timetable) notFound();

  const [subjects, rooms, faculty] = await Promise.all([
    prisma.subject.findMany({
      where: { departmentId, year: timetable.year },
      orderBy: { code: "asc" },
    }),
    prisma.room.findMany({
      where: { departmentId },
      orderBy: { code: "asc" },
    }),
    prisma.faculty.findMany({
      include: { 
          user: true,
          department: { select: { code: true } }
      },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const byDay = DAYS.map((_, dayIndex) =>
    timetable.slots.filter((s) => s.dayOfWeek === dayIndex)
  );

  // LOGICAL: Identify conflicts (Faculty double-booked in same slot)
  const conflictsPerSlot = new Map<string, string[]>();
  timetable.slots.forEach((s) => {
    const doubleBooked = timetable.slots.filter(
      (other) => 
        other.id !== s.id && 
        other.dayOfWeek === s.dayOfWeek && 
        other.startTime === s.startTime &&
        other.facultyId === s.facultyId
    );
    if (doubleBooked.length > 0) {
      conflictsPerSlot.set(s.id, [`Faculty double-booked: ${s.faculty.user.name}`]);
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <YearNavigation 
        currentId={timetable.id} 
        timetables={allTimetables} 
      />

      <div className="flex flex-col md:flex-row md:items-center gap-6 pb-2">
        <Link 
          href="/admin/timetable" 
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-xl border-border/50 hover:bg-muted"
          )}
        >
          ← Back to Registry
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h1 className="text-3xl font-black tracking-tight uppercase italic">
              Batch Schedule <span className="text-primary tracking-normal not-italic">— Year {timetable.year}, Sem {timetable.semester}</span>
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm font-medium tracking-wide">
            Manual override mode enabled. System resource constraints are visualized below.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <EditTimetableDialog
            timetableId={timetable.id}
            initialYear={timetable.year}
            initialSemester={timetable.semester}
          />
          <AdminDownloadTimetableButton
            slots={timetable.slots as any}
            year={timetable.year}
            semester={timetable.semester}
          />
        </div>
      </div>

      <Card className="rounded-[2rem] border-border/40 bg-card/20 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
        <CardHeader className="bg-muted/30 border-b border-border/20 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Interactive Time Matrix</CardTitle>
              <CardDescription className="font-medium">Modify curriculum blocks. Conflicts are highlighted in red.</CardDescription>
            </div>
            {/* Color Legend */}
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-indigo-500/20 border border-indigo-500/30" /> Theory</div>
                <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-rose-500/20 border border-rose-500/30" /> Lab</div>
                <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-amber-500/20 border border-amber-500/40 animate-pulse" /> Conflict</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
            <Table className="border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-30 bg-background/95 backdrop-blur shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[120px] bg-muted/20 border-b border-r border-border/20 font-black text-xs uppercase tracking-tighter sticky left-0 z-40 p-4">
                    Timeline
                  </TableHead>
                  {DAYS.map((d) => (
                    <TableHead key={d} className="bg-muted/10 border-b border-border/20 text-center font-black text-xs uppercase tracking-widest py-4 px-6">
                      {d}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {TIMETABLE_PERIODS.map((period) => (
                  <TableRow key={period.start} className="hover:bg-muted/5 group">
                    <TableCell className="bg-muted/5 border-b border-r border-border/20 font-medium sticky left-0 z-20 p-4 backdrop-blur-md">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-xs font-black tracking-tighter text-primary">{period.label}</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-background border border-border/40 rounded-full shadow-sm text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                            {period.start} - {period.end}
                        </div>
                      </div>
                    </TableCell>
                    {DAYS.map((_, dayIndex) => {
                      const daySlots = timetable.slots.filter(
                        (s) => s.dayOfWeek === dayIndex && s.startTime === period.start
                      );
                      return (
                        <TableCell key={dayIndex} className="p-3 align-top min-w-[180px] border-b border-border/20 transition-colors group-hover:border-primary/10">
                          <div className="flex flex-col gap-3">
                            {daySlots.length > 0 ? (
                              daySlots.map((slot) => {
                                const conflicts = conflictsPerSlot.get(slot.id);
                                return (
                                  <div key={slot.id} className={cn(
                                    "relative transition-all duration-300",
                                    conflicts && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background rounded-xl shadow-lg shadow-amber-500/10 scale-[1.02]"
                                  )}>
                                    <EditSlotForm
                                      slotId={slot.id}
                                      initialSubjectId={slot.subjectId || ""}
                                      initialRoomId={slot.roomId}
                                      initialFacultyId={slot.facultyId}
                                      initialType={(slot as any).type || "theory"}
                                      roomName={slot.room.name}
                                      facultyName={slot.faculty.user.name}
                                      subjects={subjects as any}
                                      rooms={rooms}
                                      faculty={faculty as any}
                                      currentDepartmentId={departmentId}
                                      studentCount={(slot as any).studentCount}
                                      conflicts={conflicts}
                                    />
                                  </div>
                                );
                              })
                            ) : (
                              <div className="h-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <AddSlotForm
                                  timetableId={timetable.id}
                                  dayOfWeek={dayIndex}
                                  startTime={period.start}
                                  endTime={period.end}
                                  subjects={subjects as any}
                                  rooms={rooms}
                                  faculty={faculty as any}
                                  currentDepartmentId={departmentId}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
