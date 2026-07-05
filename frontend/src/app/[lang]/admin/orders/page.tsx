"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  getOrders,
  approveOrder,
  shipOrder,
  deliverOrder,
  cancelOrder as cancelOrderApi,
} from "@/lib/api/client";
import type { Order } from "@/types";

const statusColorMap: Record<
  string,
  "amber" | "blue" | "purple" | "green" | "gray"
> = {
  pending_approval: "amber",
  confirmed: "blue",
  shipped: "purple",
  delivered: "green",
  cancelled: "gray",
};

const statusFilters = [
  "all",
  "pending_approval",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export default function AdminOrdersPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);
  const currency = strings.common.currencySymbol;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Approve modal
  const [approveId, setApproveId] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Detail modal
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrders()
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

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        (o.clientName ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  /* ─── Approve order ────────────────────────────────── */

  const handleApprove = async () => {
    if (!approveId) return;
    const prev = orders;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === approveId
          ? {
              ...o,
              status: "confirmed" as const,
              estimatedDeliveryDate: deliveryDate || null,
              adminNote: adminNote || null,
            }
          : o,
      ),
    );
    setSaving(true);
    try {
      await approveOrder(
        approveId,
        deliveryDate || undefined,
        adminNote || undefined,
      );
      setApproveId(null);
      setDeliveryDate("");
      setAdminNote("");
    } catch {
      setOrders(prev);
    } finally {
      setSaving(false);
    }
  };

  /* ─── Ship order ───────────────────────────────────── */

  const handleShip = async (id: string) => {
    const prev = orders;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "shipped" as const } : o)),
    );
    try {
      await shipOrder(id);
    } catch {
      setOrders(prev);
    }
  };

  /* ─── Deliver order ────────────────────────────────── */

  const handleDeliver = async (id: string) => {
    const prev = orders;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: "delivered" as const } : o,
      ),
    );
    try {
      await deliverOrder(id);
    } catch {
      setOrders(prev);
    }
  };

  /* ─── Cancel order ─────────────────────────────────── */

  const handleCancel = async (id: string) => {
    const prev = orders;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: "cancelled" as const } : o,
      ),
    );
    try {
      await cancelOrderApi(id);
    } catch {
      setOrders(prev);
    }
  };

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
          {strings.orders.title}
        </h1>
        <Input
          placeholder={`${strings.common.search}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === s
                ? "bg-primary text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {s === "all" ? strings.common.all : statusLabel[s]}
          </button>
        ))}
      </div>

      {/* Orders list */}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: order info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailOrder(order)}
                      className="truncate text-sm font-medium text-primary hover:text-primary-dark dark:text-primary-light"
                    >
                      {order.id}
                    </button>
                    <Badge color={statusColorMap[order.status] ?? "gray"}>
                      {statusLabel[order.status] ?? order.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {(order as any).clientName ??
                      (order as any).client?.name ??
                      "—"}{" "}
                    — {new Date(order.createdAt).toLocaleDateString()} —{" "}
                    {(order as any).items?.length ?? 0} {strings.orders.items}
                  </p>
                  {order.estimatedDeliveryDate && (
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {strings.orders.estimatedDelivery}:{" "}
                      {new Date(
                        order.estimatedDeliveryDate,
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Right: amount + actions */}
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(order.totalAmount)}
                  </span>

                  {/* Status-specific actions */}
                  {order.status === "pending_approval" && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          setApproveId(order.id);
                          // Suggest delivery date 7 days from now
                          const d = new Date();
                          d.setDate(d.getDate() + 7);
                          setDeliveryDate(d.toISOString().split("T")[0]);
                        }}
                      >
                        {strings.orders.confirmed}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(order.id)}
                        className="text-danger"
                      >
                        {strings.orders.cancelOrder}
                      </Button>
                    </div>
                  )}
                  {order.status === "confirmed" && (
                    <Button size="sm" onClick={() => handleShip(order.id)}>
                      {strings.orders.shipped}
                    </Button>
                  )}
                  {order.status === "shipped" && (
                    <Button size="sm" onClick={() => handleDeliver(order.id)}>
                      {strings.orders.delivered}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Approve modal */}
      <Modal
        open={!!approveId}
        onClose={() => {
          setApproveId(null);
          setDeliveryDate("");
          setAdminNote("");
        }}
        title={strings.orders.orderConfirmed}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {strings.orders.deliveryDateSet}
          </p>
          <Input
            label={strings.orders.estimatedDelivery}
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {strings.orders.adminNoteLabel ?? "Message to client"}
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder={
                strings.orders.adminNotePlaceholder ??
                "e.g. Delayed due to production of X component..."
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setApproveId(null);
                setDeliveryDate("");
                setAdminNote("");
              }}
            >
              {strings.common.cancel}
            </Button>
            <Button onClick={handleApprove} loading={saving}>
              {strings.orders.confirmed}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={`${strings.orders.orderId}: ${detailOrder?.id ?? ""}`}
      >
        {detailOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {strings.clients.clientName}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {(detailOrder as any).clientName ??
                    (detailOrder as any).client?.name ??
                    "—"}
                </p>
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {strings.orders.status}
                </p>
                <Badge color={statusColorMap[detailOrder.status] ?? "gray"}>
                  {statusLabel[detailOrder.status] ?? detailOrder.status}
                </Badge>
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {strings.orders.orderDate}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {new Date(detailOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {strings.orders.totalAmount}
                </p>
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(detailOrder.totalAmount)}
                </p>
              </div>
            </div>

            {/* Admin Note */}
            {detailOrder.adminNote && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {strings.orders.adminNoteLabel ?? "Admin Message"}
                </h3>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                  {detailOrder.adminNote}
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {strings.orders.items}
              </h3>
              <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
                {(detailOrder as any).items?.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {item.productName}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </span>
                  </div>
                )) ?? (
                  <p className="px-3 py-4 text-center text-sm text-zinc-400">
                    —
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
