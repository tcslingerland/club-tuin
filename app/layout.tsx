import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { BottomNav, SideNav } from "@/components/ui/Nav";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Club Tuin",
  description: "Plan en beheer jouw tuin — planten, taken en biodiversiteit",
  icons: { icon: "/logo-mark.svg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="nl"
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        {/* Prevent dark mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s===null&&d))document.documentElement.classList.add('dark');})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-base)] dark:bg-[var(--color-base-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
        <div className="flex flex-1 min-h-screen">
          {user && <SideNav />}
          <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
        </div>
        {user && <BottomNav />}
      </body>
    </html>
  );
}
