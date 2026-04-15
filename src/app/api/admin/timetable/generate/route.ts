import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { generateAllYearsTimetable, generateTimetableForDepartment } from "@/lib/timetable-generator";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const departmentId = (session?.user as { departmentId?: string })?.departmentId;
  if (role !== "admin" || !departmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const targetDeptId = body?.departmentId ?? departmentId;
  const semesterType = body?.semesterType as 'odd' | 'even' | undefined;
  const year = body?.year as number | undefined;
  const semester = body?.semester as number | undefined;

  if (targetDeptId !== departmentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    if (year && semester) {
      await generateTimetableForDepartment(targetDeptId, year, semester);
    } else {
      await generateAllYearsTimetable(targetDeptId, semesterType);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
