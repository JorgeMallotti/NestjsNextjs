"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const params = useParams();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

    // Simulate authentication
    await new Promise((r) => setTimeout(r, 1000));

    // Mock: always fail for now (backend not implemented)
    setError(strings.login.invalidCredentials);
    setLoading(false);
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
          <h1 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {strings.login.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {strings.login.welcomeBack}
          </p>
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
      </div>
    </motion.div>
  );
}
