import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    if (role === "super_admin") redirect("/super-admin");
    if (role === "admin") redirect("/admin");
    if (role === "faculty") redirect("/faculty");
    if (role === "student") redirect("/student");
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          College Timetable Generator
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          AI-powered timetable generation for your college. Sign in to access your dashboard.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
