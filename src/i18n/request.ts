import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

// Non-routing i18n: locale comes from a cookie (default Arabic), so no [locale] route segment is needed.
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
