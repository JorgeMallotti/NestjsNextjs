"use client";

import { type MouseEvent } from "react";
import type { Strings } from "@/strings";

/**
 * Landing page URL. Override via NEXT_PUBLIC_LANDING_URL when needed.
 */
const LANDING_URL =
  process.env.NEXT_PUBLIC_LANDING_URL ?? "https://mallottidigital.com";

interface BackToLandingProps {
  strings: Strings;
  /** On mobile show only the icon (aria-label keeps it accessible) to save space. */
  compact?: boolean;
  className?: string;
}

/**
 * Button that takes the user back to the Mallotti Digital landing page.
 *
 * Behavior decision:
 * - Inside an iframe (the landing embeds this demo): opens the landing in a
 *   NEW TAB. Navigating the iframe itself would embed the landing inside the
 *   landing (broken/recursive UX) and would destroy the demo state.
 * - Outside an iframe (direct visit): navigates normally to the landing.
 *
 * Touch target >= 44px (h-11) and styled for both light and dark mode.
 */
export default function BackToLanding({
  strings,
  compact = false,
  className = "",
}: BackToLandingProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const insideIframe = window.self !== window.top;
    if (insideIframe) {
      e.preventDefault();
      window.open(LANDING_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <a
      href={LANDING_URL}
      onClick={handleClick}
      rel="noopener noreferrer"
      aria-label={strings.nav.backToLanding}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 ${className}`}
    >
      <svg
        className="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        />
      </svg>
      <span className={compact ? "hidden sm:inline" : ""}>
        {strings.nav.backToLanding}
      </span>
    </a>
  );
}
