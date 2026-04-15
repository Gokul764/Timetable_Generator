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
import { CalendarDays, MapPin } from "lucide-react";
import { DownloadTimetableButton } from "../download-timetable-button";

export default async function FacultySchedulePage() {
    const session = await getServerSession(authOptions);
    const facultyId = (session?.user as { facultyId?: string })?.facultyId;

    if (!facultyId) {
        redirect("/faculty");
    }

    const slots = await prisma.timetableSlot.findMany({
        where: { facultyId },
        include: {
            timetable: true,
            room: true,
            subject: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Master Schedule</h1>
                    <p className="text-muted-foreground mt-1">
                        Your complete weekly timetable across all years and departments.
                    </p>
                </div>
                <DownloadTimetableButton slots={slots} />
            </div>

            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Weekly Grid</CardTitle>
                    <CardDescription>View your assigned classes by day and time</CardDescription>
                </CardHeader>
                <CardContent>
                    {slots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <CalendarDays className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-medium">No slots assigned yet</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[100px]">Time</TableHead>
                                        {DAYS.map((d) => (
                                            <TableHead key={d} className="font-semibold text-primary min-w-[180px]">{d}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {TIMETABLE_PERIODS.map((period) => {
                                        return (
                                            <TableRow key={period.start} className="hover:bg-muted/5">
                                                <TableCell className="font-medium text-muted-foreground py-4">
                                                    <div className="text-xs font-bold text-indigo-600">{period.label}</div>
                                                    <div className="text-[10px] whitespace-nowrap">{period.start}</div>
                                                </TableCell>
                                                {DAYS.map((_, dayIndex) => {
                                                    const slot = slots.find(
                                                        (s) => s.dayOfWeek === dayIndex && s.startTime === period.start
                                                    );
                                                    return (
                                                        <TableCell key={dayIndex} className="p-1 align-top h-24">
                                                            {slot ? (
                                                                <div 
                                                                    className={`h-full w-full rounded-md border p-2 shadow-sm flex flex-col justify-between transition-colors ${
                                                                        slot.type === 'lab'
                                                                            ? "bg-rose-50/50 border-rose-100 hover:border-rose-300 dark:bg-rose-900/10 dark:border-rose-800"
                                                                            : "bg-indigo-50/50 border-indigo-100 hover:border-indigo-300 dark:bg-indigo-900/10 dark:border-indigo-800"
                                                                    }`}
                                                                >
                                                                    <div>
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className={`text-[10px] font-bold px-1 rounded ${
                                                                                slot.type === 'lab'
                                                                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                                                                                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                                                            }`}>
                                                                                {slot.subject?.code || "N/A"}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs font-medium leading-tight line-clamp-2" title={slot.subject?.name}>
                                                                            {slot.subject ? cleanSubjectName(slot.subject.name) : "No Subject"}
                                                                        </p>
                                                                        {slot.type === 'lab' && (
                                                                            <span className="text-[9px] font-bold text-rose-600 bg-rose-100/50 px-1 rounded mt-0.5 inline-block uppercase tracking-wider">
                                                                                Lab
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className={`mt-2 text-[10px] space-y-0.5 ${
                                                                        slot.type === 'lab' ? "text-rose-600 dark:text-rose-400" : "text-indigo-600 dark:text-indigo-400"
                                                                    }`}>
                                                                        <div className="flex items-center gap-1 font-medium">
                                                                            <MapPin className="h-3 w-3" /> {slot.room.name}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-full w-full rounded-md border border-dashed border-transparent hover:border-border/50 transition-colors" />
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
