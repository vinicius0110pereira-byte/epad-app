import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { verifyPassword } from "./password";
import type { UserRole } from "@/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              professionalProfile: { select: { id: true } },
              clientProfile: { select: { id: true } },
            },
          });

          if (!user || !user.active) {
            return null;
          }

          const passwordMatch = await verifyPassword(password, user.passwordHash);
          if (!passwordMatch) {
            return null;
          }

          // RETURN INSIDE TRY — user is in scope here
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            professionalProfileId: user.professionalProfile?.id ?? null,
            clientProfileId: user.clientProfile?.id ?? null,
          };
        } catch (err) {
          console.error("[auth] Error during authentication:", err);
          return null;
        }
      },
    }),
  ],
});
