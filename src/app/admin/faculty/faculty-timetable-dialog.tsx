"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DAYS, TIMETABLE_PERIODS } from "@/lib/utils";
import { CalendarDays, MapPin, Loader2 } from "lucide-react";

interface Slot {
    id: string;
    dayOfWeek: number;
    startTime: string;
    subject: {
        code: string;
        name: string;
    };
    room: {
        name: string;
    };
}

interface FacultyTimetableDialogProps {
    facultyId: string;
    facultyName: string;
}

export function FacultyTimetableDialog({
    facultyId,
    facultyName,
}: FacultyTimetableDialogProps) {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            fetchTimetable();
        }
    }, [open]);

    const fetchTimetable = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/faculty/${facultyId}/timetable`);
            if (response.ok) {
                const data = await response.json();
                setSlots(data);
            }
        } catch (error) {
            console.error("Error fetching timetable:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    View Timetable
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Timetable: {facultyName}</DialogTitle>
                    <DialogDescription>
                        Weekly master schedule for this faculty member.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : slots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                        <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
                        <p>No slots assigned to this faculty member yet.</p>
                    </div>
                ) : (
                    <div className="rounded-md border mt-4">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[100px]">Time</TableHead>
                                    {DAYS.map((d) => (
                                        <TableHead key={d} className="font-semibold text-primary min-w-[180px]">
                                            {d}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {TIMETABLE_PERIODS.map((period) => (
                                    <TableRow key={period.start} className="hover:bg-muted/5">
                                        <TableCell className="font-medium text-muted-foreground py-4">
                                            <div className="text-xs font-bold text-indigo-600">
                                                {period.label}
                                            </div>
                                            <div className="text-[10px] whitespace-nowrap">
                                                {period.start}
                                            </div>
                                        </TableCell>
                                        {DAYS.map((_, dayIndex) => {
                                            const slot = slots.find(
                                                (s) =>
                                                    s.dayOfWeek === dayIndex &&
                                                    s.startTime === period.start
                                            );
                                            return (
                                                <TableCell
                                                    key={dayIndex}
                                                    className="p-1 align-top h-24"
                                                >
                                                    {slot ? (
                                                        <div className="h-full w-full rounded-md border bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800 p-2 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
                                                            <div>
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-1 rounded">
                                                                        {slot.subject?.code ||
                                                                            "N/A"}
                                                                    </span>
                                                                </div>
                                                                <p
                                                                    className="text-xs font-medium leading-tight line-clamp-2"
                                                                    title={slot.subject?.name}
                                                                >
                                                                    {slot.subject?.name ||
                                                                        "No Subject"}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 text-[10px] text-indigo-600 dark:text-indigo-400 space-y-0.5">
                                                                <div className="flex items-center gap-1 font-medium">
                                                                    <MapPin className="h-3 w-3" />{" "}
                                                                    {slot.room.name}
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
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
