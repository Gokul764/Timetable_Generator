import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ROLES = {
  super_admin: "Super Admin",
  admin: "Admin",
  faculty: "Faculty",
  student: "Student",
} as const;

export type Role = keyof typeof ROLES;

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export const DEFAULT_SLOTS = [
  "08:45-09:35",
  "09:35-10:25",
  "10:40-11:30",
  "11:30-12:30",
  "13:30-14:20",
  "14:20-15:10",
  "15:25-16:25",
] as const;

export const TIMETABLE_PERIODS = [
  { label: "I", start: "08:45", end: "09:35" },
  { label: "II", start: "09:35", end: "10:25" },
  { label: "III", start: "10:40", end: "11:30" },
  { label: "IV", start: "11:30", end: "12:30" },
  { label: "V", start: "13:30", end: "14:20" },
  { label: "VI", start: "14:20", end: "15:10" },
  { label: "VII", start: "15:25", end: "16:25" },
] as const;

export function cleanSubjectName(name: string) {
  return name.replace(/\s*\(Lab\)$/i, "").trim();
}
