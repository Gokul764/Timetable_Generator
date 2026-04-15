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
import { StudentDownloadTimetableButton } from "./student-download-timetable-button";
import { BookOpen, CalendarDays, Clock, MapPin, Sparkles, GraduationCap } from "lucide-react";
import Link from "next/link";

export default async function StudentTimetablePage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { studentId?: string })?.studentId;
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  const studentName = (session?.user as { name?: string })?.name || "Student";

  if (!studentId || !departmentId) redirect("/student");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      year: true,
      subjects: {
        select: { id: true }
      }
    },
  });
  if (!student) redirect("/student");

  const enrolledSubjectIds = new Set(student.subjects.map(s => s.id));

  const timetables = await prisma.timetable.findMany({
    where: { departmentId, year: student.year, isPublished: true },
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
    orderBy: [{ semester: "asc" }],
  });

  const allSlots = timetables
    .flatMap((t) => t.slots)
    .filter((slot) => slot.subjectId && enrolledSubjectIds.has(slot.subjectId));

  const todayIndex = new Date().getDay(); // 0-6
  const todaySlots = allSlots.filter((s) => s.dayOfWeek === todayIndex);

  const currentHour = new Date().getHours();
  // Simple "Now" logic: starts this hour
  const currentSlot = todaySlots.find(s => parseInt(s.startTime) === currentHour);
  // "Next" logic: starts after this hour
  const nextSlot = todaySlots.find(s => parseInt(s.startTime) > currentHour);

  return (
    <div className="space-y-8">
      {/* Header with Welcome */}
      <div className="relative rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 p-8 text-white shadow-lg overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Hi, {studentName} 👋</h1>
            <p className="opacity-90">
              Year {student.year} • {todaySlots.length} classes on your schedule today
            </p>
          </div>
          <StudentDownloadTimetableButton slots={allSlots} year={student.year} />
        </div>
        <div className="absolute right-0 top-0 h-48 w-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Sidebar: Now & Next + Daily Schedule */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card className="border-l-4 border-l-pink-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              {currentSlot ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="font-bold text-lg">In Class</span>
                  </div>
                  <p className="font-semibold text-lg">{currentSlot.subject?.name || "Unknown Subject"}</p>
                  <p className="text-muted-foreground">{currentSlot.room.name}</p>
                </div>
              ) : nextSlot ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="font-bold text-lg">Up Next</span>
                  </div>
                  <p className="font-semibold text-lg">{nextSlot.subject?.name || "Unknown Subject"}</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <span className="bg-muted px-1 rounded text-xs font-mono">{nextSlot.startTime}</span>
                    at {nextSlot.room.name}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <span>Free for the rest of the day!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's List */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" /> Today
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              {todaySlots.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">No classes scheduled.</p>
              ) : (
                <div className="space-y-1">
                  {todaySlots.map(slot => (
                    <div key={slot.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center min-w-[3rem]">
                        <span className="text-sm font-bold">{slot.startTime}</span>
                      </div>
                      <div className="h-8 w-px bg-border" />
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{slot.subject?.name} ({slot.subject?.code})</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {slot.room.name}
                          <span className="mx-1">•</span>
                          <GraduationCap className="h-3 w-3" /> {slot.faculty.user.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Announcements Placeholder */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Department Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Mid-sem exams start next week. Please check your exam seating arrangement.
              </p>
              <p className="text-xs text-right mt-2 opacity-60">Posted 2 days ago</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Department Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-muted/30 border-dashed">
            <CardHeader>
              <CardTitle>Timetable Actions</CardTitle>
              <CardDescription>Shortcut to your full weekly plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/timetable" className="flex items-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md hover:border-rose-200 transition-all group">
                <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <CalendarDays className="h-6 w-6 text-rose-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg">View Full Weekly Timetable</h4>
                  <p className="text-muted-foreground">Access your complete multi-semester schedule</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Additional Info / Features */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Academic Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mid-sem exams start next week. Please check your exam seating arrangement in the department portal.
                </p>
                <p className="text-xs text-right mt-4 opacity-70">Posted Feb 23, 2026</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-100 dark:border-amber-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Lab Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The Computing Lab (R-204) will be open until 8:00 PM this week for project submissions.
                </p>
                <p className="text-xs text-right mt-4 opacity-70">Posted today</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
