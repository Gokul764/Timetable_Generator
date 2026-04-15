import { prisma } from "@/lib/prisma";
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
import { RoomRequestActions } from "./room-request-actions";

export default async function SuperAdminRoomRequests() {
  const requests = await prisma.roomRequest.findMany({
    include: {
      requestingDepartment: { select: { name: true, code: true } },
      owningDepartment: { select: { name: true, code: true } },
      room: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Room Requests</h1>
        <p className="text-muted-foreground mt-1">
          Requests from departments to use another department&apos;s room. Approve or reject.
        </p>
      </div>

      {pending.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Pending ({pending.length})</CardTitle>
            <CardDescription>Requires your action</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All requests</CardTitle>
          <CardDescription>From requesting department to room owner</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requesting Dept</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Owning Dept</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No room requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.requestingDepartment.name} ({r.requestingDepartment.code})
                    </TableCell>
                    <TableCell>{r.room.name} ({r.room.code})</TableCell>
                    <TableCell>
                      {r.owningDepartment.name} ({r.owningDepartment.code})
                    </TableCell>
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
                        <RoomRequestActions requestId={r.id} />
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
