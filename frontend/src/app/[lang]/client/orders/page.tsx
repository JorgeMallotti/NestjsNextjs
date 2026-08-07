"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  getActiveProducts,
  getMyOrders,
  createOrder,
  cancelOrder,
  deliverOrderClient,
} from "@/lib/api/client";
import { getUser } from "@/lib/api/auth";
import type { Product, Order } from "@/types";

type Tab = "new" | "active";

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function OrdersPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);
  const currency = strings.common.currencySymbol;

  const [tab, setTab] = useState<Tab>("new");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // New order form
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Cancel
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getActiveProducts(), getMyOrders()])
      .then(([p, o]) => {
        if (!cancelled) {
          setProducts(p);
          setOrders(o);
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

  const activeOrders = orders.filter(
    (o) =>
      o.status === "pending_approval" ||
      o.status === "confirmed" ||
      o.status === "shipped",
  );

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

  /* ─── Cart operations ──────────────────────────────── */

  const addToCart = () => {
    if (!selectedProductId || quantity < 1) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === selectedProductId);
      if (existing) {
        return prev.map((c) =>
          c.productId === selectedProductId
            ? { ...c, quantity: c.quantity + quantity }
            : c,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.price,
        },
      ];
    });
    setQuantity(1);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  /* ─── Submit order ─────────────────────────────────── */

  const handleSubmitOrder = async () => {
    if (!deliveryAddress.trim()) return;
    try {
      await createOrder({
        deliveryAddress: deliveryAddress.trim(),
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
        })),
      });
      setCart([]);
      setDeliveryAddress("");
      setSuccessMsg(strings.orders.orderPlaced);
      setShowConfirm(false);
      // Refresh orders
      const updated = await getMyOrders();
      setOrders(updated);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      // Error handled silently
    }
  };

  /* ─── Cancel order ─────────────────────────────────── */

  const handleCancelOrder = async () => {
    if (!cancelId) return;
    const prev = orders;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === cancelId ? { ...o, status: "cancelled" as const } : o,
      ),
    );
    setCancelId(null);
    try {
      await cancelOrder(cancelId);
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
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {strings.orders.title}
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

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-800">
        <button
          onClick={() => setTab("new")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "new"
              ? "bg-primary text-white"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
          }`}
        >
          {strings.orders.newOrder}
        </button>
        <button
          onClick={() => setTab("active")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "active"
              ? "bg-primary text-white"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
          }`}
        >
          {strings.orders.activeOrders}
          {activeOrders.length > 0 && (
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              {activeOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* New Order Tab */}
      {tab === "new" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Product selector */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {strings.orders.chooseProducts}
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {strings.orders.selectProduct}
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">--</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.brand} ({formatCurrency(p.price)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {strings.orders.quantity}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <Button onClick={addToCart} disabled={!selectedProductId}>
                  {strings.orders.addToOrder}
                </Button>
              </div>

              {/* Available products list */}
              <div className="mt-4 max-h-60 space-y-1 overflow-y-auto">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  >
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {p.name}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {p.brand} — {formatCurrency(p.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Cart / Current order */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {strings.orders.currentOrder}
            </h2>

            {/* Delivery address */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {strings.orders.deliveryAddress}{" "}
                <span className="text-danger">*</span>
              </label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={2}
                placeholder={strings.orders.deliveryAddressPlaceholder}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {strings.orders.chooseProducts}
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between rounded-lg border border-zinc-100 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {item.productName}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-xs text-danger hover:text-red-700"
                        >
                          {strings.orders.remove}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {strings.orders.total}
                  </span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <Button
                  className="mt-4 w-full"
                  onClick={() => setShowConfirm(true)}
                  disabled={!deliveryAddress.trim()}
                >
                  {strings.orders.submitOrder}
                </Button>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Active Orders Tab */}
      {tab === "active" && (
        <div className="space-y-3">
          {activeOrders.length === 0 ? (
            <Card>
              <p className="py-10 text-center text-zinc-500 dark:text-zinc-400">
                {strings.orders.noOrders}
              </p>
            </Card>
          ) : (
            activeOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {order.id}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(order.createdAt).toLocaleDateString()} —{" "}
                      {order.items.length} {strings.orders.items}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={statusColor[order.status]}>
                      {statusLabel[order.status]}
                    </Badge>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(order.totalAmount)}
                    </span>
                    {order.deliveryAddress && (
                      <span className="hidden text-xs text-zinc-500 md:inline dark:text-zinc-400">
                        {order.deliveryAddress}
                      </span>
                    )}
                    {order.estimatedDeliveryDate && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {strings.orders.estimatedDelivery}:{" "}
                        {new Date(
                          order.estimatedDeliveryDate,
                        ).toLocaleDateString()}
                      </span>
                    )}
                    {order.adminNote && (
                      <div className="mt-2 w-full rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                        {order.adminNote}
                      </div>
                    )}
                    {order.status === "pending_approval" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancelId(order.id)}
                        className="text-danger"
                      >
                        {strings.orders.cancelOrder}
                      </Button>
                    )}
                    {order.status === "shipped" && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={async () => {
                          const prev = orders;
                          setOrders((prev) =>
                            prev.map((o) =>
                              o.id === order.id
                                ? { ...o, status: "delivered" as const }
                                : o,
                            ),
                          );
                          try {
                            await deliverOrderClient(order.id);
                          } catch {
                            setOrders(prev);
                          }
                        }}
                      >
                        {strings.orders.markAsDelivered}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Submit confirmation */}
      <ConfirmDialog
        open={showConfirm}
        title={strings.orders.submitOrder}
        message={strings.orders.submitOrderConfirm}
        confirmLabel={strings.orders.submitOrder}
        cancelLabel={strings.common.cancel}
        variant="primary"
        onConfirm={handleSubmitOrder}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={!!cancelId}
        title={strings.orders.cancelOrder}
        message={strings.orders.confirmCancel}
        confirmLabel={strings.orders.cancelOrder}
        cancelLabel={strings.common.cancel}
        variant="danger"
        onConfirm={handleCancelOrder}
        onCancel={() => setCancelId(null)}
      />
    </motion.div>
  );
}
