import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { verifyTotp } from "@/lib/totp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        token: {}, // optional TOTP code
      },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        const token = creds?.token ? String(creds.token) : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { nurseries: { select: { id: true } } },
        });
        if (!user || !user.active) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        // If 2FA is enabled, a valid TOTP is mandatory.
        if (user.totpEnabled) {
          if (!token || !user.totpSecret || !verifyTotp(token, user.totpSecret)) {
            return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          totpEnabled: user.totpEnabled,
          nurseryIds: user.nurseries.map((n) => n.id),
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.uid = user.id as string;
        token.role = user.role;
        token.nurseryIds = user.nurseryIds;
        token.totpEnabled = user.totpEnabled;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.uid as string;
      session.user.role = token.role as typeof session.user.role;
      session.user.nurseryIds = (token.nurseryIds as string[]) ?? [];
      session.user.totpEnabled = Boolean(token.totpEnabled);
      return session;
    },
  },
});
