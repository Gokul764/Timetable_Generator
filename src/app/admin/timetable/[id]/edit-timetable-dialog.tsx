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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Settings2 } from "lucide-react";

interface EditTimetableDialogProps {
    timetableId: string;
    initialYear: number;
    initialSemester: number;
}

export function EditTimetableDialog({
    timetableId,
    initialYear,
    initialSemester,
}: EditTimetableDialogProps) {
    const [year, setYear] = useState(initialYear);
    const [semester, setSemester] = useState(initialSemester);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    async function handleSave() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/timetable/${timetableId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    year: Number(year),
                    semester: Number(semester),
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to update timetable");
            }

            toast({
                title: "Success",
                description: "Timetable metadata updated.",
            });
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not update timetable.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Edit Metadata
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit Timetable Metadata</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                            id="year"
                            type="number"
                            min={1}
                            max={4}
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Input
                            id="semester"
                            type="number"
                            min={1}
                            max={8}
                            value={semester}
                            onChange={(e) => setSemester(Number(e.target.value))}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
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
