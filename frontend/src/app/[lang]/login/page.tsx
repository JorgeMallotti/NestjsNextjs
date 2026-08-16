"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BackToLanding from "@/components/features/BackToLanding";
import { login, saveUser } from "@/lib/api/auth";
import { getDemoAccounts, demoLogin } from "@/lib/api/demo";

interface DemoAccount {
  id: string;
  email: string;
  name: string;
  role: "admin" | "client";
  companyName: string | null;
  label: string;
}

export default function LoginPage() {
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

  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [demoLoading, setDemoLoading] = useState(true);
  const [demoLoggingIn, setDemoLoggingIn] = useState<string | null>(null);

  useEffect(() => {
    getDemoAccounts()
      .then((accounts) =>
        setDemoAccounts(accounts.filter((a) => a.role === "client")),
      )
      .catch(() => {})
      .finally(() => setDemoLoading(false));
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
      const result = await login(email, password);
      saveUser(result.user);
      router.push(`/${lang}/client/dashboard`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : strings.login.invalidCredentials,
      );
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: DemoAccount) => {
    setDemoLoggingIn(account.id);
    try {
      const result = await demoLogin(account.id);
      saveUser(result.user);
      router.push(`/${lang}/client/dashboard`);
    } catch {
      setDemoLoggingIn(null);
    }
  };

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-muted px-4 py-12"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="w-full max-w-lg">
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
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {strings.login.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {strings.login.welcomeBack}
          </p>
        </div>

        {/* Demo companies — 1-click login */}
        {!demoLoading && demoAccounts.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                🚀 {strings.demo.selectClient}
              </div>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {strings.demo.selectClientDesc}
              </p>
            </div>
            <div className="grid gap-3">
              {demoAccounts.map((client, idx) => (
                <motion.button
                  key={client.id}
                  onClick={() => handleDemoLogin(client)}
                  disabled={demoLoggingIn !== null}
                  className="group w-full rounded-xl border-2 border-zinc-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-600"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {client.companyName ?? client.name}
                      </div>
                      <div className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {client.email}
                      </div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-hover:translate-x-0.5 dark:bg-blue-900/30 dark:text-blue-400">
                      {demoLoggingIn === client.id ? (
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400">
                    <span>👤 {client.name}</span>
                    <span>📍 {(client as any).location ?? ""}</span>
                  </div>
                </motion.button>
              ))}
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
            label={strings.login.emailLabel}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            required
            autoComplete="email"
          />

          <Input
            label={strings.login.passwordLabel}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between text-sm">
            <Link
              href="#"
              className="text-primary hover:text-primary-dark dark:text-primary-light"
            >
              {strings.login.forgotPassword}
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            {strings.login.submitButton}
          </Button>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {strings.login.noAccount}{" "}
            <Link
              href={`/${lang}/register`}
              className="font-medium text-primary hover:text-primary-dark dark:text-primary-light"
            >
              {strings.login.signUp}
            </Link>
          </p>
        </form>

        {/* Back to landing + go home — back to the role-selection landing page */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <BackToLanding strings={strings} />
          <Link
            href={`/${lang}`}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
              />
            </svg>
            {strings.common.goHome}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
