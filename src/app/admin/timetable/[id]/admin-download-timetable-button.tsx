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

interface AdminDownloadTimetableButtonProps {
    slots: Slot[];
    year: number;
    semester: number;
    departmentName?: string;
}

export function AdminDownloadTimetableButton({ slots, year, semester, departmentName = "Department of Engineering" }: AdminDownloadTimetableButtonProps) {
    const [loading, setLoading] = useState(false);

    function handleDownload() {
        setLoading(true);
        try {
            const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
            const timestamp = new Date().toLocaleString();
            
            // Header Section
            doc.setFontSize(22);
            doc.setTextColor(40, 44, 52); // Dark grey
            doc.text(departmentName.toUpperCase(), 14, 20);
            
            doc.setFontSize(14);
            doc.setTextColor(100, 116, 139); // Slate-500
            doc.text(`Official Academic Schedule - Year ${year}, Semester ${semester}`, 14, 28);

            // Table Header Construction
            const head = [["TIME", ...DAYS]];
            
            // Table Body Construction
            const body = TIMETABLE_PERIODS.map((period) => {
                const row: any[] = [`${period.label}\n${period.start} - ${period.end}`];
                
                DAYS.forEach((_, dayIndex) => {
                    const daySlots = slots.filter((s) => s.dayOfWeek === dayIndex && s.startTime === period.start);
                    if (daySlots.length > 0) {
                        const cellContent = daySlots.map(slot => {
                            const sub = slot.subject ? `${slot.subject.code}\n${cleanSubjectName(slot.subject.name)}` : "N/A";
                            const fac = slot.faculty.user.name.split(' ').slice(0, 2).join(' '); // Shorten name
                            return `${sub}\n[RM: ${slot.room.name}] | ${fac}`;
                        }).join('\n──────────\n');
                        row.push({
                            content: cellContent,
                            styles: {
                                fillColor: daySlots.some(s => s.type === "lab") ? [255, 241, 242] : [248, 250, 252], // Rose-50 or Slate-50
                                textColor: daySlots.some(s => s.type === "lab") ? [190, 18, 60] : [30, 41, 59], // Rose-700 or Slate-800
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
                    fillColor: [79, 70, 229], // Indigo-600
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    cellPadding: 4
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [51, 65, 85],
                    valign: 'middle',
                    cellPadding: 3,
                    minCellHeight: 25
                },
                columnStyles: {
                    0: { fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249], cellWidth: 30 }
                },
                alternateRowStyles: {
                    fillColor: [255, 255, 255]
                },
                margin: { top: 35, left: 14, right: 14, bottom: 20 },
                styles: {
                    font: 'helvetica',
                    lineWidth: 0.1,
                    lineColor: [226, 232, 240]
                },
                didDrawPage: (data) => {
                    // Footer
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.text(
                        `Academic Operations Management System | Generated on ${timestamp}`,
                        data.settings.margin.left,
                        doc.internal.pageSize.getHeight() - 10
                    );
                    doc.text(
                        `Page ${data.pageNumber}`,
                        doc.internal.pageSize.getWidth() - 25,
                        doc.internal.pageSize.getHeight() - 10
                    );
                }
            });

            doc.save(`timetable-Y${year}-S${semester}-${departmentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
        } finally {
            setLoading(false);
        }
    }

    if (slots.length === 0) return null;

    return (
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading} className="font-bold border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
            <Download className="h-4 w-4 mr-2" />
            {loading ? "Preparing PDF..." : "Export Official PDF"}
        </Button>
    );
}
