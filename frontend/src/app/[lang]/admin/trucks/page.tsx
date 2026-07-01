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
  getTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
} from "@/lib/api/client";
import type { Truck, TruckFormData } from "@/types";

const statusColorMap: Record<
  Truck["status"],
  "green" | "blue" | "amber" | "gray"
> = {
  available: "green",
  in_use: "blue",
  under_repair: "amber",
  disabled: "gray",
};

const emptyForm: TruckFormData = {
  plateNumber: "",
  model: "",
  capacity: 0,
  kilometrage: 0,
  status: "available",
};

export default function TrucksPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);

  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TruckFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTrucks()
      .then((data) => {
        if (!cancelled) setTrucks(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = trucks.filter(
    (t) =>
      t.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.model.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (truck: Truck) => {
    setEditingId(truck.id);
    setForm({
      plateNumber: truck.plateNumber,
      model: truck.model,
      capacity: truck.capacity,
      kilometrage: truck.kilometrage,
      status: truck.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateTruck(editingId, form);
        setTrucks((prev) =>
          prev.map((t) => (t.id === editingId ? updated : t)),
        );
      } else {
        const created = await createTruck(form);
        setTrucks((prev) => [...prev, created]);
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
    const prev = trucks;
    setTrucks((prev) => prev.filter((t) => t.id !== deleteId));
    setDeleteId(null);
    try {
      await deleteTruck(deleteId);
    } catch {
      setTrucks(prev);
    }
  };

  const handleStatusChange = async (id: string, status: Truck["status"]) => {
    const prev = trucks;
    setTrucks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await updateTruck(id, { status });
    } catch {
      setTrucks(prev);
    }
  };

  const statusLabel: Record<Truck["status"], string> = {
    available: strings.trucks.available,
    in_use: strings.trucks.inUse,
    under_repair: strings.trucks.underRepair,
    disabled: strings.trucks.disabled,
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
          {strings.trucks.title}
        </h1>
        <div className="flex items-center gap-3">
          <Input
            placeholder={`${strings.common.search}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={openAdd}>{strings.trucks.addTruck}</Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-zinc-500 dark:text-zinc-400">
            {strings.trucks.noTrucks}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <Th>{strings.trucks.plateNumber}</Th>
                <Th className="hidden sm:table-cell">{strings.trucks.model}</Th>
                <Th className="hidden md:table-cell">
                  {strings.trucks.capacity}
                </Th>
                <Th className="hidden md:table-cell">
                  {strings.trucks.kilometrage}
                </Th>
                <Th>{strings.trucks.status}</Th>
                <Th>{strings.common.actions}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {filtered.map((truck) => (
                <motion.tr
                  key={truck.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/50"
                >
                  <Td>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {truck.plateNumber}
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell text-zinc-600 dark:text-zinc-400">
                    {truck.model}
                  </Td>
                  <Td className="hidden md:table-cell text-zinc-600 dark:text-zinc-400">
                    {truck.capacity.toLocaleString()}{" "}
                    {strings.trucks.capacityUnit}
                  </Td>
                  <Td className="hidden md:table-cell text-zinc-600 dark:text-zinc-400">
                    {truck.kilometrage.toLocaleString()} km
                  </Td>
                  <Td>
                    <Badge color={statusColorMap[truck.status]}>
                      {statusLabel[truck.status]}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(truck)}
                      >
                        {strings.common.edit}
                      </Button>
                      <div className="relative group">
                        <Button variant="ghost" size="sm">
                          {strings.common.filter}
                        </Button>
                        <div className="absolute right-0 top-full z-10 mt-1 hidden w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg group-hover:block dark:border-zinc-700 dark:bg-zinc-800">
                          {(
                            [
                              "available",
                              "in_use",
                              "under_repair",
                              "disabled",
                            ] as Truck["status"][]
                          ).map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(truck.id, s)}
                              className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                                truck.status === s
                                  ? "bg-zinc-100 font-medium dark:bg-zinc-700"
                                  : ""
                              }`}
                            >
                              {statusLabel[s]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(truck.id)}
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
        title={editingId ? strings.trucks.editTruck : strings.trucks.addTruck}
      >
        <div className="space-y-4">
          <Input
            label={strings.trucks.plateNumber}
            value={form.plateNumber}
            onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
            required
          />
          <Input
            label={strings.trucks.model}
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            required
          />
          <Input
            label={`${strings.trucks.capacity} (${strings.trucks.capacityUnit})`}
            type="number"
            value={form.capacity === 0 ? "" : String(form.capacity)}
            onChange={(e) =>
              setForm({ ...form, capacity: Number(e.target.value) })
            }
            required
          />
          <Input
            label={`${strings.trucks.kilometrage} (km)`}
            type="number"
            value={form.kilometrage === 0 ? "" : String(form.kilometrage)}
            onChange={(e) =>
              setForm({ ...form, kilometrage: Number(e.target.value) })
            }
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {strings.trucks.status}
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as Truck["status"],
                })
              }
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="available">{strings.trucks.available}</option>
              <option value="in_use">{strings.trucks.inUse}</option>
              <option value="under_repair">{strings.trucks.underRepair}</option>
              <option value="disabled">{strings.trucks.disabled}</option>
            </select>
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
        title={strings.trucks.deleteTruck}
        message={strings.trucks.confirmDelete}
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
