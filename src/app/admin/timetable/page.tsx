import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
    Calendar, 
    AlertCircle, 
    CheckCircle2,
    Settings2
} from "lucide-react";
import { GenerateTimetableButton } from "./generate-timetable-button";
import { PublishButton } from "./publish-button";
import { DeleteTimetableButton } from "./delete-timetable-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminTimetablePage() {
  const session = await getServerSession(authOptions);
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  if (!departmentId) redirect("/admin");

  const timetables = await prisma.timetable.findMany({
    where: { departmentId },
    include: { 
        slots: {
            select: { dayOfWeek: true, startTime: true, facultyId: true, roomId: true, id: true }
        },
        _count: { select: { slots: true } } 
    },
    orderBy: [{ year: "asc" }, { semester: "asc" }],
  });

  // Calculate conflicts per timetable
  const ttWithHealth = timetables.map(tt => {
    const hasConflicts = tt.slots.some(s => 
        tt.slots.some(other => 
            other.id !== s.id && 
            other.dayOfWeek === s.dayOfWeek && 
            other.startTime === s.startTime &&
            (other.facultyId === s.facultyId || other.roomId === s.roomId)
        )
    );
    return { ...tt, hasConflicts };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Schedules</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage timetables for Year 1 to Year 4
          </p>
        </div>
        <GenerateTimetableButton departmentId={departmentId} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
                <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Timetable Registry</CardTitle>
              <CardDescription>Click a semester to edit sessions or handle conflicts</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((year) => (
              <div key={year} className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground border-b pb-2">Year {year}</h3>
                <div className="grid gap-2">
                  {[(year - 1) * 2 + 1, (year - 1) * 2 + 2].map((sem) => {
                    const tt = ttWithHealth.find((t) => t.year === year && t.semester === sem);
                    return (
                      <div key={`${year}-${sem}`} className="flex gap-2 items-center">
                        <Link href={tt ? `/admin/timetable/${tt.id}` : "#"} className="flex-1">
                          <Button
                            variant={tt ? "outline" : "secondary"}
                            className="w-full justify-between h-auto py-3 px-4"
                            disabled={!tt}
                          >
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-sm font-bold">Sem {sem}</span>
                                {tt && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground">{tt._count.slots} sessions</span>
                                        {tt.hasConflicts ? (
                                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] py-0 px-2 font-bold">
                                                Conflict
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] py-0 px-2 font-bold">
                                                Stable
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                            {tt?.isPublished && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] font-bold">Live</Badge>
                            )}
                          </Button>
                        </Link>
                        {tt && (
                          <div className="flex flex-col gap-1">
                            <PublishButton timetableId={tt.id} isPublished={tt.isPublished} />
                            <DeleteTimetableButton timetableId={tt.id} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {ttWithHealth.length === 0 && (
            <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed mt-4">
                <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium italic">
                    No schedules detected. Start by generating a batch above.
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
