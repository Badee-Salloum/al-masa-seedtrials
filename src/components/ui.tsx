import { cn } from "@/lib/utils";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";

const BTN: Record<Variant, string> = {
  primary: "bg-brand-action text-white hover:bg-brand-action-hover",
  secondary: "bg-brand-lime text-ink-strong hover:bg-brand-lime-700 hover:text-white",
  outline: "border border-border bg-surface text-ink hover:bg-bg",
  ghost: "text-ink hover:bg-bg",
  destructive: "border border-danger text-danger hover:bg-danger-tint",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(({ className, variant = "primary", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-action focus-visible:ring-offset-2",
      BTN[variant],
      className,
    )}
    {...props}
  />
));
Button.displayName = "Button";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-action",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-action",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-action",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
      {error ? <span className="block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center text-muted">
      {message}
    </div>
  );
}

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-bold text-ink-strong">{title}</h1>
      {action}
    </div>
  );
}
