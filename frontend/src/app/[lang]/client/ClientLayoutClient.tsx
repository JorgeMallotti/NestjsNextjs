"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import type { Strings } from "@/strings";
import ClientSidebar from "@/components/layout/ClientSidebar";

interface ClientLayoutClientProps {
  children: ReactNode;
  strings: Strings;
  lang: string;
}

export function ClientLayoutClient({
  children,
  strings,
  lang,
}: ClientLayoutClientProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="flex min-h-screen"
      data-reduced-motion={prefersReducedMotion}
      suppressHydrationWarning
    >
      <ClientSidebar strings={strings} lang={lang} />
      <main className="flex-1 overflow-auto bg-muted p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
