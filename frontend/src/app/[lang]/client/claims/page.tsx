"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  getMyClaims,
  createClaim,
  getMyOrders,
  getClientOrders,
} from "@/lib/api/client";
import { getUser } from "@/lib/api/auth";
import type { Claim, Order } from "@/types";

const emptyForm = {
  orderId: "",
  productId: "",
  reason: "",
  description: "",
};

export default function ClaimsPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);

  const [claims, setClaims] = useState<Claim[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Products available for claim in the selected order
  const [availableProducts, setAvailableProducts] = useState<
    { id: string; name: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyClaims(), getMyOrders()])
      .then(([c, o]) => {
        if (!cancelled) {
          setClaims(c);
          const delivered = o.filter((ord) => ord.status === "delivered");
          setDeliveredOrders(delivered);
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

  /* Update available products when order changes */
  const handleOrderChange = (orderId: string) => {
    const order = deliveredOrders.find((o) => o.id === orderId);
    if (order) {
      setAvailableProducts(
        order.items.map((item) => ({
          id: item.productId,
          name: item.productName,
        })),
      );
    } else {
      setAvailableProducts([]);
    }
    setForm((prev) => ({ ...prev, orderId, productId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.productId || !form.reason || !form.description)
      return;

    setSubmitting(true);
    try {
      const product = availableProducts.find((p) => p.id === form.productId);
      await createClaim({
        orderId: form.orderId,
        productId: form.productId,
        reason: form.reason,
        description: form.description,
      });
      setForm(emptyForm);
      setAvailableProducts([]);
      setSuccessMsg(strings.claims.claimFiled);
      const updated = await getMyClaims();
      setClaims(updated);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor: Record<string, "amber" | "blue" | "green" | "red"> = {
    pending: "amber",
    in_process: "blue",
    approved: "green",
    refused: "red",
  };

  const statusLabel: Record<string, string> = {
    pending: strings.claims.pending,
    in_process: strings.claims.inProcess,
    approved: strings.claims.approved,
    refused: strings.claims.refused,
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
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {strings.claims.title}
      </h1>

      {/* Success message */}
      {successMsg && (
        <motion.div
          className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {successMsg}
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* File a Claim */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {strings.claims.fileClaim}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {strings.claims.selectOrder}
              </label>
              <select
                value={form.orderId}
                onChange={(e) => handleOrderChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
              >
                <option value="">--</option>
                {deliveredOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} — {new Date(o.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {strings.claims.selectProduct}
              </label>
              <select
                value={form.productId}
                onChange={(e) =>
                  setForm({ ...form, productId: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                required
                disabled={!form.orderId}
              >
                <option value="">--</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label={strings.claims.reasonLabel}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {strings.claims.descriptionLabel}
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            <Button
              type="submit"
              loading={submitting}
              disabled={
                !form.orderId ||
                !form.productId ||
                !form.reason ||
                !form.description
              }
              className="w-full"
            >
              {strings.claims.submitClaim}
            </Button>
          </form>
        </Card>

        {/* My Claims */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {strings.claims.myClaims}
          </h2>
          {claims.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {strings.claims.noClaims}
            </p>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-lg border border-zinc-100 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {claim.productName}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {claim.id} —{" "}
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge color={statusColor[claim.status]}>
                      {statusLabel[claim.status]}
                    </Badge>
                  </div>
                  <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">
                      {strings.claims.reason}:
                    </span>{" "}
                    {claim.reason}
                  </p>
                  <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {claim.description}
                  </p>
                  {claim.resolution && (
                    <div className="mt-2 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-700/50">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {strings.claims.confirmResolution}:
                      </p>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        {claim.resolution}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
