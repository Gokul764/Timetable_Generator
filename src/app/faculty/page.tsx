import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DAYS } from "@/lib/utils";
import { DownloadTimetableButton } from "./download-timetable-button";
import { BookOpen, CalendarDays, CheckCircle2, Clock, MapPin, Settings } from "lucide-react";
import Link from "next/link";

export default async function FacultyTimetablePage() {
  const session = await getServerSession(authOptions);
  const facultyId = (session?.user as { facultyId?: string })?.facultyId;
  const facultyName = (session?.user as { name?: string })?.name || "Faculty";

  if (!facultyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <BookOpen className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          No faculty profile linked to your account.
        </p>
      </div>
    );
  }

  const slots = await prisma.timetableSlot.findMany({
    where: { facultyId },
    include: {
      timetable: true,
      room: true,
      subject: true,
      faculty: true,
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
  // Adjust for 1-based index if needed, or matched with DAYS array
  const todaySlots = slots.filter((s) => s.dayOfWeek === todayIndex);

  // Find next class today
  const currentHour = new Date().getHours();
  // Simple comparison for demo (assuming startTimes are "HH:00")
  const nextClass = todaySlots.find(s => parseInt(s.startTime) >= currentHour);

  const totalHours = slots.length; // Assuming each slot is 1 hour

  return (
    <div className="space-y-8">
      {/* Welcome & Next Class Hero */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {facultyName}</h1>
            {slots.length > 0 && slots[0].faculty.designation && (
              <p className="text-lg opacity-80 mb-4 italic">
                {slots[0].faculty.designation}
              </p>
            )}
            <p className="opacity-90 max-w-lg">
              You have {todaySlots.length} classes scheduled for today.
            </p>

            {nextClass ? (
              <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 inline-block">
                <p className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Up Next</p>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">{nextClass.startTime}</div>
                  <div className="h-8 w-px bg-white/20" />
                  <div>
                    <div className="font-semibold">{nextClass.subject?.code || "N/A"}</div>
                    <div className="text-sm opacity-90">{nextClass.room.name}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
                <span>All caught up for today!</span>
              </div>
            )}
          </div>
          {/* Decorative background elements */}
          <div className="absolute right-0 top-0 h-64 w-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm h-full border-l-4 border-l-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Load</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-indigo-600">{totalHours}</div>
              <p className="text-sm text-muted-foreground">Hours / week</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-dashed bg-muted/30">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-full">
              <div className="mb-2 rounded-full bg-primary/10 p-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <DownloadTimetableButton slots={slots} />
              <p className="text-xs text-muted-foreground mt-2">Export Calendar</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Today's Timeline */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Today's Schedule
          </h3>
          <div className="relative border-l-2 border-muted ml-3 space-y-8 py-2">
            {todaySlots.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-6 italic">No classes today.</p>
            ) : (
              todaySlots.map((slot) => (
                <div key={slot.id} className="relative pl-6">
                  <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex flex-col gap-1 rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-xs font-bold text-primary">{slot.startTime}</span>
                    <span className="font-semibold text-sm">{slot.subject?.name}</span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {slot.room.name}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links / Summary */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Faculty Resources</CardTitle>
              <CardDescription>Manage your schedule and preferences</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Link href="/faculty/schedule" className="flex items-center p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <CalendarDays className="h-8 w-8 text-primary mr-4" />
                <div>
                  <div className="font-semibold">Full Schedule</div>
                  <div className="text-sm text-muted-foreground">View your weekly grid</div>
                </div>
              </Link>
              <Link href="/faculty/constraints" className="flex items-center p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <Settings className="h-8 w-8 text-indigo-500 mr-4" />
                <div>
                  <div className="font-semibold">Constraints</div>
                  <div className="text-sm text-muted-foreground">Request to move classes</div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
