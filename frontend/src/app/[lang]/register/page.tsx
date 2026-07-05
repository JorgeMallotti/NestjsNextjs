"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { register as registerApi } from "@/lib/api/auth";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);

  const [form, setForm] = useState({
    name: "",
    email: "",
    companyName: "",
    location: "",
    idNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    setError("");

    if (!form.name.trim()) newErrors.name = strings.common.required;
    if (!form.email.trim()) newErrors.email = strings.common.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email format";
    if (!form.companyName.trim())
      newErrors.companyName = strings.common.required;
    if (!form.location.trim()) newErrors.location = strings.common.required;
    if (!form.idNumber.trim()) newErrors.idNumber = strings.common.required;
    if (!form.password.trim()) newErrors.password = strings.common.required;
    else if (form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (!form.confirmPassword.trim())
      newErrors.confirmPassword = strings.common.required;
    else if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = strings.register.passwordMismatch;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      await registerApi({
        name: form.name,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        location: form.location,
        idNumber: form.idNumber,
      });

      setSuccess(true);
      setLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${lang}/login`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.common.error);
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (success) {
    return (
      <motion.div
        className="flex min-h-screen items-center justify-center bg-muted px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {strings.register.successMessage}
          </h2>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-muted px-4 py-12"
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
            {strings.register.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {strings.register.subtitle}
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
            label={strings.register.nameLabel}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={errors.name}
            required
          />
          <Input
            label={strings.register.emailLabel}
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            error={errors.email}
            required
            autoComplete="email"
          />
          <Input
            label={strings.register.companyName}
            value={form.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
            error={errors.companyName}
            required
          />
          <Input
            label={strings.register.location}
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            error={errors.location}
            required
          />
          <Input
            label={strings.register.idNumber}
            value={form.idNumber}
            onChange={(e) => updateField("idNumber", e.target.value)}
            error={errors.idNumber}
            required
          />
          <Input
            label={strings.register.passwordLabel}
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            error={errors.password}
            required
            autoComplete="new-password"
          />
          <Input
            label={strings.register.confirmPasswordLabel}
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />

          <Button type="submit" loading={loading} className="w-full">
            {strings.register.submitButton}
          </Button>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {strings.register.alreadyHaveAccount}{" "}
            <Link
              href={`/${lang}/login`}
              className="font-medium text-primary hover:text-primary-dark dark:text-primary-light"
            >
              {strings.register.signIn}
            </Link>
          </p>
        </form>
      </div>
    </motion.div>
  );
}
