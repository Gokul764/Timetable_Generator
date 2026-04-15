"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Subject {
    id: string;
    code: string;
    name: string;
    year: number;
    departmentId: string;
    department?: { code: string };
    isCore: boolean;
    isHonor: boolean;
    isMinor: boolean;
    isOpenElective: boolean;
    isProfessionalElective: boolean;
}

interface Faculty {
    id: string;
    user: { name: string };
    employeeId: string | null;
    subjects: Subject[];
}

interface AssignSubjectsDialogProps {
    faculty: Faculty;
    allSubjects: Subject[];
    currentDepartmentId: string;
}

export function AssignSubjectsDialog({ faculty, allSubjects, currentDepartmentId }: AssignSubjectsDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>(
        faculty.subjects.map((s) => s.id)
    );
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleToggle = (subjectId: string) => {
        setSelectedIds((prev) =>
            prev.includes(subjectId)
                ? prev.filter((id) => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/faculty/${faculty.id}/subjects`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subjectIds: selectedIds }),
            });

            if (!res.ok) throw new Error("Failed to update subjects");

            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Group subjects by year
    const subjectsByYear = allSubjects.reduce((acc, subject) => {
        const year = subject.year;
        if (!acc[year]) acc[year] = [];
        acc[year].push(subject);
        return acc;
    }, {} as Record<number, Subject[]>);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    <Plus className="mr-2 h-3 w-3" />
                    Assign
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Assign Subjects</DialogTitle>
                    <DialogDescription>
                        Select subjects for {faculty.user.name} ({faculty.employeeId})
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                    <div className="space-y-6 pb-4">
                        {Object.entries(subjectsByYear).map(([year, subjects]) => (
                            <div key={year} className="space-y-2">
                                <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
                                    Year {year}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {subjects.map((subject) => (
                                        <div
                                            key={subject.id}
                                            className="flex items-start space-x-2 rounded-md border p-2 hover:bg-muted/50"
                                        >
                                            <Checkbox
                                                id={`subject-${subject.id}`}
                                                checked={selectedIds.includes(subject.id)}
                                                onCheckedChange={() => handleToggle(subject.id)}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <Label
                                                    htmlFor={`subject-${subject.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex flex-wrap items-center gap-1.5"
                                                >
                                                    <span className="font-bold">{subject.code}</span>
                                                    <span>- {subject.name}</span>
                                                    {subject.department?.code && subject.departmentId !== currentDepartmentId && (
                                                        <span className="text-[10px] bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase font-black">
                                                            {subject.department.code}
                                                        </span>
                                                    )}
                                                    {subject.isHonor && (
                                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-500/20 font-black uppercase">
                                                            Honor
                                                        </span>
                                                    )}
                                                    {subject.isMinor && (
                                                        <span className="text-[10px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded border border-purple-500/20 font-black uppercase">
                                                            Minor
                                                        </span>
                                                    )}
                                                    {subject.isOpenElective && (
                                                        <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded border border-amber-500/20 font-black uppercase">
                                                            Open Elective
                                                        </span>
                                                    )}
                                                    {subject.isProfessionalElective && (
                                                        <span className="text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/20 font-black uppercase">
                                                            Prof Elective
                                                        </span>
                                                    )}
                                                    {!subject.isCore && !subject.isHonor && !subject.isMinor && !subject.isOpenElective && !subject.isProfessionalElective && (
                                                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-black uppercase">
                                                            Elective
                                                        </span>
                                                    )}
                                                </Label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
