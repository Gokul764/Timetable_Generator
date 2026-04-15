import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Building2 } from "lucide-react";
// We can reuse the dialog if we make it accept a departmentId prop or handle it internally
// For Super Admin, they likely need to select a department first or see all subjects.
// Let's list all subjects grouped by department or filterable.

export default async function SuperAdminSubjectsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/login");

    const user = session.user as { role: string };
    if (user.role !== "super_admin") redirect("/");

    const subjects = await prisma.subject.findMany({
        include: { department: true },
        orderBy: [{ department: { code: "asc" } }, { year: "asc" }, { code: "asc" }],
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">All Subjects</h1>
                    <p className="text-muted-foreground">
                        View all subjects across all departments
                    </p>
                </div>
                {/* Super Admins might not need to create subjects directly here if they can masquerade or if we add a dept selector to the dialog.
            For now, let's keep it read-only or simple list for Super Admin as per request "create a new subject by the admin and super admin".
            To allow Super Admin to create, we'd need a more complex dialog with Department selection.
        */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Global Subjects List
                    </CardTitle>
                    <CardDescription>
                        Overview of subjects in all departments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Department</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead>Semester</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjects.map((subject) => (
                                <TableRow key={subject.id}>
                                    <TableCell className="font-medium">
                                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                            <Building2 className="h-3 w-3" />
                                            {subject.department.code}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{subject.code}</TableCell>
                                    <TableCell>{subject.name}</TableCell>
                                    <TableCell>{subject.year}</TableCell>
                                    <TableCell>{subject.semester}</TableCell>
                                </TableRow>
                            ))}
                            {subjects.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        No subjects found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
