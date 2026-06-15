import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      nurseryIds: string[];
      totpEnabled: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    nurseryIds: string[];
    totpEnabled: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: Role;
    nurseryIds: string[];
    totpEnabled: boolean;
  }
}
