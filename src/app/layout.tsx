import type { Metadata } from "next";
import { Cairo, Inter, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "تجارب البذور — الماسة | Al-Masa Seed Trials",
  description:
    "إدارة تجارب البذور — مؤسسة الماسة والنبراس الزراعية / Seed trials management",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${cairo.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster richColors position={dir === "rtl" ? "top-left" : "top-right"} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
