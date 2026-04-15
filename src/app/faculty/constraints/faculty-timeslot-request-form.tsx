"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

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
  currentSlots: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [requestType, setRequestType] = useState("PREFERENCE");
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const [startTime, endTime] = slot.split("-").map((s) => s.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    try {
      const fullReason = `[${requestType}] ${reason}`;
      const res = await fetch("/api/faculty/timeslot-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: dayIndex,
          startTime,
          endTime,
          reason: fullReason,
          // instantly auto-approve to remove admin manual step
          status: "approved"
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to submit");
        return;
      }
      setReason("");
      alert("Request submitted successfully and automatically approved!");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
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
      <div className="space-y-2">
        <Label htmlFor="day">Day</Label>
        <select
          id="day"
          value={dayIndex}
          onChange={(e) => setDayIndex(Number(e.target.value))}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {days.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
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
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason (optional)</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Prefer morning slots"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
