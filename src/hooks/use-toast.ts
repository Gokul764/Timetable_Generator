"use client";

// Simplified toast for the current environment
// In a full implementation, this would use a ToastProvider

export function useToast() {
    const toast = ({ title, description, variant }: { title?: string; description?: string; variant?: "default" | "destructive" }) => {
        // For now, use a simple console log or alert if needed
        // Ideally we want a real UI, but this unblocks the 'Can't resolve' error
        console.log(`TOAST: [${variant || "default"}] ${title}: ${description}`);

        // We could implement a simple custom event here if we wanted a real UI
        if (typeof window !== "undefined") {
            const event = new CustomEvent("app:toast", {
                detail: { title, description, variant }
            });
            window.dispatchEvent(event);
        }
    };

    return { toast };
}
