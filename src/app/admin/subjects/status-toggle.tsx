"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface SubjectStatusToggleProps {
    subjectId: string;
    initialStatus: boolean;
}

export function SubjectStatusToggle({ subjectId, initialStatus }: SubjectStatusToggleProps) {
    const [isActive, setIsActive] = useState(initialStatus);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    async function handleToggle() {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/subjects/${subjectId}/toggle-status`, {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to toggle status");
            }

            setIsActive(!isActive);
            toast({
                title: "Success",
                description: `Subject is now ${!isActive ? "active" : "inactive"}.`,
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not update subject status.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-2 justify-end">
            <Badge variant={isActive ? "success" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
            </Badge>
            <Switch
                checked={isActive}
                onCheckedChange={handleToggle}
                disabled={loading}
            />
        </div>
    );
}
