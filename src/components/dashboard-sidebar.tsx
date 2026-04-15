"use client";

import {
  Users,
  LayoutDashboard,
  Calendar,
  Settings,
  BookOpen,
  GraduationCap,
  DoorOpen,
  FileText,
  UserCheck,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

export type Role = "super_admin" | "admin" | "faculty" | "student";

export const SIDEBAR_ITEMS = {
  super_admin: [
    { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    { label: "Admins", href: "/super-admin/admins", icon: Users },
    { label: "Departments", href: "/super-admin/departments", icon: BookOpen },
    { label: "Subjects", href: "/super-admin/subjects", icon: BookOpen },
    { label: "Venues", href: "/super-admin/venues", icon: DoorOpen },
    { label: "Settings", href: "/super-admin/settings", icon: Settings },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Timetables", href: "/admin/timetable", icon: Calendar },
    { label: "Faculty", href: "/admin/faculty", icon: Users },
    { label: "Students", href: "/admin/students", icon: GraduationCap },
    { label: "Subjects", href: "/admin/subjects", icon: BookOpen },
    { label: "Venues", href: "/admin/rooms", icon: DoorOpen },
  ],
  faculty: [
    { label: "Dashboard", href: "/faculty", icon: LayoutDashboard },
    { label: "My Schedule", href: "/faculty/schedule", icon: Calendar },
    { label: "Constraints", href: "/faculty/constraints", icon: Settings },
  ],
  student: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "My Timetable", href: "/student/timetable", icon: Calendar },
  ],
};

interface DashboardSidebarProps {
  role: Role;
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const items = SIDEBAR_ITEMS[role] || [];

  return (
    <aside className="w-64 border-r bg-muted/20 fixed top-0 left-0 min-h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <h1 className="font-semibold text-lg">College Timetable</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-4 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
