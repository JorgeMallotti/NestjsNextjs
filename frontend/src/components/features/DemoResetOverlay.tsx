"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Strings } from "@/strings";
import Button from "@/components/ui/Button";
import type { DemoResetPhase } from "@/hooks/useDemoReset";

interface DemoResetOverlayProps {
  phase: DemoResetPhase;
  strings: Strings;
  onRetry: () => void;
}

/**
 * Full-screen blocking overlay shown while the demo database is being reset.
 * - "running": spinner + message, no action buttons (blocks ALL interaction).
 * - "error":   error message + "Try again" button (reloads the page).
 */
export default function DemoResetOverlay({
  phase,
  strings,
  onRetry,
}: DemoResetOverlayProps) {
  const prefersReducedMotion = useReducedMotion();
  const isError = phase === "error";
  const t = strings.demo;

  return (
    <motion.div
      className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 bg-white/95 px-6 text-center backdrop-blur-sm dark:bg-zinc-950/95"
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25 }}
    >
      {isError ? (
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-3xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 400, damping: 17 }
          }
        >
          ⚠️
        </motion.div>
      ) : (
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-primary/20 border-t-primary"
          animate={prefersReducedMotion ? undefined : { rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {isError ? t.resetOverlayError : t.resetOverlayTitle}
        </h2>
        <p className="max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {isError
            ? t.resetOverlayText
            : `${t.resetOverlayText} ${t.resetOverlayCheckBack}`}
        </p>
      </div>

      {isError && (
        <Button size="lg" onClick={onRetry}>
          {t.resetOverlayRetry}
        </Button>
      )}
    </motion.div>
  );
}
