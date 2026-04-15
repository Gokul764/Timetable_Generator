"use client";

import { useState, useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Search, Filter, FlaskConical, Calendar, Layers } from "lucide-react";
import { CreateSubjectDialog } from "./create-subject-dialog";
import { SubjectStatusToggle } from "./status-toggle";
import { EditSubjectDialog } from "./edit-subject-dialog";
import { DeleteSubjectButton } from "./delete-subject-button";

interface Subject {
    id: string;
    name: string;
    code: string;
    year: number;
    semester: number;
    classesPerWeek: number;
    isLab: boolean;
    labSessionsPerWeek: number;
    isActive: boolean;
    isCore: boolean;
    isHonor: boolean;
    isMinor: boolean;
    isAddOn: boolean;
    isProfessionalElective: boolean;
    isOpenElective: boolean;
    departmentId: string;
}

interface SubjectsContentProps {
    initialSubjects: Subject[];
}

export function SubjectsContent({ initialSubjects }: SubjectsContentProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [semType, setSemType] = useState<"all" | "odd" | "even">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [labOnly, setLabOnly] = useState(false);

    const filteredSubjects = useMemo(() => {
        return initialSubjects.filter((s) => {
            const matchesSearch = 
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.code.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesSem = 
                semType === "all" ? true :
                semType === "odd" ? s.semester % 2 !== 0 :
                s.semester % 2 === 0;
            
            const matchesStatus = 
                statusFilter === "all" ? true :
                statusFilter === "active" ? s.isActive :
                !s.isActive;
            
            const matchesLab = labOnly ? s.isLab : true;

            return matchesSearch && matchesSem && matchesStatus && matchesLab;
        });
    }, [initialSubjects, searchQuery, semType, statusFilter, labOnly]);

    // Grouping logic for Year headers
    const groupedSubjects = useMemo(() => {
        const groups: { [key: number]: Subject[] } = {};
        filteredSubjects.forEach(s => {
            if (!groups[s.year]) groups[s.year] = [];
            groups[s.year].push(s);
        });
        return groups;
    }, [filteredSubjects]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Academic Subjects
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        Configure and manage the curriculum for your department
                    </p>
                </div>
                <CreateSubjectDialog />
            </div>

            {/* Filter Bar */}
            <Card className="border-none shadow-md bg-card/30 backdrop-blur-md overflow-hidden">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                        <Filter className="h-4 w-4" />
                        Dynamic Filtering
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <Search className="h-3 w-3" /> Search Subject
                            </Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Name or code..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 bg-background/50 border-muted-foreground/20 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" /> Semester Cycle
                            </Label>
                            <Select value={semType} onValueChange={(v: any) => setSemType(v)}>
                                <SelectTrigger className="bg-background/50 border-muted-foreground/20">
                                    <SelectValue placeholder="Semester type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Semesters</SelectItem>
                                    <SelectItem value="odd">Odd Semesters (1, 3, 5, 7)</SelectItem>
                                    <SelectItem value="even">Even Semesters (2, 4, 6, 8)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <Layers className="h-3 w-3" /> Availability
                            </Label>
                            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                                <SelectTrigger className="bg-background/50 border-muted-foreground/20">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any Status</SelectItem>
                                    <SelectItem value="active">Active Only</SelectItem>
                                    <SelectItem value="inactive">Inactive Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-muted-foreground/10 h-10 px-4">
                            <div className="flex items-center gap-2">
                                <FlaskConical className="h-4 w-4 text-primary" />
                                <Label htmlFor="lab-only" className="text-sm font-medium cursor-pointer">Labs Only</Label>
                            </div>
                            <Switch
                                id="lab-only"
                                checked={labOnly}
                                onCheckedChange={setLabOnly}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Section */}
            <div className="space-y-10">
                {[1, 2, 3, 4].map(year => {
                    const yearSubjects = groupedSubjects[year] || [];
                    if (yearSubjects.length === 0) return null;

                    return (
                        <div key={year} className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="h-8 w-1 bg-primary rounded-full" />
                                <h2 className="text-xl font-bold tracking-tight">Year {year}</h2>
                                <Badge variant="secondary" className="rounded-full px-3">
                                    {yearSubjects.length} subjects
                                </Badge>
                                <div className="flex-grow h-px bg-border/50" />
                            </div>

                            <Card className="overflow-hidden border-border/50 shadow-sm">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="w-[100px] font-bold">Code</TableHead>
                                                <TableHead className="font-bold">Name</TableHead>
                                                <TableHead className="w-[100px] font-bold">Sem</TableHead>
                                                <TableHead className="font-bold">Categories</TableHead>
                                                <TableHead className="w-[120px] font-bold">L/W</TableHead>
                                                <TableHead className="w-[150px] font-bold">Type</TableHead>
                                                <TableHead className="text-right font-bold pr-6">Management</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {yearSubjects.map((subject) => (
                                                <TableRow key={subject.id} className="hover:bg-muted/10 transition-colors">
                                                    <TableCell className="font-bold text-primary">{subject.code}</TableCell>
                                                    <TableCell className="font-medium">{subject.name}</TableCell>
                                                    <TableCell>
                                                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                                                            S{subject.semester}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {subject.isCore && <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Core</Badge>}
                                                            {subject.isHonor && <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Honor</Badge>}
                                                            {subject.isMinor && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Minor</Badge>}
                                                            {subject.isAddOn && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Add-on</Badge>}
                                                            {subject.isProfessionalElective && <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Prof.</Badge>}
                                                            {subject.isOpenElective && <Badge variant="outline" className="bg-cyan-50 text-cyan-600 border-cyan-200">Open</Badge>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-muted-foreground text-sm font-semibold">{subject.classesPerWeek} classes</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {subject.isLab ? (
                                                            <Badge className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-200/50 flex items-center w-fit gap-1 pr-2">
                                                                <FlaskConical className="h-3 w-3" />
                                                                Lab ({subject.labSessionsPerWeek})
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="flex items-center w-fit gap-1 pr-2">
                                                                <BookOpen className="h-3 w-3" />
                                                                Theory
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-4">
                                                        <div className="flex justify-end items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-all translate-x-4 md:group-hover:translate-x-0">
                                                            <SubjectStatusToggle
                                                                subjectId={subject.id}
                                                                initialStatus={subject.isActive}
                                                            />
                                                            <div className="h-4 w-px bg-border mx-1" />
                                                            <EditSubjectDialog subject={subject as any} />
                                                            <DeleteSubjectButton subjectId={subject.id} />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>
                    );
                })}

                {filteredSubjects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No matching subjects found</h3>
                        <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                        <button 
                            onClick={() => {
                                setSearchQuery("");
                                setSemType("all");
                                setStatusFilter("all");
                                setLabOnly(false);
                            }}
                            className="mt-4 text-primary font-bold hover:underline"
                        >
                            Reset all filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
