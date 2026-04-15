"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { DAYS, TIMETABLE_PERIODS, cleanSubjectName } from "@/lib/utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type Slot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: string;
  subject: { code: string; name: string } | null;
  room: { name: string };
  faculty: { user: { name: string } };
};

export function StudentDownloadTimetableButton({
  slots,
  year,
}: {
  slots: Slot[];
  year: number;
}) {
  const [loading, setLoading] = useState(false);

  function handleDownload() {
    setLoading(true);
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const timestamp = new Date().toLocaleString();

      // Header Section
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("UNIVERSITY ACADEMIC TIMETABLE", 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(`Student Schedule View | Year ${year} | Generated: ${timestamp}`, 14, 28);

      const head = [["TIME", ...DAYS]];
      const body = TIMETABLE_PERIODS.map((period) => {
        const row: any[] = [`${period.label}\n${period.start}`];
        DAYS.forEach((_, dayIndex) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === dayIndex && s.startTime === period.start);
          if (daySlots.length > 0) {
            const cellText = daySlots.map(slot => {
              const sub = slot.subject ? `${slot.subject.code}\n${cleanSubjectName(slot.subject.name)}` : "N/A";
              const rm = slot.room.name;
              const fac = slot.faculty.user.name.split(' ')[0];
              return `${sub}\n[${rm}] | ${fac}`;
            }).join('\n──────────\n');
            row.push({
              content: cellText,
              styles: {
                fillColor: daySlots.some(s => s.type === "lab") ? [254, 242, 242] : [255, 255, 255],
                textColor: daySlots.some(s => s.type === "lab") ? [153, 27, 27] : [30, 41, 59],
              }
            });
          } else {
            row.push("—");
          }
        });
        return row;
      });

      autoTable(doc, {
        startY: 35,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59], // Slate-800
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        bodyStyles: {
          fontSize: 8,
          valign: 'middle',
          minCellHeight: 22,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'center', fillColor: [248, 250, 252], cellWidth: 30 }
        },
        margin: { top: 35, bottom: 20 },
        didDrawPage: (data) => {
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Official Academic System | Page ${data.pageNumber}`, 14, doc.internal.pageSize.getHeight() - 10);
        }
      });

      doc.save(`student-timetable-year-${year}.pdf`);
    } finally {
      setLoading(false);
    }
  }

  if (slots.length === 0) return null;

  return (
    <Button variant="outline" onClick={handleDownload} disabled={loading} className="font-bold border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
      <Download className="h-4 w-4 mr-2" />
      {loading ? "Exporting..." : "Download Official PDF"}
    </Button>
  );
}
