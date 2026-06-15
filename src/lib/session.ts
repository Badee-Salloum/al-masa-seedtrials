import { auth } from "@/auth";
import { AuthzError, type SessionUser } from "@/lib/authz";

// Boundary used by server actions/queries — easy to mock in tests.
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    nurseryIds: session.user.nurseryIds ?? [],
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthzError("errors.denied");
  return user;
}
