import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
    Calendar, 
    Users, 
    GraduationCap, 
    Building2, 
    BookOpen, 
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Wand2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FacultyRequestActions } from "./faculty-requests/faculty-request-actions";
import { DAYS } from "@/lib/utils";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  const deptName = (session?.user as { name?: string })?.name || "Department";

  if (!departmentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <Building2 className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Access Restricted</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          No department assigned to your account. Please contact the super admin to resolve this issue.
        </p>
      </div>
    );
  }

  // Fetch Core Metrics
  const [
      timetables, 
      studentCount, 
      facultyCount, 
      subjectCount, 
      roomCount,
      pendingRequests
  ] = await Promise.all([
    prisma.timetable.findMany({
      where: { departmentId },
      include: { 
          slots: {
              select: { dayOfWeek: true, startTime: true, facultyId: true, roomId: true, id: true }
          }
      },
      orderBy: [{ year: "asc" }, { semester: "asc" }],
    }),
    prisma.student.count({ where: { departmentId } }),
    prisma.faculty.count({ where: { departmentId } }),
    prisma.subject.count({ where: { departmentId } }),
    prisma.room.count({ where: { departmentId } }),
    prisma.facultyTimeslotRequest.findMany({
        where: { faculty: { departmentId }, status: "pending" },
        include: { faculty: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
        take: 3
    })
  ]);

  // Logical Health Check
  const ttStatus = timetables.map(tt => {
      const conflicts = tt.slots.some(s => 
          tt.slots.some(other => 
              other.id !== s.id && 
              other.dayOfWeek === s.dayOfWeek && 
              other.startTime === s.startTime &&
              (other.facultyId === s.facultyId || other.roomId === s.roomId)
          )
      );
      return { id: tt.id, year: tt.year, semester: tt.semester, hasConflict: conflicts };
  });

  const stats = [
    { label: "Students", value: studentCount, icon: GraduationCap, color: "text-blue-600" },
    { label: "Faculty", value: facultyCount, icon: Users, color: "text-indigo-600" },
    { label: "Subjects", value: subjectCount, icon: BookOpen, color: "text-emerald-600" },
    { label: "Rooms", value: roomCount, icon: Building2, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Managing {deptName} resources and scheduling
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-muted px-4 py-2 rounded-full font-medium">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          System Operational
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">Total {stat.label.toLowerCase()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Schedule Status (Stability) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Schedule Stability</CardTitle>
            <CardDescription>Conflict status across academic years</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
                {ttStatus.map((tt) => (
                    <Link key={tt.id} href={`/admin/timetable/${tt.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left w-full cursor-pointer">
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold">Year {tt.year} · Sem {tt.semester}</p>
                                <p className="text-xs text-muted-foreground">Main Schedule</p>
                            </div>
                            {tt.hasConflict ? (
                                <Badge variant="outline" className="bg-rose-50 border-rose-200 text-rose-600 text-[10px] font-bold">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Conflict
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-600 text-[10px] font-bold">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Stable
                                </Badge>
                            )}
                        </div>
                    </Link>
                ))}
                {ttStatus.length === 0 && (
                    <div className="sm:col-span-2 text-center py-6 text-muted-foreground text-sm italic">
                        No timetables generated yet.
                    </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions (Resource Mgmt) */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Mgmt</CardTitle>
            <CardDescription>Direct shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1">
            {[
                { label: "Manage Timetables", href: "/admin/timetable", icon: Calendar },
                { label: "Faculty Directory", href: "/admin/faculty", icon: Users },
                { label: "Student Registry", href: "/admin/students", icon: GraduationCap },
                { label: "Campus Rooms", href: "/admin/rooms", icon: Building2 },
                { label: "Department Subjects", href: "/admin/subjects", icon: BookOpen },
                { label: "Faculty Constraints", href: "/admin/faculty-requests", icon: Wand2 },
            ].map((action) => (
                <Link key={action.label} href={action.href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "justify-start w-full text-sm font-medium group")}>
                    <action.icon className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    {action.label}
                    <ArrowRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                </Link>
            ))}
          </CardContent>
        </Card>

        {/* Pending Constraints Widget (Full Width conditionally) */}
        {pendingRequests.length > 0 && (
          <Card className="lg:col-span-3 border-purple-200 bg-purple-50/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-purple-700 flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Action Required: Pending Constraints
                </CardTitle>
                <CardDescription>Verify these requests to re-generate the timetable automatically</CardDescription>
              </div>
              <Link href="/admin/faculty-requests" className="text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1">
                View all requests <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border bg-white border-purple-100 shadow-sm hover:shadow-md transition-shadow gap-6 group">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                           {req.faculty.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{req.faculty.user.name}</p>
                          <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                            {DAYS[req.dayOfWeek]} @ {req.startTime}
                          </Badge>
                        </div>
                      </div>
                      {req.reason && (
                        <p className="text-sm text-gray-500 italic pl-1.5 border-l-2 border-purple-200 ml-5 py-0.5">
                          "{req.reason}"
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <FacultyRequestActions requestId={req.id} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
