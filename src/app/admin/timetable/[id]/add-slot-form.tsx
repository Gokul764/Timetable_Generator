"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export function AddSlotForm({
    timetableId,
    dayOfWeek,
    startTime,
    endTime,
    subjects,
    rooms,
    faculty,
    currentDepartmentId,
}: {
    timetableId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    subjects: { id: string; code: string; name: string; isLab?: boolean; labSessionsPerWeek?: number; isCore: boolean }[];
    rooms: { id: string; name: string; code: string }[];
    faculty: { id: string; departmentId: string; user: { name: string }; department?: { code: string } }[];
    currentDepartmentId: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [subjectId, setSubjectId] = useState("");
    const [roomId, setRoomId] = useState("");
    const [facultyId, setFacultyId] = useState("");
    const [studentCount, setStudentCount] = useState("60");
    const [type, setType] = useState("theory");

    const selectedSubject = subjects.find(s => s.id === subjectId);
    const isSubjectCore = selectedSubject?.isCore ?? true;
    const filteredFaculty = faculty.filter(f => 
        !isSubjectCore || f.departmentId === currentDepartmentId
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/timetable/slots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    timetableId,
                    subjectId,
                    roomId,
                    facultyId,
                    dayOfWeek,
                    startTime,
                    endTime,
                    type,
                    studentCount: parseInt(studentCount),
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }

            setOpen(false);
            setSubjectId("");
            setRoomId("");
            setFacultyId("");
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to add slot");
        } finally {
            setLoading(false);
        }
    }

    if (!open) {
        return (
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                className="w-full h-8 border border-dashed border-border bg-muted/5 hover:bg-muted/10 text-muted-foreground"
            >
                <Plus className="h-4 w-4 mr-1" /> Add Slot
            </Button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2 p-2 rounded border border-primary/50 bg-card min-w-[150px] shadow-sm">
            <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Subject</label>
                <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs h-8"
                    required
                >
                    <option value="" disabled>Select Subject</option>
                    {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.code} - {s.name} {s.isLab ? `(Lab - ${s.labSessionsPerWeek} sessions/week)` : ""}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Room</label>
                <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs h-8"
                    required
                >
                    <option value="" disabled>Select Room</option>
                    {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                            {r.code} - {r.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Faculty</label>
                <select
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs h-8"
                    required
                >
                    <option value="" disabled>Select Faculty</option>
                    {filteredFaculty.map((f) => (
                        <option key={f.id} value={f.id}>
                            {f.user.name} {f.department?.code ? `[${f.department.code}]` : ""}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Students</label>
                <Input
                    type="number"
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Count"
                    required
                />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground">Type</label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1 text-xs h-8"
                >
                    <option value="theory">Theory</option>
                    <option value="lab">Lab</option>
                </select>
            </div>

            <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={loading}>
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} className="h-7 text-xs">
                    Cancel
                </Button>
            </div>
        </form>
    );
}

// Helper Input component if not using a separate file for simplicity in this artifact, 
// but I should probably import it from UI.
// Actually, I'll just use a standard input or check if I can import Input.
// In the current codebase, Input is usually imported from @/components/ui/input.
import { Input } from "@/components/ui/input";
