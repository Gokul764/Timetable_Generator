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
    include: { 
      faculty: { include: { user: true } },
      targetSlot: { include: { subject: true } }
    },
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
                <TableHead>Type</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Target Time</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right min-w-[320px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No faculty timeslot requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r) => (
                  <TableRow key={r.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell className="font-bold">{r.faculty.user.name}</TableCell>
                    <TableCell>
                      {r.isMoveRequest ? (
                        <div className="flex flex-col">
                          <Badge variant="outline" className="w-fit text-[10px] bg-amber-50 text-amber-700 border-amber-100 mb-1">
                            MOVE
                          </Badge>
                          <span className="text-xs font-semibold text-muted-foreground leading-tight">
                            {r.targetSlot?.subject?.name || "Unknown Class"}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-100">
                          {r.reason?.includes("[UNAVAILABLE]") ? "UNAVAILABILITY" : "PREFERENCE"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{DAYS[r.dayOfWeek] ?? r.dayOfWeek}</TableCell>
                    <TableCell className="font-medium text-blue-700">{r.startTime} – {r.endTime}</TableCell>
                    <TableCell className="max-w-[150px] text-sm text-muted-foreground italic truncate">
                      {r.reason?.replace(/\[.*?\]\s*/, "") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "approved"
                            ? "success"
                            : r.status === "rejected"
                              ? "destructive"
                              : "warning"
                        }
                        className="capitalize transition-all"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.status === "pending" && (
                          <FacultyRequestActions requestId={r.id} isMove={r.isMoveRequest} />
                        )}
                      </div>
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
