"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";

interface YearNavigationProps {
    currentId: string;
    timetables: {
        id: string;
        year: number;
        semester: number;
    }[];
}

export function YearNavigation({ currentId, timetables }: YearNavigationProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 p-1 bg-muted/30 rounded-2xl border border-border/20 w-fit backdrop-blur-sm">
            {timetables.map((tt) => (
                <Link
                    key={tt.id}
                    href={`/admin/timetable/${tt.id}`}
                    className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                        currentId === tt.id
                            ? "bg-background text-primary shadow-lg shadow-primary/5 ring-1 ring-border/50"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                >
                    Y{tt.year} S{tt.semester}
                </Link>
            ))}
        </div>
    );
}
