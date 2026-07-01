"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  getClientUser,
  getClientOrders,
  getClientClaims,
} from "@/lib/api/client";
import type { ClientUser, Order, Claim } from "@/types";

export default function ClientDashboardPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);
  const currency = strings.common.currencySymbol;

  const [user, setUser] = useState<ClientUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getClientUser(),
      getClientOrders("cli-001"),
      getClientClaims("cli-001"),
    ])
      .then(([u, o, c]) => {
        if (!cancelled) {
          setUser(u);
          setOrders(o);
          setClaims(c);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const formatCurrency = (v: number) =>
    `${currency} ${v.toLocaleString("en-US")}`;

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status === "pending_approval",
  ).length;
  const confirmedOrders = orders.filter(
    (o) => o.status === "confirmed" || o.status === "shipped",
  ).length;
  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const activeClaims = claims.filter(
    (c) => c.status === "pending" || c.status === "in_process",
  ).length;
  const recentOrders = orders.slice(0, 5);
  const latestClaim = claims.find(
    (c) => c.status === "pending" || c.status === "in_process",
  );

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

  const statusLabel: Record<string, string> = {
    pending_approval: strings.orders.pendingApproval,
    confirmed: strings.orders.confirmed,
    shipped: strings.orders.shipped,
    delivered: strings.orders.delivered,
    cancelled: strings.orders.cancelled,
  };

  const statusColor: Record<
    string,
    "amber" | "blue" | "purple" | "green" | "gray"
  > = {
    pending_approval: "amber",
    confirmed: "blue",
    shipped: "purple",
    delivered: "green",
    cancelled: "gray",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Welcome */}
      <motion.h1
        variants={item}
        className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 md:text-3xl"
      >
        {strings.client.welcomeMessage}, {user?.name ?? "..."}!
      </motion.h1>
      <motion.p
        variants={item}
        className="mb-6 text-sm text-zinc-500 dark:text-zinc-400"
      >
        {strings.client.dashboardTitle}
      </motion.p>

      {/* Summary cards */}
      <motion.div
        variants={item}
        className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5"
      >
        <SummaryCard
          label={strings.client.totalOrders}
          value={String(totalOrders)}
          color="blue"
        />
        <SummaryCard
          label={strings.client.pendingOrders}
          value={String(pendingOrders)}
          color="amber"
        />
        <SummaryCard
          label={strings.client.approvedOrders}
          value={String(confirmedOrders)}
          color="green"
        />
        <SummaryCard
          label={strings.client.totalSpent}
          value={formatCurrency(totalSpent)}
          color="purple"
        />
        <SummaryCard
          label={strings.client.activeClaims}
          value={String(activeClaims)}
          color="red"
        />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item} className="mb-8">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {strings.dashboard.quickActions}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${lang}/client/orders`}>
              <Button>{strings.client.quickOrder}</Button>
            </Link>
            <Link href={`/${lang}/client/history`}>
              <Button variant="secondary">{strings.client.viewHistory}</Button>
            </Link>
            <Link href={`/${lang}/client/claims`}>
              <Button variant="secondary">{strings.claims.title}</Button>
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Recent orders + Latest claim */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {/* Recent orders */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {strings.client.recentOrders}
            </h2>
            <Link
              href={`/${lang}/client/history`}
              className="text-sm text-primary hover:text-primary-dark"
            >
              {strings.client.viewHistory}
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {strings.orders.noOrders}
            </p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {order.id}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={statusColor[order.status]}>
                      {statusLabel[order.status]}
                    </Badge>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Latest claim */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {strings.client.latestClaim}
            </h2>
            <Link
              href={`/${lang}/client/claims`}
              className="text-sm text-primary hover:text-primary-dark"
            >
              {strings.claims.title}
            </Link>
          </div>
          {latestClaim ? (
            <div className="rounded-lg border border-zinc-100 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {latestClaim.productName}
                </p>
                <Badge
                  color={
                    latestClaim.status === "pending"
                      ? "amber"
                      : latestClaim.status === "in_process"
                        ? "blue"
                        : "green"
                  }
                >
                  {latestClaim.status === "pending"
                    ? strings.claims.pending
                    : latestClaim.status === "in_process"
                      ? strings.claims.inProcess
                      : strings.claims.approved}
                </Badge>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {latestClaim.reason}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {new Date(latestClaim.createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {strings.claims.noClaims}
            </p>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "blue" | "amber" | "green" | "purple" | "red";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
    green:
      "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300",
    red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <Card>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${colorMap[color].split(" ")[1]} ${colorMap[color].split(" ")[4] ?? ""}`}
      >
        {value}
      </p>
    </Card>
  );
}
