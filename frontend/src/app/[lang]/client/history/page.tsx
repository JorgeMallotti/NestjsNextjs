"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getClientOrders } from "@/lib/api/client";
import type { Order } from "@/types";

export default function HistoryPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);
  const currency = strings.common.currencySymbol;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getClientOrders("cli-001")
      .then((data) => {
        if (!cancelled) setOrders(data);
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

  const filtered = orders.filter((o) =>
    o.id.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {strings.orders.orderHistory}
        </h1>
        <Input
          placeholder={`${strings.common.search}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-zinc-500 dark:text-zinc-400">
            {strings.orders.noOrders}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
            >
              {/* Summary row — clickable */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === order.id ? null : order.id)
                }
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
              >
                <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {order.id}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge color={statusColor[order.status]}>
                    {statusLabel[order.status]}
                  </Badge>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  {order.estimatedDeliveryDate && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {strings.orders.estimatedDelivery}:{" "}
                      {new Date(
                        order.estimatedDeliveryDate,
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <svg
                  className={`ml-2 h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                    expandedId === order.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </button>

              {/* Expanded details */}
              {expandedId === order.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-700"
                >
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs text-zinc-500 dark:text-zinc-400">
                        <th className="pb-1 font-medium">
                          {strings.orders.items}
                        </th>
                        <th className="pb-1 font-medium">
                          {strings.orders.quantity}
                        </th>
                        <th className="pb-1 font-medium">
                          {strings.orders.unitPrice}
                        </th>
                        <th className="pb-1 text-right font-medium">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                      {order.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 text-zinc-900 dark:text-zinc-100">
                            {item.productName}
                          </td>
                          <td className="py-1.5 text-zinc-600 dark:text-zinc-400">
                            {item.quantity}
                          </td>
                          <td className="py-1.5 text-zinc-600 dark:text-zinc-400">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-1.5 text-right font-medium text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
