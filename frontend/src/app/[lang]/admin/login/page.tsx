"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { loginAdmin, saveUser } from "@/lib/api/auth";
import { getDemoAccounts, demoLogin } from "@/lib/api/demo";

export default function AdminLoginPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);

  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    getDemoAccounts()
      .then((accounts) => {
        const admin = accounts.find((a) => a.role === "admin");
        if (admin) setAdminId(admin.id);
      })
      .catch(() => {});
  }, []);

  const validate = (): boolean => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setError("");

    if (!email.trim()) {
      setEmailError(strings.common.required);
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Invalid email format");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError(strings.common.required);
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      const result = await loginAdmin(email, password);
      saveUser(result.user);
      router.push(`/${lang}/admin/dashboard`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : strings.admin.invalidCredentials,
      );
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!adminId) return;
    setDemoLoading(true);
    try {
      const result = await demoLogin(adminId);
      saveUser(result.user);
      router.push(`/${lang}/admin/dashboard`);
    } catch {
      setDemoLoading(false);
    }
  };

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-muted px-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              CT
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {strings.home.title}
            </span>
          </Link>

          {/* Admin badge */}
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            Admin Panel
          </div>

          <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {strings.admin.loginTitle}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {strings.admin.welcomeBack}
          </p>
        </div>

        {/* 1-click demo login */}
        {adminId && (
          <div className="mb-6">
            <Button
              onClick={handleDemoLogin}
              loading={demoLoading}
              className="w-full"
              size="lg"
            >
              🚀 {strings.demo.adminLogin} (1-click)
            </Button>
            <div className="mt-2 text-center text-xs text-zinc-400">
              admin@comptechpro.com
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
          <span className="text-xs text-zinc-400">
            {strings.demo.orStandardLogin}
          </span>
          <div className="flex-1 border-t border-zinc-200 dark:border-zinc-700" />
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          {error && (
            <motion.div
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
            >
              {error}
            </motion.div>
          )}

          <Input
            label={strings.admin.emailLabel}
            type="email"
            placeholder="admin@comptechpro.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            required
            autoComplete="email"
          />

          <Input
            label={strings.admin.passwordLabel}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            required
            autoComplete="current-password"
          />

          <Button type="submit" loading={loading} className="w-full">
            {strings.admin.submitButton}
          </Button>
        </form>

        {/* Back to home */}
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href={`/${lang}`}
            className="font-medium text-primary hover:text-primary-dark dark:text-primary-light"
          >
            {strings.common.back} {strings.nav.home}
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
