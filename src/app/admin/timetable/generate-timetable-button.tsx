"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GenerateTimetableButton({ departmentId }: { departmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<"all" | "specific">("all");
  const [year, setYear] = useState<string>("1");
  const [semesterType, setSemesterType] = useState<"odd" | "even">("odd");

  async function handleGenerate() {
    setLoading(true);
    try {
      const payload: any = { departmentId };

      if (target === "all") {
        payload.semesterType = semesterType;
      } else {
        const y = parseInt(year);
        payload.year = y;
        payload.semester = semesterType === "odd" ? (y * 2) - 1 : y * 2;
      }

      const res = await fetch("/api/admin/timetable/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to generate");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 border p-4 rounded-lg bg-muted/30">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase">Target</p>
        <Select value={target} onValueChange={(v: any) => setTarget(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            <SelectItem value="specific">Specific Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {target === "specific" && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">Year</p>
          <Select value={year} onValueChange={(v: any) => setYear(v)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Year 1</SelectItem>
              <SelectItem value="2">Year 2</SelectItem>
              <SelectItem value="3">Year 3</SelectItem>
              <SelectItem value="4">Year 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase">Semester</p>
        <Select value={semesterType} onValueChange={(v: any) => setSemesterType(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="odd">Odd Semesters</SelectItem>
            <SelectItem value="even">Even Semesters</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end h-full pt-5">
        <Button onClick={handleGenerate} disabled={loading} className="min-w-[150px]">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating…
            </>
          ) : (
            `Generate ${target === "all" ? "All" : "Year " + year} ${semesterType === "odd" ? "Odd" : "Even"}`
          )}
        </Button>
      </div>
    </div>
  );
}
