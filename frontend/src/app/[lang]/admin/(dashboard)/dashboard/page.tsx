"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Card from "@/components/ui/Card";
import { getDashboardSummary } from "@/lib/api/client";
import type { DashboardSummary } from "@/types";

export default function DashboardPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);
  const currency = strings.common.currencySymbol;

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  const formatCurrency = (value: number) =>
    `${currency} ${value.toLocaleString("en-US")}`;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="ml-3 text-zinc-500 dark:text-zinc-400">
          {strings.common.loading}
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-10 text-center text-zinc-500 dark:text-zinc-400">
        {strings.common.error}
      </p>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Page title */}
      <motion.h1
        variants={item}
        className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50 md:text-3xl"
      >
        {strings.admin.dashboardTitle}
      </motion.h1>

      {/* Summary cards */}
      <motion.div
        variants={item}
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <SummaryCard
          label={strings.dashboard.totalRevenue}
          value={formatCurrency(data.totalRevenue)}
          icon={<RevenueIcon />}
          color="blue"
        />
        <SummaryCard
          label={strings.dashboard.activeClients}
          value={String(data.activeClients)}
          icon={<ClientsIcon />}
          color="green"
        />
        <SummaryCard
          label={strings.dashboard.availableTrucks}
          value={String(data.availableTrucks)}
          icon={<TruckIcon />}
          color="amber"
        />
        <SummaryCard
          label={strings.dashboard.activeWorkers}
          value={String(data.activeWorkers)}
          icon={<WorkersIcon />}
          color="purple"
        />
      </motion.div>

      {/* Revenue breakdown */}
      <motion.div variants={item} className="mb-8">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {strings.dashboard.revenueOverview}
          </h2>
          <div className="space-y-3">
            <RevenueBar
              label={strings.dashboard.lastMonth}
              value={data.revenueLastMonth}
              max={data.revenueLastYear}
              currency={currency}
            />
            <RevenueBar
              label={strings.dashboard.last3Months}
              value={data.revenueLast3Months}
              max={data.revenueLastYear}
              currency={currency}
            />
            <RevenueBar
              label={strings.dashboard.last6Months}
              value={data.revenueLast6Months}
              max={data.revenueLastYear}
              currency={currency}
            />
            <RevenueBar
              label={strings.dashboard.lastYear}
              value={data.revenueLastYear}
              max={data.revenueLastYear}
              currency={currency}
            />
          </div>
        </Card>
      </motion.div>

      {/* Quick actions + Recent activity */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Quick actions */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {strings.dashboard.quickActions}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickActionLink
              href={`/${lang}/admin/clients`}
              label={strings.nav.clients}
              icon={<ClientsIcon />}
            />
            <QuickActionLink
              href={`/${lang}/admin/trucks`}
              label={strings.nav.trucks}
              icon={<TruckIcon />}
            />
            <QuickActionLink
              href={`/${lang}/admin/workers`}
              label={strings.nav.workers}
              icon={<WorkersIcon />}
            />
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {strings.dashboard.recentActivity}
          </h2>
          <div className="space-y-3">
            {data.recentActivity.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border border-zinc-100 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
              >
                <ActivityIcon type={activity.type} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {activity.description}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ─── Sub-components ─────────────────────────────────── */

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "purple";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
    green:
      "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card hover>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {value}
            </p>
          </div>
          <div className={`rounded-lg p-2.5 ${colorMap[color]}`}>{icon}</div>
        </div>
      </Card>
    </motion.div>
  );
}

function RevenueBar({
  label,
  value,
  max,
  currency,
}: {
  label: string;
  value: number;
  max: number;
  currency: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {currency}
          {value.toLocaleString("en-US")}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function QuickActionLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-zinc-200 bg-white p-4 text-center transition-colors hover:border-primary/30 hover:bg-primary/5 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-primary/40 dark:hover:bg-primary/10"
      >
        <div className="text-primary">{icon}</div>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
      </motion.div>
    </Link>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const colors: Record<string, string> = {
    sale_completed: "text-green-500",
    client_added: "text-blue-500",
    truck_status_change: "text-amber-500",
    worker_status_change: "text-purple-500",
  };

  return (
    <div
      className={`mt-0.5 shrink-0 rounded-full p-1.5 ${colors[type] ?? "text-zinc-400"} bg-current/10`}
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {type === "sale_completed" && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        )}
        {type === "client_added" && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
          />
        )}
        {(type === "truck_status_change" ||
          type === "worker_status_change") && (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
          />
        )}
      </svg>
    </div>
  );
}

/* ─── Icons ───────────────────────────────────────────── */

function RevenueIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25"
      />
    </svg>
  );
}

function WorkersIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}
