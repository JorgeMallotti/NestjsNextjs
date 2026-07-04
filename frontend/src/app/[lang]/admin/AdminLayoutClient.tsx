"use client";

import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import type { Strings } from "@/strings";
import Sidebar from "@/components/layout/Sidebar";

interface AdminLayoutClientProps {
  children: ReactNode;
  strings: Strings;
  lang: string;
}

export function AdminLayoutClient({
  children,
  strings,
  lang,
}: AdminLayoutClientProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="flex min-h-screen"
      data-reduced-motion={prefersReducedMotion}
    >
      <Sidebar strings={strings} lang={lang} />
      <main className="flex-1 overflow-auto bg-muted p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
