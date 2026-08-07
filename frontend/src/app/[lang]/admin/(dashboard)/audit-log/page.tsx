"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getAuditLogs } from "@/lib/api/client";
import type { AuditLogEntry } from "@/types";

const actionColorMap: Record<
  string,
  "green" | "blue" | "purple" | "amber" | "red" | "gray"
> = {
  create: "green",
  update: "blue",
  delete: "red",
  soft_delete: "amber",
  restore: "green",
  confirm: "blue",
  ship: "purple",
  deliver: "green",
  cancel: "red",
};

const entityLabels: Record<string, string> = {
  worker: "Worker",
  truck: "Truck",
  client: "Client",
  order: "Order",
  product: "Product",
  claim: "Claim",
};

export default function AuditLogPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAuditLogs({
      page,
      limit: 30,
      entityType: entityFilter || undefined,
      action: actionFilter || undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setLogs(res.data);
          setTotalPages(res.meta.totalPages);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, entityFilter, actionFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Audit Log
        </h1>
        <div className="flex flex-wrap gap-2">
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">All entities</option>
            <option value="worker">Worker</option>
            <option value="truck">Truck</option>
            <option value="client">Client</option>
            <option value="order">Order</option>
            <option value="product">Product</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">All actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="soft_delete">Soft Delete</option>
            <option value="restore">Restore</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-zinc-500 dark:text-zinc-400">
            No audit entries found.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge color={actionColorMap[log.action] ?? "gray"}>
                    {log.action}
                  </Badge>
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {entityLabels[log.entityType] ?? log.entityType}
                  </span>
                  <span className="font-mono text-xs text-zinc-400">
                    #{log.entityId.slice(0, 8)}
                  </span>
                </div>
                <span className="text-xs text-zinc-400">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  By: <strong>{log.performedBy.name}</strong>
                </span>
                {log.reason && (
                  <span>
                    Reason: <em>{log.reason}</em>
                  </span>
                )}
              </div>

              {/* Diff preview for updates */}
              {(log.oldValues || log.newValues) && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-primary hover:text-primary-dark">
                    View changes
                  </summary>
                  <div className="mt-2 grid grid-cols-2 gap-4 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-900">
                    {log.oldValues && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-red-600">
                          Before
                        </p>
                        <pre className="whitespace-pre-wrap break-all text-xs text-zinc-600 dark:text-zinc-400">
                          {JSON.stringify(JSON.parse(log.oldValues), null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.newValues && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-green-600">
                          After
                        </p>
                        <pre className="whitespace-pre-wrap break-all text-xs text-zinc-600 dark:text-zinc-400">
                          {JSON.stringify(JSON.parse(log.newValues), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-zinc-600"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs disabled:opacity-40 dark:border-zinc-600"
          >
            Next
          </button>
        </div>
      )}
    </motion.div>
  );
}
