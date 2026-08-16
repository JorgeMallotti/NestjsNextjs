"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Strings } from "@/strings";
import BackToLanding from "@/components/features/BackToLanding";

interface ClientSidebarProps {
  strings: Strings;
  lang: string;
}

const navItems = [
  { key: "clientDashboard", href: "client/dashboard", icon: DashboardIcon },
  { key: "purchaseHistory", href: "client/history", icon: HistoryIcon },
  { key: "placeOrder", href: "client/orders", icon: OrdersIcon },
  { key: "claims", href: "client/claims", icon: ClaimsIcon },
] as const;

export default function ClientSidebar({ strings, lang }: ClientSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname.includes(`/${lang}/${href}`);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 lg:hidden"
        aria-label="Open menu"
      >
        <svg
          className="h-5 w-5 text-zinc-700 dark:text-zinc-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-sidebar dark:border-sidebar-border dark:bg-sidebar lg:flex lg:flex-col">
        <SidebarContent strings={strings} lang={lang} isActive={isActive} />
      </aside>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="relative flex h-full w-64 flex-col border-r border-zinc-200 bg-sidebar dark:border-sidebar-border dark:bg-sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SidebarContent
                strings={strings}
                lang={lang}
                isActive={isActive}
                onNavClick={() => setMobileOpen(false)}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface SidebarContentProps {
  strings: Strings;
  lang: string;
  isActive: (href: string) => boolean;
  onNavClick?: () => void;
}

function SidebarContent({
  strings,
  lang,
  isActive,
  onNavClick,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 border-b border-zinc-200 px-6 py-5 dark:border-zinc-700">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
          CT
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {strings.home.title}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ key, href, icon: Icon }) => (
          <Link
            key={key}
            href={`/${lang}/${href}`}
            onClick={onNavClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(href)
                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                : "text-zinc-600 hover:bg-sidebar-hover dark:text-zinc-400 dark:hover:bg-sidebar-hover"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {strings.nav[key as keyof typeof strings.nav]}
          </Link>
        ))}
      </nav>

      {/* Back to landing + Logout */}
      <div className="space-y-1 border-t border-zinc-200 p-3 dark:border-zinc-700">
        <BackToLanding strings={strings} className="w-full" />
        <Link
          href={`/${lang}/login`}
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-sidebar-hover dark:text-zinc-400 dark:hover:bg-sidebar-hover"
        >
          <LogoutIcon className="h-5 w-5 shrink-0" />
          {strings.nav.logout}
        </Link>
      </div>
    </div>
  );
}

/* ─── Icons ───────────────────────────────────────────── */

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
      />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

function ClaimsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  );
}
