"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export function FacultyRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();

  async function updateStatus(status: "approved" | "rejected") {
    try {
      const res = await fetch(`/api/admin/faculty-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to update request status");
        return;
      }

      router.refresh();
    } catch (err) {
      alert("A network error occurred.");
    }
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
