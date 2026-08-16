"use client";

import type { ReactNode } from "react";
import { getStrings } from "@/strings";
import { useDemoReset } from "@/hooks/useDemoReset";
import DemoResetOverlay from "./DemoResetOverlay";

interface DemoResetProviderProps {
  lang: string;
  children: ReactNode;
}

/**
 * Wraps the MVP app and wires the "restoring demo" UX:
 * listens for postMessage from the landing, polls the reset status
 * and shows a full-screen blocking overlay while the demo resets.
 */
export default function DemoResetProvider({
  lang,
  children,
}: DemoResetProviderProps) {
  const { phase, retry } = useDemoReset();
  const strings = getStrings(lang);
  const showOverlay = phase === "running" || phase === "error";

  return (
    <>
      {children}
      {showOverlay && (
        <DemoResetOverlay phase={phase} strings={strings} onRetry={retry} />
      )}
    </>
  );
}
