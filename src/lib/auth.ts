import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { verifyPassword } from "./password";
import type { UserRole } from "@/types";

const ROLE_REFRESH_MS = 5 * 60 * 1000; // Atualiza role do banco a cada 5 min

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
            },
          });

          if (!user || !user.active) {
            return null;
          }

          const passwordMatch = await verifyPassword(password, user.passwordHash);
          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            professionalProfileId: user.professionalProfile?.id ?? null,
          };
        } catch (err) {
          console.error("[auth] Error during authentication:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // No login: popula token com dados frescos do banco
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.professionalProfileId = user.professionalProfileId ?? null;
        token.lastRefresh = Date.now();
        return token;
      }

      // Nas requisições seguintes: atualiza role/status do banco a cada 5 min
      const lastRefresh = (token.lastRefresh as number) ?? 0;
      if (Date.now() - lastRefresh < ROLE_REFRESH_MS) {
        return token;
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            active: true,
            name: true,
            professionalProfile: { select: { id: true } },
          },
        });

        if (!dbUser || !dbUser.active) {
          // Usuário desativado: invalida a sessão
          return null as unknown as typeof token;
        }

        token.role = dbUser.role;
        token.name = dbUser.name;
        token.professionalProfileId = dbUser.professionalProfile?.id ?? null;
        token.lastRefresh = Date.now();
      } catch {
        // Em caso de erro no banco, mantém o token atual
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
});
