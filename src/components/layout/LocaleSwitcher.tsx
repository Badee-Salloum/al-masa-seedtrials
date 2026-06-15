"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const setLocale = (l: string) => {
    document.cookie = `locale=${l};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLocale("ar")}
        className={cn("px-1", locale === "ar" ? "font-bold text-brand-action" : "text-muted")}
      >
        ع
      </button>
      <span className="text-border">|</span>
      <button
        onClick={() => setLocale("en")}
        className={cn("px-1", locale === "en" ? "font-bold text-brand-action" : "text-muted")}
      >
        EN
      </button>
    </div>
  );
}
