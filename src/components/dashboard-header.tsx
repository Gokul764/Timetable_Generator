"use client";

import { NotificationCenter } from "./notification-center";
import { User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signOut, useSession } from "next-auth/react";

export function DashboardHeader() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 border-b bg-background z-30 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground hidden sm:block">
           {user?.role === "admin" ? "Department Administration" : 
            user?.role === "faculty" ? "Faculty Portal" : 
            user?.role === "super_admin" ? "System Core" : "Student View"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <NotificationCenter />
        
        <div className="h-8 w-px bg-border mx-2" />

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end text-right">
             <span className="text-sm font-bold truncate max-w-[150px]">{user?.name}</span>
             <span className="text-[10px] text-muted-foreground uppercase font-medium">{user?.role}</span>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full bg-muted/50"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </header>
  );
}
