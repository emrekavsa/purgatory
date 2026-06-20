import { AppProvider } from "@/context/AppContext";
import "../styles/globals.css";
import ClientShell from "@/components/ClientShell";
import localFont from "next/font/local";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const aktura = localFont({
  src: "../../public/fonts/Aktura-Regular.woff2",
  variable: "--font-aktura",
  display: "swap",
});

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Purgatory",
  description: "Join the discussion and cast your vote.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let initialUser = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (profile) {
      initialUser = { ...user, ...profile };
    }
  }

  return (
    <html lang="en" className={aktura.variable}>
      <body>
        <AppProvider initialUser={initialUser}>
          <ClientShell>{children}</ClientShell>
        </AppProvider>
      </body>
    </html>
  );
}
