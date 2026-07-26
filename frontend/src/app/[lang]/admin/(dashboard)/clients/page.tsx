"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  approveClient,
  restoreClient,
  permanentDeleteClient,
} from "@/lib/api/client";
import Badge from "@/components/ui/Badge";
import type { Client, ClientFormData } from "@/types";

const emptyForm: ClientFormData = {
  name: "",
  email: "",
  location: "",
  idNumber: "",
  password: "",
};

export default function ClientsPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);
  const currency = strings.common.currencySymbol;

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Permanent delete confirmation
  const [permDeleteId, setPermDeleteId] = useState<string | null>(null);

  // Approve
  const [approving, setApproving] = useState(false);

  const loadClients = () => {
    let cancelled = false;
    setLoading(true);
    getClients(showDeleted)
      .then((data) => {
        if (!cancelled) setClients(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    return loadClients();
  }, [showDeleted]);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingId(client.id);
    setForm({
      name: client.name,
      email: client.email,
      location: client.location,
      idNumber: client.idNumber,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateClient(editingId, form);
        setClients((prev) =>
          prev.map((c) => (c.id === editingId ? updated : c)),
        );
      } else {
        const created = await createClient(form);
        setClients((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApproving(true);
    const prev = clients;
    setClients((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, approvedAt: new Date().toISOString() } : c,
      ),
    );
    try {
      await approveClient(id);
    } catch {
      setClients(prev);
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const prev = clients;
    setDeleteId(null);
    try {
      await deleteClient(deleteId);
      loadClients(); // Refresh list
    } catch {
      setClients(prev);
    }
  };

  const handleRestore = async (id: string) => {
    const prev = clients;
    try {
      await restoreClient(id);
      loadClients(); // Refresh list
    } catch {
      setClients(prev);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permDeleteId) return;
    try {
      await permanentDeleteClient(permDeleteId);
      setPermDeleteId(null);
      loadClients(); // Refresh list
    } catch {
      // Error handled silently
    }
  };

  const formatCurrency = (v: number) =>
    `${currency} ${v.toLocaleString("en-US")}`;

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
          {strings.clients.title}
        </h1>
        <div className="flex items-center gap-3">
          <Input
            placeholder={`${strings.common.search}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600"
            />
            Show deleted
          </label>
          <Button onClick={openAdd}>{strings.clients.addClient}</Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-zinc-500 dark:text-zinc-400">
            {strings.clients.noClients}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <Th>{strings.clients.clientName}</Th>
                <Th className="hidden md:table-cell">
                  {strings.clients.email}
                </Th>
                <Th className="hidden lg:table-cell">
                  {strings.clients.location}
                </Th>
                <Th className="hidden lg:table-cell">
                  {strings.clients.lastMonthPurchases}
                </Th>
                <Th className="hidden xl:table-cell">
                  {strings.clients.last3MonthsPurchases}
                </Th>
                <Th className="hidden xl:table-cell">
                  {strings.clients.lastYearPurchases}
                </Th>
                <Th>{strings.clients.email}</Th>
                <Th className="hidden lg:table-cell">
                  {strings.clients.location}
                </Th>
                <Th className="hidden lg:table-cell">{strings.orders.title}</Th>
                <Th>{strings.common.status}</Th>
                <Th>{strings.common.actions}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {filtered.map((client) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/50"
                >
                  <Td>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {client.name}
                      </p>
                      <p className="text-xs text-zinc-400 md:hidden">
                        {client.email}
                      </p>
                    </div>
                  </Td>
                  <Td className="text-zinc-600 dark:text-zinc-400">
                    {client.email}
                  </Td>
                  <Td className="hidden lg:table-cell text-zinc-600 dark:text-zinc-400">
                    {client.location}
                  </Td>
                  <Td className="hidden lg:table-cell text-zinc-600 dark:text-zinc-400">
                    {client._count?.orders ?? 0}
                  </Td>
                  <Td>
                    {client.deletedAt ? (
                      <Badge color="gray">Deleted</Badge>
                    ) : client.approvedAt ? (
                      <Badge color="green">{strings.orders.confirmed}</Badge>
                    ) : (
                      <Badge color="amber">
                        {strings.orders.pendingApproval}
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      {client.deletedAt ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleRestore(client.id)}
                          >
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPermDeleteId(client.id)}
                            className="text-danger hover:text-red-700 dark:hover:text-red-400"
                          >
                            Delete permanently
                          </Button>
                        </>
                      ) : (
                        <>
                          {!client.approvedAt && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApprove(client.id)}
                              loading={approving}
                            >
                              {strings.common.confirm}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(client)}
                          >
                            {strings.common.edit}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(client.id)}
                            className="text-danger hover:text-red-700 dark:hover:text-red-400"
                          >
                            {strings.common.delete}
                          </Button>
                        </>
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
          editingId ? strings.clients.editClient : strings.clients.addClient
        }
      >
        <div className="space-y-4">
          <Input
            label={strings.clients.clientName}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label={strings.clients.email}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label={strings.clients.location}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          />
          <Input
            label={strings.clients.idNumber}
            value={form.idNumber}
            onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
            required
          />
          {!editingId && (
            <Input
              label={strings.login.passwordLabel}
              type="password"
              value={form.password ?? ""}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          )}
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

      {/* Soft Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title={strings.clients.deleteClient}
        message={
          "This will soft-delete the client (they will be deactivated). " +
          strings.clients.confirmDelete
        }
        confirmLabel={strings.common.delete}
        cancelLabel={strings.common.cancel}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Permanent Delete confirmation */}
      <ConfirmDialog
        open={!!permDeleteId}
        title="Permanently Delete Client"
        message="This action CANNOT be undone. The client and all associated data will be permanently removed from the database."
        confirmLabel="Delete Permanently"
        cancelLabel={strings.common.cancel}
        variant="danger"
        onConfirm={handlePermanentDelete}
        onCancel={() => setPermDeleteId(null)}
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
