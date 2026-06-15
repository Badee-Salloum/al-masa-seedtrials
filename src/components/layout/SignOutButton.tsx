import { signOutAction } from "@/server/auth-actions";

export function SignOutButton({ label }: { label: string }) {
  return (
    <form action={signOutAction}>
      <button className="text-sm text-muted hover:text-danger" type="submit">
        {label}
      </button>
    </form>
  );
}
