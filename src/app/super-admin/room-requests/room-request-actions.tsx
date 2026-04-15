"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export function RoomRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();

  async function updateStatus(status: "approved" | "rejected") {
    await fetch(`/api/super-admin/room-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" onClick={() => updateStatus("rejected")}>
        <X className="h-4 w-4 mr-1" />
        Reject
      </Button>
      <Button size="sm" onClick={() => updateStatus("approved")}>
        <Check className="h-4 w-4 mr-1" />
        Approve
      </Button>
    </div>
  );
}
