import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            department: true,
            facultyProfile: true,
            studentProfile: true,
          },
        });
        if (!user) return null;
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId ?? undefined,
          departmentName: user.department?.name,
          facultyId: user.facultyProfile?.id,
          studentId: user.studentProfile?.id,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
        token.facultyId = user.facultyId;
        token.studentId = user.studentId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { departmentId?: string }).departmentId = token.departmentId as string | undefined;
        (session.user as { departmentName?: string }).departmentName = token.departmentName as string | undefined;
        (session.user as { facultyId?: string }).facultyId = token.facultyId as string | undefined;
        (session.user as { studentId?: string }).studentId = token.studentId as string | undefined;
      }
      return session;
    },
  },
};
