"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2, AlertTriangle } from "lucide-react";
import { cleanSubjectName, cn } from "@/lib/utils";

export function EditSlotForm({
  slotId,
  initialSubjectId,
  initialRoomId,
  initialFacultyId,
  initialType,
  roomName,
  facultyName,
  subjects,
  rooms,
  faculty,
  currentDepartmentId,
  studentCount,
  conflicts,
}: {
  slotId: string;
  initialSubjectId: string;
  initialRoomId: string;
  initialFacultyId: string;
  initialType: string;
  roomName: string;
  facultyName: string;
  subjects: { id: string; code: string; name: string; isLab?: boolean; labSessionsPerWeek?: number; isCore: boolean }[];
  rooms: { id: string; name: string; code: string }[];
  faculty: { id: string; departmentId: string; user: { name: string }; department?: { code: string } }[];
  currentDepartmentId: string;
  studentCount?: number;
  conflicts?: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subjectId, setSubjectId] = useState(initialSubjectId);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [facultyId, setFacultyId] = useState(initialFacultyId);
  const [type, setType] = useState(initialType || "theory");

  const selectedSubject = subjects.find((s) => s.id === (subjectId || initialSubjectId));
  const selectedRoom = rooms.find((r) => r.id === (roomId || initialRoomId));
  const selectedFaculty = faculty.find((f) => f.id === (facultyId || initialFacultyId));

  // LOGICAL: If subject is core, show only local faculty. Otherwise show all.
  const isSubjectCore = selectedSubject?.isCore ?? true;
  const filteredFaculty = faculty.filter(f => 
    !isSubjectCore || f.departmentId === currentDepartmentId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/admin/timetable/slots/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        roomId,
        facultyId,
        type,
      }),
    });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
            "text-left w-full rounded-xl border p-3 transition-all duration-300 group relative",
            type === 'lab' 
              ? "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 ring-rose-500/10" 
              : "bg-indigo-500/5 border-indigo-500/10 hover:bg-indigo-500/10 ring-indigo-500/10",
            conflicts && "border-amber-500/50 bg-amber-500/5 ring-4 ring-amber-500/10 shadow-lg shadow-amber-500/5"
        )}
      >
        <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-black tracking-tight text-foreground/90 uppercase truncate">{selectedSubject?.code || "No Subject"}</p>
            {type === 'lab' && (
                <span className="text-[9px] font-black text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 uppercase tracking-widest">
                Lab
                </span>
            )}
        </div>
        <p className="text-[10px] font-bold text-muted-foreground truncate italic mt-0.5">
          {selectedSubject ? cleanSubjectName(selectedSubject.name) : "Select Subject"}
        </p>
        
        <div className="mt-3 space-y-1">
            <p className="text-[10px] font-bold text-foreground/60 flex items-center gap-1.5 truncate">
                <span className="h-1 w-1 rounded-full bg-primary/40" />
                {selectedRoom?.code || roomName}
            </p>
            <p className="text-[10px] font-bold text-foreground/60 flex items-center gap-1.5 truncate">
                <span className="h-1 w-1 rounded-full bg-primary/40" />
                {selectedFaculty?.user.name || facultyName}
            </p>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/10">
          <p className="text-[9px] font-black text-primary/70 bg-primary/5 px-2 py-0.5 rounded-md uppercase tracking-tighter">
            {studentCount || 0} Students
          </p>
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="h-2.5 w-2.5" /> Edit
          </span>
        </div>

        {conflicts && (
            <div className="absolute -top-2 -right-2 h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-background animate-bounce z-10">
                <AlertTriangle className="h-3 w-3" />
            </div>
        )}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-2 rounded border border-primary/50 bg-card min-w-[150px]">
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase text-muted-foreground">Subject</label>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="w-full rounded border border-input bg-background px-2 py-1 text-xs h-8"
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

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} className="h-7 text-xs">
            Cancel
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="h-7 text-xs w-full"
          onClick={async () => {
            if (confirm("Are you sure you want to delete this slot?")) {
              setLoading(true);
              await fetch(`/api/admin/timetable/slots/${slotId}`, { method: "DELETE" });
              setOpen(false);
              router.refresh();
            }
          }}
          disabled={loading}
        >
          Delete Slot
        </Button>
      </div>
    </form>
  );
}
