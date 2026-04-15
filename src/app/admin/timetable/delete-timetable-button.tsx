"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DeleteTimetableButton({ timetableId }: { timetableId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this timetable? This will remove all slots as well.")) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/timetable/${timetableId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete timetable");
            }

            toast({
                title: "Success",
                description: "Timetable deleted successfully.",
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not delete timetable.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </Button>
    );
}
