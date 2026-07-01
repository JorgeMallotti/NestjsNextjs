"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
} from "@/lib/api/client";
import type { Product, ProductFormData } from "@/types";

const emptyForm: ProductFormData = {
  name: "",
  brand: "",
  type: "CPU",
  price: 0,
  isActive: true,
};

export default function ProductsPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);
  const currency = strings.common.currencySymbol;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const productTypes = strings.products.productTypes as unknown as string[];

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      brand: product.brand,
      type: product.type,
      price: product.price,
      isActive: product.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateProduct(editingId, form);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? updated : p)),
        );
      } else {
        const created = await createProduct(form);
        setProducts((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const prev = products;
    setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleteId(null);
    try {
      await deleteProduct(deleteId);
    } catch {
      setProducts(prev);
    }
  };

  const handleToggleActive = async (id: string) => {
    const prev = products;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
    );
    try {
      await toggleProductActive(id);
    } catch {
      setProducts(prev);
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
          {strings.products.title}
        </h1>
        <div className="flex items-center gap-3">
          <Input
            placeholder={`${strings.common.search}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={openAdd}>{strings.products.addProduct}</Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-zinc-500 dark:text-zinc-400">
            {strings.products.noProducts}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <Th>{strings.products.productName}</Th>
                <Th className="hidden sm:table-cell">
                  {strings.products.brand}
                </Th>
                <Th className="hidden sm:table-cell">
                  {strings.products.type}
                </Th>
                <Th>{strings.products.price}</Th>
                <Th>Status</Th>
                <Th>{strings.common.actions}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {filtered.map((product) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/50"
                >
                  <Td>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {product.name}
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell text-zinc-600 dark:text-zinc-400">
                    {product.brand}
                  </Td>
                  <Td className="hidden sm:table-cell text-zinc-600 dark:text-zinc-400">
                    {product.type}
                  </Td>
                  <Td className="font-medium text-zinc-900 dark:text-zinc-100">
                    {currency} {product.price.toLocaleString("en-US")}
                  </Td>
                  <Td>
                    <Badge color={product.isActive ? "green" : "gray"}>
                      {product.isActive
                        ? strings.products.active
                        : strings.products.inactive}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(product)}
                      >
                        {strings.common.edit}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(product.id)}
                      >
                        {product.isActive
                          ? strings.products.disableProduct
                          : strings.products.enableProduct}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(product.id)}
                        className="text-danger hover:text-red-700 dark:hover:text-red-400"
                      >
                        {strings.common.delete}
                      </Button>
                    </div>
                  </Td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingId ? strings.products.editProduct : strings.products.addProduct
        }
      >
        <div className="space-y-4">
          <Input
            label={strings.products.productName}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label={strings.products.brand}
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {strings.products.type}
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {productTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={`${strings.products.price} (${currency})`}
            type="number"
            value={form.price === 0 ? "" : String(form.price)}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value) })
            }
            required
          />
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary dark:border-zinc-600"
            />
            <label
              htmlFor="isActive"
              className="text-sm text-zinc-700 dark:text-zinc-300"
            >
              {strings.products.active}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              {strings.common.cancel}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {strings.common.save}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title={strings.products.deleteProduct}
        message={strings.products.confirmDelete}
        confirmLabel={strings.common.delete}
        cancelLabel={strings.common.cancel}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </motion.div>
  );
}

/* ─── Table helpers ───────────────────────────────────── */

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
