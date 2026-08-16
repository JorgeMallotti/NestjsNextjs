"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getResetStatus } from "@/lib/api/demo";
import { clearUser } from "@/lib/api/auth";

export type DemoResetPhase = "idle" | "running" | "success" | "error";

/**
 * Origins allowed to send postMessage events to this iframe.
 * The landing page embeds the MVP via iframe and controls the demo reset.
 */
const ALLOWED_ORIGINS = [
  "https://mallottidigital.com",
  "https://www.mallottidigital.com",
  "http://localhost:3000",
];

/** Polling interval in milliseconds. */
const POLL_INTERVAL_MS = 4000;

/** Maximum polling attempts (~180s at 4s interval). */
const MAX_ATTEMPTS = 45;

/**
 * Minimum overlay display time before reloading on success,
 * so fast resets do not cause an unnecessary flash.
 */
const MIN_OVERLAY_MS = 600;

/**
 * postMessage contract with the landing page:
 * - Receives: { type: "demo-reset-started" } from the landing.
 * - Sends:    { type: "demo-reset-running" | "demo-reset-done" | "demo-reset-error" }.
 */
const MSG_STARTED = "demo-reset-started";
const MSG_RUNNING = "demo-reset-running";
const MSG_DONE = "demo-reset-done";
const MSG_ERROR = "demo-reset-error";

/**
 * Manages the "restoring demo" UX:
 * - Listens for postMessage "demo-reset-started" from the landing (validates origin).
 * - Checks the reset status on mount (covers navigation into the MVP mid-reset).
 * - Polls GET /api/demo/reset/status until success/error (max ~180s).
 * - On success: notifies the landing, clears the local session and reloads.
 * - On error: notifies the landing and exposes a retry action.
 */
export function useDemoReset() {
  const [phase, setPhase] = useState<DemoResetPhase>("idle");

  const phaseRef = useRef<DemoResetPhase>("idle");
  const startedAtRef = useRef(0);
  const attemptsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPhaseSafe = useCallback((next: DemoResetPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }, []);

  /**
   * Read the current phase through a function call so TypeScript does not
   * apply control-flow narrowing to the ref (which is mutated asynchronously).
   */
  const isFinished = useCallback(
    () => phaseRef.current === "success" || phaseRef.current === "error",
    [],
  );

  const notifyParent = useCallback((type: string) => {
    try {
      window.parent.postMessage({ type }, "*");
    } catch {
      // Parent may be unavailable (direct navigation without iframe) — ignore.
    }
  }, []);

  const finishSuccess = useCallback(() => {
    stopPolling();
    setPhaseSafe("success");
    notifyParent(MSG_DONE);
    clearUser();
    window.location.reload();
  }, [notifyParent, setPhaseSafe, stopPolling]);

  const finishError = useCallback(() => {
    stopPolling();
    setPhaseSafe("error");
    notifyParent(MSG_ERROR);
  }, [notifyParent, setPhaseSafe, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    attemptsRef.current = 0;

    const tick = async () => {
      if (isFinished()) return;

      let result = null;
      try {
        result = await getResetStatus();
      } catch {
        // Network hiccup — keep polling until the attempt budget runs out.
      }

      // Re-check in case the phase changed while awaiting the fetch.
      if (isFinished()) return;

      if (result && result.status === "success") {
        // Guarantee a minimum overlay duration to avoid a flash on fast resets.
        const elapsed = Date.now() - startedAtRef.current;
        const wait = Math.max(0, MIN_OVERLAY_MS - elapsed);
        delayRef.current = setTimeout(finishSuccess, wait);
        return;
      }

      if (result && result.status === "error") {
        finishError();
        return;
      }

      // Still running (or idle mid-reset) — continue within the budget.
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        finishError();
      }
    };

    // Poll immediately, then every POLL_INTERVAL_MS until finished.
    void tick();
    intervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
  }, [finishError, finishSuccess, isFinished, stopPolling]);

  const startReset = useCallback(() => {
    if (phaseRef.current === "running") return;
    startedAtRef.current = Date.now();
    setPhaseSafe("running");
    notifyParent(MSG_RUNNING);
    startPolling();
  }, [notifyParent, setPhaseSafe, startPolling]);

  const retry = useCallback(() => {
    window.location.reload();
  }, []);

  // Listen for postMessage from the landing page.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!ALLOWED_ORIGINS.includes(event.origin)) return;
      const data = event.data as { type?: string } | null;
      if (!data || typeof data !== "object" || typeof data.type !== "string") {
        return;
      }
      if (data.type === MSG_STARTED) {
        startReset();
      }
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      stopPolling();
    };
  }, [startReset, stopPolling]);

  // Check status on mount — if a reset is already running (e.g. the visitor
  // opened the demo mid-reset), enter maintenance mode immediately.
  useEffect(() => {
    let cancelled = false;
    getResetStatus()
      .then((status) => {
        if (cancelled) return;
        if (status.status === "running") {
          startReset();
        }
      })
      .catch(() => {
        // Ignore — status endpoint is best-effort on mount.
      });
    return () => {
      cancelled = true;
    };
  }, [startReset]);

  return { phase, retry };
}
