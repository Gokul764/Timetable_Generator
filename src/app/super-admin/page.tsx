import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, DoorOpen, Inbox } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function SuperAdminDashboard() {
  const [departments, roomCount, facultyCount, usedRooms] = await Promise.all([
    prisma.department.findMany({
      include: {
        _count: { select: { rooms: true, faculty: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.room.count(),
    prisma.faculty.count(),
    prisma.timetableSlot.findMany({ select: { roomId: true } }).then((s) => new Set(s.map((x) => x.roomId)).size),
  ]);

  const usedPercentage = roomCount > 0 ? Math.round((usedRooms / roomCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-r from-primary to-violet-600 p-8 text-primary-foreground shadow-lg">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Platform Overview</h1>
        <p className="text-primary-foreground/90 text-lg">
          Manage your institution's infrastructure and departments from one central command center.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Faculties</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{facultyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {departments.length} departments</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Room Utilization</CardTitle>
            <DoorOpen className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{roomCount}</div>
              <div className="text-sm font-medium text-green-600 mb-1">{usedPercentage}% Active</div>
            </div>
            <div className="h-2 w-full bg-secondary mt-3 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${usedPercentage}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{usedRooms} rooms currently scheduled</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Departments</CardTitle>
            <Building2 className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Operational units</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Content - Departments List */}
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Department Metrics</CardTitle>
            <CardDescription>Real-time resource allocation per department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {dept.code.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{dept.name}</p>
                      <p className="text-xs text-muted-foreground">{dept.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-right">
                    <div>
                      <span className="block font-bold">{dept._count.faculty}</span>
                      <span className="text-xs text-muted-foreground">Faculty</span>
                    </div>
                    <div className="w-px bg-border" />
                    <div>
                      <span className="block font-bold">{dept._count.rooms}</span>
                      <span className="text-xs text-muted-foreground">Rooms</span>
                    </div>
                  </div>
                </div>
              ))}
              {departments.length === 0 && (
                <p className="text-center text-muted-foreground py-6">No departments found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Quick Actions & Recent */}
        <div className="col-span-3 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link
                href="/super-admin/departments"
                className={cn(buttonVariants({ size: "lg" }), "w-full justify-start text-left")}
              >
                <Building2 className="mr-2 h-5 w-5" />
                Manage Departments
              </Link>
              <Link
                href="/super-admin/room-requests"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full justify-start text-left")}
              >
                <Inbox className="mr-2 h-5 w-5" />
                Room Requests
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                All systems operational
              </div>
              <p className="text-xs text-muted-foreground">Last sync: Just now</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
