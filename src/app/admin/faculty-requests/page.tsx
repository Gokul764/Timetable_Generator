import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DAYS } from "@/lib/utils";
import { FacultyRequestActions } from "./faculty-request-actions";

export default async function AdminFacultyRequestsPage() {
  const session = await getServerSession(authOptions);
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  if (!departmentId) redirect("/admin");

  const requests = await prisma.facultyTimeslotRequest.findMany({
    where: { faculty: { departmentId } },
    include: { faculty: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Faculty Constraints</h1>
        <p className="text-muted-foreground mt-1">
          Review faculty teaching preferences and unavailability blocks. These are automatically integrated into the AI scheduler.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Constraints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.reason?.includes("[PREFERENCE]") || !r.reason?.includes("[UNAVAILABLE]")).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unavailability Blocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.reason?.includes("[UNAVAILABLE]")).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All requests</CardTitle>
          <CardDescription>From faculty in your department</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No faculty timeslot requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.faculty.user.name}</TableCell>
                    <TableCell>{DAYS[r.dayOfWeek] ?? r.dayOfWeek}</TableCell>
                    <TableCell>{r.startTime} – {r.endTime}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.reason ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "approved"
                            ? "success"
                            : r.status === "rejected"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" && (
                        <FacultyRequestActions requestId={r.id} />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
