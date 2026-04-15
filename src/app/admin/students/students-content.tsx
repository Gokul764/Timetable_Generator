"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
    Search, 
    GraduationCap, 
    User, 
    Mail, 
    Hash, 
    BookOpen, 
    FilterX,
    MoreHorizontal,
    BadgeCheck,
    AlertCircle
} from "lucide-react";
import { CreateStudentDialog } from "./create-student-dialog";
import { DeleteStudentButton } from "./delete-student-button";
import { EditStudentSubjectsDialog } from "./edit-subjects-dialog";
import { Badge } from "@/components/ui/badge";

interface Student {
    id: string;
    year: number;
    rollNo: string | null;
    user: {
        name: string;
        email: string;
    };
    subjects: {
        id: string;
        name: string;
        code: string;
    }[];
}

interface StudentsContentProps {
    initialStudents: Student[];
    allSubjects: {
        id: string;
        name: string;
        code: string;
        year: number;
    }[];
}

export function StudentsContent({ initialStudents, allSubjects }: StudentsContentProps) {
    const [search, setSearch] = useState("");
    const [yearFilter, setYearFilter] = useState("all");

    const filteredStudents = initialStudents.filter((student) => {
        const matchesSearch = 
            student.user.name.toLowerCase().includes(search.toLowerCase()) ||
            student.user.email.toLowerCase().includes(search.toLowerCase()) ||
            (student.rollNo?.toLowerCase() || "").includes(search.toLowerCase());
        
        const matchesYear = yearFilter === "all" || student.year.toString() === yearFilter;
        
        return matchesSearch && matchesYear;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-8 border border-primary/10 shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/20 rounded-2xl backdrop-blur-xl border border-primary/20 shadow-inner">
                                <GraduationCap className="h-7 w-7 text-primary" />
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                Student Registry
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-lg ml-1">
                            Manage academic profiles and course enrollments
                        </p>
                    </div>
                    <CreateStudentDialog />
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-card/50 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm">
                <div className="md:col-span-8 relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by name, email, or roll number..."
                        className="pl-11 h-12 bg-background/50 border-border/50 hover:border-primary/30 focus-visible:ring-primary/20 rounded-xl transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="md:col-span-3">
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="h-12 bg-background/50 border-border/50 rounded-xl">
                            <SelectValue placeholder="Filter by Year" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Academic Years</SelectItem>
                            <SelectItem value="1">First Year</SelectItem>
                            <SelectItem value="2">Second Year</SelectItem>
                            <SelectItem value="3">Third Year</SelectItem>
                            <SelectItem value="4">Fourth Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="md:col-span-1 flex justify-end">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 rounded-xl text-muted-foreground hover:text-primary"
                        onClick={() => { setSearch(""); setYearFilter("all"); }}
                    >
                        <FilterX className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Table Section */}
            <div className="rounded-3xl border border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden shadow-xl ring-1 ring-white/10">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border/40">
                            <TableHead className="w-[120px] font-bold text-foreground py-5">Roll No</TableHead>
                            <TableHead className="font-bold text-foreground">Student Identity</TableHead>
                            <TableHead className="font-bold text-foreground">Academic Status</TableHead>
                            <TableHead className="font-bold text-foreground">Course Enrollments</TableHead>
                            <TableHead className="w-[80px] text-right pr-6">Manage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3 brightness-75">
                                        <div className="p-4 bg-muted/20 rounded-full">
                                            <AlertCircle className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <p className="text-xl font-medium text-muted-foreground">No matching students found</p>
                                        <Button variant="link" onClick={() => { setSearch(""); setYearFilter("all"); }}>Clear all filters</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStudents.map((student) => (
                                <TableRow key={student.id} className="group hover:bg-primary/5 border-border/40 transition-colors">
                                    <TableCell className="py-5 font-mono text-xs text-primary font-bold">
                                        <div className="flex items-center gap-2">
                                            <Hash className="h-3 w-3 opacity-40" />
                                            {student.rollNo || "PENDING"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/10 shadow-sm transition-transform group-hover:scale-110">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground leading-none mb-1">
                                                    {student.user.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary/70 transition-colors">
                                                    <Mail className="h-3 w-3" />
                                                    {student.user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="secondary" className="w-fit bg-secondary/30 text-secondary-foreground border-secondary/20 rounded-lg">
                                                Year {student.year}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold ml-1">
                                                Active Session
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex items-center gap-3">
                                            {student.subjects.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                                                    {student.subjects.slice(0, 3).map(sub => (
                                                        <Badge 
                                                            key={sub.id} 
                                                            variant="outline" 
                                                            className="text-[10px] px-1.5 py-0 bg-background/40 border-primary/10 hover:border-primary/40 transition-colors cursor-default"
                                                        >
                                                            {sub.code}
                                                        </Badge>
                                                    ))}
                                                    {student.subjects.length > 3 && (
                                                        <Badge variant="outline" className="text-[10px] px-1 text-muted-foreground italic">
                                                            +{student.subjects.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full text-[10px] font-bold border border-orange-500/20 uppercase tracking-tighter">
                                                    <AlertCircle className="h-3 w-3" />
                                                    No subjects
                                                </div>
                                            )}
                                            <EditStudentSubjectsDialog
                                                studentId={student.id}
                                                studentName={student.user.name}
                                                enrolledSubjectIds={student.subjects.map(s => s.id)}
                                                allSubjects={allSubjects}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-right pr-6">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DeleteStudentButton 
                                                studentId={student.id} 
                                                studentName={student.user.name} 
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {/* Stats Footer */}
            <div className="flex flex-wrap gap-4 px-4 py-2 text-xs text-muted-foreground font-medium italic">
                <div className="flex items-center gap-1.5">
                    <BadgeCheck className="h-4 w-4 text-green-500" />
                    Verified Profiles: {initialStudents.length}
                </div>
                <div className="h-4 w-px bg-border/50 mx-2 hidden md:block" />
                <div className="flex items-center gap-1.5 leading-none">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    Total Enrollments: {initialStudents.reduce((acc, s) => acc + s.subjects.length, 0)}
                </div>
            </div>
        </div>
    );
}
