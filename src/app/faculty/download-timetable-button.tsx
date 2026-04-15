"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DAYS, TIMETABLE_PERIODS, cleanSubjectName } from "@/lib/utils";
import { jsPDF } from "jspdf";

type Slot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: string;
  subject: { code: string; name: string } | null;
  room: { name: string };
};

export function DownloadTimetableButton({ slots }: { slots: Slot[] }) {
  const [loading, setLoading] = useState(false);

  function handleDownload() {
    setLoading(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(16);
      doc.text("My Timetable", 14, 15);
      doc.setFontSize(10);
      const colW = (doc.internal.pageSize.getWidth() - 28) / 6;
      const startY = 25;
      doc.text("Time", 14, startY);
      DAYS.forEach((d, i) => {
        doc.text(d, 14 + colW * (i + 1), startY);
      });
      let y = startY + 8;
      TIMETABLE_PERIODS.forEach((period) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${period.label}\n${period.start}`, 14, y);
        doc.setFont("helvetica", "normal");
        DAYS.forEach((_, dayIndex) => {
          const slot = slots.find((s) => s.dayOfWeek === dayIndex && s.startTime === period.start);
          const text = slot
            ? `${slot.subject?.code || "N/A"} (${slot.subject ? cleanSubjectName(slot.subject.name) : ""})\n${slot.room.name}`
            : "—";
          doc.text(text, 14 + colW * (dayIndex + 1), y);
        });
        y += 18;
      });
      doc.save("my-timetable.pdf");
    } finally {
      setLoading(false);
    }
  }

  if (slots.length === 0) return null;

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading}>
      <Download className="h-4 w-4 mr-2" />
      {loading ? "Downloading…" : "Download PDF"}
    </Button>
  );
}
