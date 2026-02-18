import type { NextAuthConfig } from "next-auth";

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
        const u = user as unknown as Record<string, unknown>;
        token.role = u.role as string;
        token.professionalProfileId = (u.professionalProfileId as string) ?? null;
        token.clientProfileId = (u.clientProfileId as string) ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        const su = session.user as unknown as Record<string, unknown>;
        su.role = token.role;
        su.professionalProfileId = token.professionalProfileId;
        su.clientProfileId = token.clientProfileId;
      }
      return session;
    },
  },
  providers: [], // Providers adicionados no auth.ts completo
  secret: process.env.NEXTAUTH_SECRET,
};
