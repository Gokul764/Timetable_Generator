"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function PublishButton({
  timetableId,
  isPublished,
}: {
  timetableId: string;
  isPublished: boolean;
}) {
  const router = useRouter();

  async function toggle() {
    await fetch(`/api/admin/timetable/${timetableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    router.refresh();
  }

  return (
    <Button
      variant={isPublished ? "secondary" : "default"}
      size="sm"
      onClick={toggle}
      title={isPublished ? "Unpublish (hide from students)" : "Publish (visible to students)"}
    >
      {isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  );
}
