"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeleteFacultyButtonProps {
    facultyId: string;
    facultyName: string;
}

export function DeleteFacultyButton({ facultyId, facultyName }: DeleteFacultyButtonProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    async function onDelete() {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/faculty/${facultyId}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Deletion failed");

            toast({
                title: "Faculty Removed",
                description: `${facultyName} has been successfully deleted.`,
            });
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to remove faculty member.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <DialogTitle>Delete Faculty Member</DialogTitle>
                    </div>
                    <DialogDescription>
                        Are you sure you want to remove <span className="font-bold text-foreground">{facultyName}</span>? 
                        This will delete their account and all associated timetable data.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onDelete} disabled={isLoading} className="gap-2">
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Confirm Deletion
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
