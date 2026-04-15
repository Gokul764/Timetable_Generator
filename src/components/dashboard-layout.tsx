import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardSidebar } from "./dashboard-sidebar";

const ALLOWED_ROLES = ["super_admin", "admin", "faculty", "student"] as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role;
  if (!role || !ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    redirect("/");
  }
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={role as "super_admin" | "admin" | "faculty" | "student"} />
      <main className="pl-64 min-h-screen">
        <div className="container py-8 px-6">{children}</div>
      </main>
    </div>
  );
}
