"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SLOTS = [
  "08:45-09:35",
  "09:35-10:25",
  "10:40-11:30",
  "11:30-12:30",
  "13:30-14:20",
  "14:20-15:10",
  "15:25-16:25",
];

export function FacultyTimeslotRequestForm({
  facultyId: _facultyId,
  days,
  currentSlots,
}: {
  facultyId: string;
  days: string[];
  currentSlots: { id: string; label: string; dayOfWeek: number; startTime: string; endTime: string }[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"CONSTRAINT" | "MOVE">("CONSTRAINT");
  const [requestType, setRequestType] = useState("PREFERENCE");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const [startTime, endTime] = slot.split("-").map((s) => s.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    try {
      const isMove = mode === "MOVE";
      const fullReason = isMove 
        ? `[MOVE] ${reason}` 
        : `[${requestType}] ${reason}`;
        
      const res = await fetch("/api/faculty/timeslot-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: dayIndex,
          startTime,
          endTime,
          reason: fullReason,
          targetSlotId: isMove ? selectedSlotId : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to submit");
        return;
      }

      setReason("");
      alert(isMove 
        ? "Move request submitted! The admin will verify if the target slot is available."
        : "Constraint submitted successfully!"
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="flex p-1 bg-muted rounded-lg w-full">
        <button
          type="button"
          onClick={() => setMode("CONSTRAINT")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
            mode === "CONSTRAINT" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          General Constraint
        </button>
        <button
          type="button"
          onClick={() => setMode("MOVE")}
          className={cn(
            "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
            mode === "MOVE" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Move Specific Class
        </button>
      </div>

      {mode === "MOVE" ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label htmlFor="source-slot" className="text-purple-700">Class to Move</Label>
            <select
              id="source-slot"
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 transition-all"
              required
            >
              <option value="">Select a class...</option>
              {currentSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-purple-700">Target Destination</Label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={dayIndex}
                onChange={(e) => setDayIndex(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {days.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            <Label htmlFor="type">Request Type</Label>
            <select
              id="type"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="PREFERENCE">I Prefer to Teach at this time</option>
              <option value="UNAVAILABLE">I am Unavailable at this time</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <select
                id="day"
                value={dayIndex}
                onChange={(e) => setDayIndex(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {days.map((d, i) => (
                  <option key={d} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot">Time slot</Label>
              <select
                id="slot"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={mode === "MOVE" ? "Why do you want to move this?" : "e.g. Prefer morning slots"}
          className="transition-all focus:ring-2 focus:ring-primary"
        />
      </div>

      <Button 
        type="submit" 
        disabled={loading || (mode === "MOVE" && !selectedSlotId)} 
        className="w-full"
      >
        {loading ? "Submitting…" : mode === "MOVE" ? "Request Move" : "Submit Request"}
      </Button>
    </form>
  );
}
