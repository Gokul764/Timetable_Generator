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

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateSubjectDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        year: "1",
        semester: "1",
        classesPerWeek: "3",
        isLab: false,
        labSessionsPerWeek: "0",
        isHonor: false,
        isMinor: false,
        isAddOn: false,
        isProfessionalElective: false,
        isOpenElective: false,
        isCore: true,
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
            const res = await fetch("/api/admin/subjects", {
                method: "POST",
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
            setFormData({
                name: "",
                code: "",
                year: "1",
                semester: "1",
                classesPerWeek: "3",
                isLab: false,
                labSessionsPerWeek: "0",
                isHonor: false,
                isMinor: false,
                isAddOn: false,
                isProfessionalElective: false,
                isOpenElective: false,
                isCore: true,
            }); // Reset
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to create subject");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Subject
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Subject</DialogTitle>
                    <DialogDescription>
                        Create a new subject for your department with specific constraints.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            placeholder="e.g. Computer Networks"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right">
                            Code
                        </Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="col-span-3"
                            placeholder="e.g. CS301"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="year" className="text-right">
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
                        <Label htmlFor="semester" className="text-right">
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
                        <Label htmlFor="classesPerWeek" className="text-right">
                            Classes/Week
                        </Label>
                        <Input
                            id="classesPerWeek"
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
                        <Label htmlFor="isLab" className="text-right">
                            Is Lab?
                        </Label>
                        <div className="flex items-center space-x-2 col-span-3">
                            <input
                                type="checkbox"
                                id="isLab"
                                checked={formData.isLab}
                                onChange={(e) => setFormData({ ...formData, isLab: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isLab">Subject includes lab sessions</Label>
                        </div>
                    </div>

                    {formData.isLab && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="labSessionsPerWeek" className="text-right">
                                Lab Sessions
                            </Label>
                            <Input
                                id="labSessionsPerWeek"
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
                                id="isHonor"
                                checked={formData.isHonor}
                                onChange={(e) => handleCategoryChange('isHonor', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isHonor">Honor Course</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isMinor"
                                checked={formData.isMinor}
                                onChange={(e) => handleCategoryChange('isMinor', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isMinor">Minor Course</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isAddOn"
                                checked={formData.isAddOn}
                                onChange={(e) => handleCategoryChange('isAddOn', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isAddOn">Add-on Course</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isProfessionalElective"
                                checked={formData.isProfessionalElective}
                                onChange={(e) => handleCategoryChange('isProfessionalElective', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isProfessionalElective">Professional Elective</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isOpenElective"
                                checked={formData.isOpenElective}
                                onChange={(e) => handleCategoryChange('isOpenElective', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isOpenElective">Open Elective</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isCore"
                                checked={formData.isCore}
                                onChange={(e) => handleCategoryChange('isCore', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="isCore">Core Course</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
