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
import { DAYS, TIMETABLE_PERIODS, cleanSubjectName } from "@/lib/utils";
import { StudentDownloadTimetableButton } from "../student-download-timetable-button";
import { CalendarDays, MapPin, GraduationCap } from "lucide-react";

export default async function StudentFullTimetablePage() {
    const session = await getServerSession(authOptions);
    const studentId = (session?.user as { studentId?: string })?.studentId;
    const departmentId = (session?.user as { departmentId?: string })?.departmentId;

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

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Full Timetable</h1>
                    <p className="text-muted-foreground mt-1">
                        Your academic schedule for Year {student.year}.
                    </p>
                </div>
                <StudentDownloadTimetableButton slots={allSlots} year={student.year} />
            </div>

            <Card className="shadow-lg border-t-4 border-t-rose-500">
                <CardHeader>
                    <CardTitle>Weekly Grid</CardTitle>
                    <CardDescription>View your full weekly schedule</CardDescription>
                </CardHeader>
                <CardContent>
                    {allSlots.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-lg">No timetable published yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Time</TableHead>
                                        {DAYS.map((d) => (
                                            <TableHead key={d} className="min-w-[180px] font-semibold">{d}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {TIMETABLE_PERIODS.map((period) => (
                                        <TableRow key={period.start} className="hover:bg-muted/5">
                                            <TableCell className="font-medium text-muted-foreground py-4">
                                                <div className="text-xs font-bold text-rose-600">{period.label}</div>
                                                <div className="text-[10px] whitespace-nowrap">{period.start}</div>
                                            </TableCell>
                                            {DAYS.map((_, dayIndex) => {
                                                const daySlots = allSlots.filter(
                                                    (s) => s.dayOfWeek === dayIndex && s.startTime === period.start
                                                );
                                                return (
                                                    <TableCell key={dayIndex} className="p-1 align-top h-24">
                                                        <div className="flex flex-col gap-1">
                                                            {daySlots.length > 0 ? (
                                                                daySlots.map((slot) => (
                                                                    <div 
                                                                        key={slot.id} 
                                                                        className={`rounded-md border p-2 shadow-sm flex flex-col justify-between transition-colors ${
                                                                            slot.type === 'lab'
                                                                                ? "bg-rose-50/50 border-rose-100 hover:border-rose-200 dark:bg-rose-900/10 dark:border-rose-800"
                                                                                : "bg-card border-border hover:border-rose-200"
                                                                        }`}
                                                                    >
                                                                        <div>
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                <span className={`text-[10px] font-bold px-1 rounded ${
                                                                                    slot.type === 'lab'
                                                                                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                                                                                        : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                                                                }`}>
                                                                                    {slot.subject?.code || "N/A"}
                                                                                </span>
                                                                                <span className="text-right text-[9px] font-bold text-muted-foreground">
                                                                                    {(slot as any).studentCount} Students
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-[11px] font-medium leading-tight line-clamp-1" title={slot.subject?.name}>
                                                                                {slot.subject ? cleanSubjectName(slot.subject.name) : "No Subject"}
                                                                            </p>
                                                                            {slot.type === 'lab' && (
                                                                                <span className="text-[9px] font-bold text-rose-600 bg-rose-100/50 px-1 rounded mt-0.5 inline-block uppercase tracking-wider">
                                                                                    Lab
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="mt-1 text-[10px] text-muted-foreground space-y-0.5">
                                                                            <div className="flex items-center gap-1">
                                                                                <MapPin className="h-3 w-3" /> {slot.room.name}
                                                                            </div>
                                                                            <div className="flex items-center gap-1 opacity-80">
                                                                                <GraduationCap className="h-3 w-3" /> {slot.faculty.user.name.split(' ')[0]}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="h-full w-full rounded-md border border-dashed border-transparent hover:border-border/50 transition-colors" />
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
