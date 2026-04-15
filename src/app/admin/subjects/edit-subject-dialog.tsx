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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

interface Subject {
    id: string;
    name: string;
    code: string;
    year: number;
    semester: number;
    classesPerWeek: number;
    isLab: boolean;
    labSessionsPerWeek: number;
    isHonor?: boolean;
    isMinor?: boolean;
    isAddOn?: boolean;
    isProfessionalElective?: boolean;
    isOpenElective?: boolean;
    isCore?: boolean;
}

interface EditSubjectDialogProps {
    subject: Subject;
}

export function EditSubjectDialog({ subject }: EditSubjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: subject.name,
        code: subject.code,
        year: subject.year.toString(),
        semester: subject.semester.toString(),
        classesPerWeek: (subject.classesPerWeek ?? 3).toString(),
        isLab: subject.isLab ?? false,
        labSessionsPerWeek: (subject.labSessionsPerWeek ?? 0).toString(),
        isHonor: subject.isHonor ?? false,
        isMinor: subject.isMinor ?? false,
        isAddOn: subject.isAddOn ?? false,
        isProfessionalElective: subject.isProfessionalElective ?? false,
        isOpenElective: subject.isOpenElective ?? false,
        isCore: subject.isCore ?? true,
    });

    const handleCategoryChange = (category: keyof typeof formData, checked: boolean) => {
        setFormData(prev => {
            const newState = {
                ...prev,
                isHonor: false,
                isMinor: false,
                isAddOn: false,
                isProfessionalElective: false,
                isOpenElective: false,
                isCore: false,
            };

            if (checked) {
                (newState as any)[category] = true;
            } else {
                newState.isCore = true; // Default back to Core if everything is unchecked
            }

            return newState;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/subjects/${subject.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    year: parseInt(formData.year),
                    semester: parseInt(formData.semester),
                    classesPerWeek: parseInt(formData.classesPerWeek),
                    labSessionsPerWeek: parseInt(formData.labSessionsPerWeek),
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }

            setOpen(false);
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to update subject");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Subject</DialogTitle>
                    <DialogDescription>
                        Update the details and constraints for this subject.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-code" className="text-right">
                            Code
                        </Label>
                        <Input
                            id="edit-code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-year" className="text-right">
                            Year
                        </Label>
                        <Select
                            value={formData.year}
                            onValueChange={(val) => setFormData({ ...formData, year: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-semester" className="text-right">
                            Semester
                        </Label>
                        <Select
                            value={formData.semester}
                            onValueChange={(val) => setFormData({ ...formData, semester: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                    <SelectItem key={s} value={s.toString()}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-classesPerWeek" className="text-right">
                            Classes/Week
                        </Label>
                        <Input
                            id="edit-classesPerWeek"
                            type="number"
                            min="1"
                            max="10"
                            value={formData.classesPerWeek}
                            onChange={(e) => setFormData({ ...formData, classesPerWeek: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-isLab" className="text-right">
                            Is Lab?
                        </Label>
                        <div className="flex items-center space-x-2 col-span-3">
                            <input
                                type="checkbox"
                                id="edit-isLab"
                                checked={formData.isLab}
                                onChange={(e) => setFormData({ ...formData, isLab: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="edit-isLab">Subject includes lab sessions</Label>
                        </div>
                    </div>

                    {formData.isLab && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-labSessionsPerWeek" className="text-right">
                                Lab Sessions
                            </Label>
                            <Input
                                id="edit-labSessionsPerWeek"
                                type="number"
                                min="1"
                                max="5"
                                value={formData.labSessionsPerWeek}
                                onChange={(e) => setFormData({ ...formData, labSessionsPerWeek: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit-isHonor"
                                checked={formData.isHonor}
                                onChange={(e) => handleCategoryChange('isHonor', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="edit-isHonor">Honor Course</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit-isMinor"
                                checked={formData.isMinor}
                                onChange={(e) => handleCategoryChange('isMinor', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="edit-isMinor">Minor Course</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit-isAddOn"
                                checked={formData.isAddOn}
                                onChange={(e) => handleCategoryChange('isAddOn', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="edit-isAddOn">Add-on Course</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit-isProfessionalElective"
                                checked={formData.isProfessionalElective}
                                onChange={(e) => handleCategoryChange('isProfessionalElective', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="edit-isProfessionalElective">Professional Elective</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit-isOpenElective"
                                checked={formData.isOpenElective}
                                onChange={(e) => handleCategoryChange('isOpenElective', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="edit-isOpenElective">Open Elective</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="edit-isCore"
                                checked={formData.isCore}
                                onChange={(e) => handleCategoryChange('isCore', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="edit-isCore">Core Course</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
