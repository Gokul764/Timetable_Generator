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
import { Switch } from "@/components/ui/switch";
import { Loader2, Edit2, Home, FlaskConical, Presentation } from "lucide-react";
import { useRouter } from "next/navigation";

interface Room {
    id: string;
    name: string;
    code: string;
    capacity: number;
    type: string;
    isAvailable: boolean;
}

interface EditRoomDialogProps {
    room: Room;
}

export function EditRoomDialog({ room }: EditRoomDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: room.name,
        code: room.code,
        capacity: room.capacity,
        type: room.type || "classroom",
        isAvailable: room.isAvailable,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/rooms/${room.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }

            setOpen(false);
            router.refresh();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to update room");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Venue Details</DialogTitle>
                    <DialogDescription>
                        Update the configuration for this facility.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right font-semibold">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right font-semibold">
                            Code
                        </Label>
                        <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="capacity" className="text-right font-semibold">
                            Capacity
                        </Label>
                        <Input
                            id="capacity"
                            type="number"
                            min="1"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right font-semibold">
                            Type
                        </Label>
                        <Select
                            value={formData.type}
                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="classroom">
                                    <div className="flex items-center gap-2">
                                        <Home className="h-4 w-4 text-blue-500" />
                                        <span>Classroom</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="lab">
                                    <div className="flex items-center gap-2">
                                        <FlaskConical className="h-4 w-4 text-emerald-500" />
                                        <span>Lab</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="seminar_hall">
                                    <div className="flex items-center gap-2">
                                        <Presentation className="h-4 w-4 text-purple-500" />
                                        <span>Seminar Hall</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                        <div className="space-y-0.5">
                            <Label htmlFor="available" className="text-sm font-bold">Currently Available</Label>
                            <p className="text-xs text-muted-foreground">Is this room open for scheduling?</p>
                        </div>
                        <Switch
                            id="available"
                            checked={formData.isAvailable}
                            onCheckedChange={(val) => setFormData({ ...formData, isAvailable: val })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Venue
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
