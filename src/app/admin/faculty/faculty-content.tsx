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
import { Button } from "@/components/ui/button";
import { 
    Search, 
    UserCircle2, 
    IdCard, 
    Mail, 
    Briefcase, 
    BookOpen, 
    FilterX,
    Users,
    BadgeCheck,
    CalendarCheck,
    Trash2,
    Hash
} from "lucide-react";
import { CreateFacultyDialog } from "./create-faculty-dialog";
import { DeleteFacultyButton } from "./delete-faculty-button";
import { AssignSubjectsDialog } from "./assign-subjects-dialog";
import { FacultyTimetableDialog } from "./faculty-timetable-dialog";
import { Badge } from "@/components/ui/badge";

interface Faculty {
    id: string;
    employeeId: string | null;
    designation: string | null;
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

interface FacultyContentProps {
    initialFaculty: Faculty[];
    allSubjects: any[];
    currentDepartmentId: string;
}

export function FacultyContent({ initialFaculty, allSubjects, currentDepartmentId }: FacultyContentProps) {
    const [search, setSearch] = useState("");

    const filteredFaculty = initialFaculty.filter((f) => {
        const query = search.toLowerCase();
        return (
            f.user.name.toLowerCase().includes(query) ||
            f.user.email.toLowerCase().includes(query) ||
            (f.employeeId?.toLowerCase() || "").includes(query) ||
            (f.designation?.toLowerCase() || "").includes(query)
        );
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            {/* Professional Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-background to-emerald-500/5 p-10 border border-primary/10 shadow-2xl shadow-primary/5">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-indigo-500/20 rounded-2xl backdrop-blur-2xl border border-indigo-500/20 shadow-inner">
                                <Users className="h-8 w-8 text-indigo-500" />
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                                Faculty Management
                            </h1>
                        </div>
                        <p className="text-muted-foreground text-lg font-medium ml-1">
                            Coordinate departmental staff and academic load assignments
                        </p>
                    </div>
                    <CreateFacultyDialog />
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card/40 backdrop-blur-md p-5 rounded-2xl border border-border/50 shadow-sm sticky top-0 z-20">
                <div className="flex-1 relative group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search faculty by name, ID, or designation..."
                        className="pl-12 h-14 bg-background/50 border-border/50 hover:border-primary/20 focus-visible:ring-primary/20 rounded-xl transition-all text-base"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-14 w-14 rounded-xl text-muted-foreground hover:text-primary border-border/50"
                    onClick={() => setSearch("")}
                >
                    <FilterX className="h-5 w-5" />
                </Button>
            </div>

            {/* Data Table */}
            <div className="rounded-[2rem] border border-border/40 bg-card/20 backdrop-blur-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/20">
                            <TableHead className="w-[140px] font-bold text-foreground py-6 pl-8">Emp ID</TableHead>
                            <TableHead className="font-bold text-foreground py-6">Faculty Profile</TableHead>
                            <TableHead className="font-bold text-foreground py-6">Load Matrix</TableHead>
                            <TableHead className="w-[180px] text-right font-bold text-foreground py-6 pr-8">Operations</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredFaculty.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-80 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4 opacity-70">
                                        <div className="p-6 bg-muted/20 rounded-full grayscale">
                                            <Briefcase className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xl font-bold text-muted-foreground">No faculty members found</p>
                                            <p className="text-sm text-muted-foreground/60">Try adjusting your search criteria</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredFaculty.map((f) => (
                                <TableRow key={f.id} className="group hover:bg-indigo-500/5 border-border/20 transition-all duration-300">
                                    <TableCell className="py-6 pl-8">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted/40 rounded-lg border border-border/40 font-mono text-xs font-bold text-primary shadow-sm">
                                            <Hash className="h-3 w-3 opacity-50" />
                                            {f.employeeId || "NEW-HRP"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center border border-indigo-500/20 shadow-lg group-hover:rotate-6 transition-transform">
                                                <UserCircle2 className="h-6 w-6 text-indigo-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-lg text-foreground tracking-tight leading-none mb-1.5 flex items-center gap-2">
                                                    {f.user.name}
                                                    {f.subjects.length > 3 && <BadgeCheck className="h-4 w-4 text-emerald-500" />}
                                                </span>
                                                <span className="text-xs font-semibold text-muted-foreground/70 flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors uppercase tracking-wider">
                                                    <Briefcase className="h-3.5 w-3.5" />
                                                    {f.designation || "Faculty Member"}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6">
                                        <div className="flex flex-wrap gap-2 max-w-[400px]">
                                            {f.subjects.length > 0 ? (
                                                f.subjects.map(sub => (
                                                    <Badge 
                                                        key={sub.id} 
                                                        variant="outline" 
                                                        className="px-2 py-0.5 bg-background/50 border-primary/5 hover:border-primary/30 transition-colors text-[11px] font-bold"
                                                    >
                                                        {sub.code}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 uppercase">
                                                    Unassigned
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6 pr-8">
                                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <FacultyTimetableDialog
                                                facultyId={f.id}
                                                facultyName={f.user.name}
                                            />
                                            <AssignSubjectsDialog
                                                faculty={f as any}
                                                allSubjects={allSubjects}
                                                currentDepartmentId={currentDepartmentId}
                                            />
                                            <div className="w-px h-6 bg-border/40 mx-1" />
                                            <DeleteFacultyButton 
                                                facultyId={f.id} 
                                                facultyName={f.user.name} 
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Matrix Footer */}
            <div className="flex items-center gap-6 px-10 py-4 text-[11px] uppercase tracking-[0.2em] font-extrabold text-muted-foreground/50">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    Global Roster: {initialFaculty.length}
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    Scheduled Load: {initialFaculty.reduce((acc, f) => acc + f.subjects.length, 0)}
                </div>
            </div>
        </div>
    );
}
