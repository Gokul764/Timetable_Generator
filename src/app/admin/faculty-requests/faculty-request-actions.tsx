"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Wand2, Loader2 } from "lucide-react";

export function FacultyRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(status: "approved" | "rejected") {
    setLoading(status);
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
    } finally {
      setLoading(null);
    }
  }

  async function handleVerify() {
    setLoading("verify");
    try {
      const res = await fetch(`/api/admin/faculty-requests/${requestId}/verify`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        alert(data.error ?? "Verification failed. The constraint caused conflicts.");
      } else {
        alert("Success! Timetable re-generated with 0 conflicts. Request approved.");
      }
      
      router.refresh();
    } catch (err) {
      alert("Verification failed due to a network error.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex justify-end items-center gap-2">
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => updateStatus("rejected")}
        disabled={!!loading}
      >
        {loading === "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
        Reject
      </Button>

      <Button 
        size="sm" 
        className="bg-purple-600 hover:bg-purple-700 text-white" 
        onClick={handleVerify}
        disabled={!!loading}
      >
        {loading === "verify" ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Wand2 className="h-4 w-4 mr-1" />
        )}
        Verify & Re-generate
      </Button>

      <Button 
        size="sm" 
        onClick={() => updateStatus("approved")}
        disabled={!!loading}
        variant="ghost"
        className="text-muted-foreground hover:text-foreground"
      >
        {loading === "approved" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
        Quick Approve
      </Button>
    </div>
  );
}
