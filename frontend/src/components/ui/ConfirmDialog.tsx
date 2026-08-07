"use client";

import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </h2>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              {message}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button variant={variant} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
