import type { ReactNode } from "react";
import { getStrings } from "@/strings";
import { AdminLayoutClient } from "./AdminLayoutClient";

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function AdminDashboardLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { lang } = await params;
  const strings = getStrings(lang);

  return (
    <AdminLayoutClient strings={strings} lang={lang}>
      {children}
    </AdminLayoutClient>
  );
}
