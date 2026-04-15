"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { UserCog } from "lucide-react";

interface Subject {
    id: string;
    name: string;
    code: string;
    year: number;
}

interface EditStudentSubjectsDialogProps {
    studentId: string;
    studentName: string;
    enrolledSubjectIds: string[];
    allSubjects: Subject[];
}

export function EditStudentSubjectsDialog({
    studentId,
    studentName,
    enrolledSubjectIds,
    allSubjects,
}: EditStudentSubjectsDialogProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>(enrolledSubjectIds);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const toggleSubject = (subjectId: string) => {
        setSelectedIds((prev) =>
            prev.includes(subjectId)
                ? prev.filter((id) => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    async function handleSave() {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/students/${studentId}/subjects`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subjectIds: selectedIds }),
            });

            if (!response.ok) throw new Error("Failed to update subjects");

            toast({
                title: "Success",
                description: "Student subjects updated successfully.",
            });
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not update subjects.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <UserCog className="h-4 w-4 mr-2" />
                    Edit Subjects
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Subjects for {studentName}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                    <div className="space-y-4 pb-4">
                        {allSubjects.map((subject) => (
                            <div key={subject.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`subject-${subject.id}`}
                                    checked={selectedIds.includes(subject.id)}
                                    onCheckedChange={() => toggleSubject(subject.id)}
                                />
                                <label
                                    htmlFor={`subject-${subject.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {subject.code} - {subject.name} (Year {subject.year})
                                </label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
