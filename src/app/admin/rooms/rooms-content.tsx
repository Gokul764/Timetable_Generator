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
import { 
    Search, 
    Filter, 
    Home, 
    FlaskConical, 
    Presentation, 
    Users, 
    CalendarCheck,
    MapPin,
    AlertCircle
} from "lucide-react";
import { CreateRoomDialog } from "./create-room-dialog";
import { EditRoomDialog } from "./edit-room-dialog";
import { DeleteRoomButton } from "./delete-room-button";

interface Room {
    id: string;
    name: string;
    code: string;
    capacity: number;
    type: "classroom" | "lab" | "seminar_hall" | string;
    isAvailable: boolean;
    departmentId: string;
}

interface RoomsContentProps {
    initialRooms: Room[];
}

export function RoomsContent({ initialRooms }: RoomsContentProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

    const filteredRooms = useMemo(() => {
        return initialRooms.filter((r) => {
            const matchesSearch = 
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.code.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesType = typeFilter === "all" ? true : r.type === typeFilter;
            
            const matchesStatus = 
                availabilityFilter === "all" ? true :
                availabilityFilter === "available" ? r.isAvailable :
                !r.isAvailable;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [initialRooms, searchQuery, typeFilter, availabilityFilter]);

    const getRoomIcon = (type: string) => {
        switch (type) {
            case "lab": return <FlaskConical className="h-4 w-4 text-emerald-500" />;
            case "seminar_hall": return <Presentation className="h-4 w-4 text-purple-500" />;
            default: return <Home className="h-4 w-4 text-blue-500" />;
        }
    };

    const getTypeBadge = (type: string) => {
        const icons = {
            classroom: <Home className="h-3 w-3 mr-1" />,
            lab: <FlaskConical className="h-3 w-3 mr-1" />,
            seminar_hall: <Presentation className="h-3 w-3 mr-1" />,
        };
        const styles = {
            classroom: "bg-blue-50 text-blue-600 border-blue-200",
            lab: "bg-emerald-50 text-emerald-600 border-emerald-200",
            seminar_hall: "bg-purple-50 text-purple-600 border-purple-200",
        };

        const t = (type as keyof typeof icons) || "classroom";
        
        return (
            <Badge variant="outline" className={`${styles[t] || styles.classroom} py-0.5 px-2`}>
                {icons[t] || icons.classroom}
                {t.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </Badge>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-card to-card/50 backdrop-blur-md p-8 rounded-3xl border border-border/40 shadow-xl shadow-primary/5">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl">
                        <MapPin className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">
                            Venues & Infrastructure
                        </h1>
                        <p className="text-muted-foreground font-medium flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                            {initialRooms.length} Total Facilities Managed
                        </p>
                    </div>
                </div>
                <CreateRoomDialog />
            </div>

            {/* Glassmorphic Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 backdrop-blur-lg rounded-2xl border border-border/50 shadow-inner">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by name or room code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 py-6 bg-background/60 border-none shadow-sm focus:ring-2 focus:ring-primary/20 rounded-xl"
                    />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="py-6 bg-background/60 border-none shadow-sm rounded-xl">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Unified Room Categories" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50">
                        <SelectItem value="all">Everywhere</SelectItem>
                        <SelectItem value="classroom">Standard Classrooms</SelectItem>
                        <SelectItem value="lab">Technical Laboratories</SelectItem>
                        <SelectItem value="seminar_hall">Seminar & Conference Halls</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="py-6 bg-background/60 border-none shadow-sm rounded-xl">
                        <div className="flex items-center gap-2">
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Live Status" />
                        </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50">
                        <SelectItem value="all">All Venues</SelectItem>
                        <SelectItem value="available">Operational Only</SelectItem>
                        <SelectItem value="unavailable">Under Maintenance</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results Grid/Table */}
            <div className="grid gap-6">
                <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-sm overflow-hidden rounded-3xl border border-border/20">
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent border-b-border/30">
                                <TableHead className="w-[120px] font-black uppercase text-[10px] tracking-widest pl-8 py-6">Code</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6">Identity & Type</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 text-center">Load Factor</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6">Operations Status</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8 py-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRooms.map((room) => (
                                <TableRow key={room.id} className="group hover:bg-primary/[0.03] transition-all duration-300 border-b-border/10 last:border-0">
                                    <TableCell className="pl-8 font-black text-lg text-primary/80">{room.code}</TableCell>
                                    <TableCell className="py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-secondary/50 rounded-xl group-hover:bg-primary/10 transition-colors">
                                                {getRoomIcon(room.type)}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-base leading-none">{room.name}</p>
                                                {getTypeBadge(room.type)}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-6">
                                        <div className="inline-flex flex-col items-center">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/40 rounded-full border border-border/20 shadow-sm">
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm font-black">{room.capacity}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground mt-1 tracking-tighter uppercase italic">Max Capacity</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6">
                                        {room.isAvailable ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15 py-1 px-3 rounded-full font-bold">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                                                Operational
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/15 py-1 px-3 rounded-full font-bold">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 mr-2" />
                                                Offline
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right pr-8 py-6">
                                        <div className="flex justify-end items-center gap-2">
                                            <EditRoomDialog room={room as any} />
                                            <div className="h-4 w-px bg-border/40 mx-1" />
                                            <DeleteRoomButton roomId={room.id} roomCode={room.code} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredRooms.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="p-6 bg-muted/10 rounded-full border-2 border-dashed border-border/50 shadow-inner">
                                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-xl font-black">No Venues Detected</h3>
                                <p className="text-muted-foreground max-w-[300px] text-sm font-medium">Try broadening your search or adjusting the unified category filters.</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
