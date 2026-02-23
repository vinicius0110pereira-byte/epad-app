import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types";

/**
 * Auth config compartilhado (sem Prisma).
 * Usado pelo middleware (Edge Runtime).
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.professionalProfileId = user.professionalProfileId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as UserRole,
          professionalProfileId: (token.professionalProfileId ?? null) as string | null,
        },
      };
    },
  },
  providers: [], // Providers adicionados no auth.ts completo
  secret: process.env.NEXTAUTH_SECRET,
};
