import type { ReactNode } from "react";
import { getStrings } from "@/strings";
import { ClientLayoutClient } from "./ClientLayoutClient";

interface ClientLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function ClientLayout({
  children,
  params,
}: ClientLayoutProps) {
  const { lang } = await params;
  const strings = getStrings(lang);

  return (
    <ClientLayoutClient strings={strings} lang={lang}>
      {children}
    </ClientLayoutClient>
  );
}
