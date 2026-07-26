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
  getWorkers,
  createWorker,
  updateWorker,
  deleteWorker,
} from "@/lib/api/client";
import type { Worker, WorkerFormData } from "@/types";

const statusColorMap: Record<
  Worker["status"],
  "green" | "blue" | "purple" | "amber" | "gray"
> = {
  available: "green",
  driving: "purple",
  on_vacation: "blue",
  sick_leave: "amber",
  inactive: "gray",
};

const emptyForm: WorkerFormData = {
  name: "",
  position: "",
  startDate: "",
  status: "available",
};

export default function WorkersPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkerFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWorkers()
      .then((data) => {
        if (!cancelled) setWorkers(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.position.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (worker: Worker) => {
    setEditingId(worker.id);
    setForm({
      name: worker.name,
      position: worker.position,
      startDate: worker.startDate.split("T")[0],
      status: worker.status,
      reason: "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        reason: editingId ? form.reason : undefined,
      };
      if (editingId) {
        const updated = await updateWorker(editingId, payload as any);
        setWorkers((prev) =>
          prev.map((w) => (w.id === editingId ? updated : w)),
        );
      } else {
        const { reason, ...createPayload } = payload;
        const created = await createWorker(createPayload as any);
        setWorkers((prev) => [...prev, created]);
      }
      setModalOpen(false);
      setSaveError(null);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save worker",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !deleteReason.trim()) return;
    const worker = workers.find((w) => w.id === deleteId);
    if (worker && isWorkerLocked(worker)) return;
    const prev = workers;
    setWorkers((prev) => prev.filter((w) => w.id !== deleteId));
    const id = deleteId;
    const reason = deleteReason.trim();
    setDeleteId(null);
    setDeleteReason("");
    try {
      await deleteWorker(id, reason);
    } catch {
      setWorkers(prev);
    }
  };

  const handleStatusChange = async (id: string, status: Worker["status"]) => {
    const prev = workers;
    setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
    setStatusError(null);
    try {
      await updateWorker(id, { status });
    } catch (err) {
      setWorkers(prev);
      setStatusError(
        err instanceof Error ? err.message : "Failed to update status",
      );
      setTimeout(() => setStatusError(null), 4000);
    }
  };

  const statusLabel: Record<Worker["status"], string> = {
    available: strings.workers.available,
    driving: strings.workers.driving,
    on_vacation: strings.workers.onVacation,
    sick_leave: strings.workers.sickLeave,
    inactive: strings.workers.inactive,
  };

  /** A worker whose status is not "available" is locked — admin cannot change it manually */
  const isWorkerLocked = (worker: Worker) => worker.status !== "available";

  /** Editing worker lock state */
  const editingWorker = editingId
    ? workers.find((w) => w.id === editingId)
    : null;
  const isEditingLocked = editingWorker ? isWorkerLocked(editingWorker) : false;

  /** Available status options for the dropdown (no "driving" — that's system-only) */
  const filteredStatuses: Worker["status"][] =
    isEditingLocked && editingWorker
      ? [editingWorker.status]
      : ["available", "on_vacation", "sick_leave", "inactive"];

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
          {strings.workers.title}
        </h1>
        <div className="flex items-center gap-3">
          <Input
            placeholder={`${strings.common.search}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={openAdd}>{strings.workers.addWorker}</Button>
        </div>
      </div>

      {/* Error message */}
      {statusError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          ❌ {statusError}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-zinc-500 dark:text-zinc-400">
            {strings.workers.noWorkers}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <Th>{strings.workers.workerName}</Th>
                <Th className="hidden sm:table-cell">
                  {strings.workers.position}
                </Th>
                <Th className="hidden md:table-cell">
                  {strings.workers.startDate}
                </Th>
                <Th>{strings.workers.status}</Th>
                <Th>{strings.common.actions}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {filtered.map((worker) => (
                <motion.tr
                  key={worker.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/50"
                >
                  <Td>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {worker.name}
                    </span>
                  </Td>
                  <Td className="hidden sm:table-cell text-zinc-600 dark:text-zinc-400">
                    {worker.position}
                  </Td>
                  <Td className="hidden md:table-cell text-zinc-600 dark:text-zinc-400">
                    {new Date(worker.startDate).toLocaleDateString()}
                  </Td>
                  <Td>
                    <Badge color={statusColorMap[worker.status]}>
                      {statusLabel[worker.status]}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(worker)}
                      >
                        {strings.common.edit}
                      </Button>
                      {isWorkerLocked(worker) ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-amber-600 dark:text-amber-400"
                          title="Worker status is locked — must follow its natural cycle"
                        >
                          🔒 {strings.workers.status}
                        </span>
                      ) : (
                        <div className="relative group">
                          <Button variant="ghost" size="sm">
                            {strings.common.filter}
                          </Button>
                          <div className="absolute right-0 top-full z-10 mt-1 hidden w-40 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg group-hover:block dark:border-zinc-700 dark:bg-zinc-800">
                            {(
                              [
                                "available",
                                "on_vacation",
                                "sick_leave",
                                "inactive",
                              ] as Worker["status"][]
                            ).map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(worker.id, s)}
                                className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                                  worker.status === s
                                    ? "bg-zinc-100 font-medium dark:bg-zinc-700"
                                    : ""
                                }`}
                              >
                                {statusLabel[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {isWorkerLocked(worker) ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-400"
                          title="Cannot delete a worker in this status"
                        >
                          🚫 {strings.common.delete}
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(worker.id)}
                          className="text-danger hover:text-red-700 dark:hover:text-red-400"
                        >
                          {strings.common.delete}
                        </Button>
                      )}
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
          editingId ? strings.workers.editWorker : strings.workers.addWorker
        }
      >
        <div className="space-y-4">
          {isEditingLocked && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              ⚠️ This worker's status is currently &quot;
              {statusLabel[editingWorker!.status]}&quot; and cannot be changed
              manually. It will update automatically when the system cycle
              completes (e.g. when the truck returns).
            </div>
          )}

          <Input
            label={strings.workers.workerName}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label={strings.workers.position}
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            required
          />
          <Input
            label={strings.workers.startDate}
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
          {saveError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              ❌ {saveError}
            </div>
          )}
          {editingId && (
            <Input
              label="Reason for change *"
              value={form.reason ?? ""}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Why are you changing this worker's data?"
              required
            />
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {strings.workers.status}
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as Worker["status"],
                })
              }
              disabled={isEditingLocked}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {filteredStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
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

      {/* Delete confirmation with reason */}
      <Modal
        open={!!deleteId}
        onClose={() => {
          setDeleteId(null);
          setDeleteReason("");
        }}
        title={strings.workers.deleteWorker}
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {strings.workers.confirmDelete}
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Reason for deletion <span className="text-danger">*</span>
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              placeholder="Why is this worker being deleted?"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteId(null);
                setDeleteReason("");
              }}
            >
              {strings.common.cancel}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!deleteReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {strings.common.delete}
            </Button>
          </div>
        </div>
      </Modal>
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
