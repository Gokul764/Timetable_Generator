import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { MobileNav } from "./mobile-nav";

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

  const userRole = role as "super_admin" | "admin" | "faculty" | "student";

  return (
    <div className="min-h-screen bg-background">
      <MobileNav role={userRole} />
      <DashboardSidebar role={userRole} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <DashboardHeader />
        <main className="flex-1 mt-16">
          <div className="container py-8 px-4 md:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
