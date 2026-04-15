"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FacultyRequestActions({ requestId, isMove }: { requestId: string; isMove?: boolean }) {
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
        alert(data.error ?? "Verification failed.");
      } else {
        alert(data.message ?? "Success!");
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
        variant="ghost" 
        onClick={() => updateStatus("rejected")}
        disabled={!!loading}
        className="text-muted-foreground hover:text-destructive transition-colors h-8"
      >
        {loading === "rejected" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3 mr-1" />}
        Reject
      </Button>

      <Button 
        size="sm" 
        className={cn(
          "h-8 px-4 font-semibold shadow-sm transition-all",
          isMove ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"
        )}
        onClick={handleVerify}
        disabled={!!loading}
      >
        {loading === "verify" ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : (
          <Wand2 className="h-3 w-3 mr-1" />
        )}
        {isMove ? "Verify & Apply Move" : "Verify & Re-generate"}
      </Button>

      {/* Quick Approve only for non-moves or if you trust the admin */}
      {!isMove && (
        <Button 
          size="sm" 
          onClick={() => updateStatus("approved")}
          disabled={!!loading}
          variant="ghost"
          className="text-muted-foreground hover:text-foreground h-8"
        >
          {loading === "approved" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
          Quick Approve
        </Button>
      )}
    </div>
  );
}

