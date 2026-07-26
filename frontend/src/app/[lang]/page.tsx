"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getStrings } from "@/strings";
import Button from "@/components/ui/Button";
import { getDemoAccounts, demoLogin } from "@/lib/api/demo";
import { saveUser } from "@/lib/api/auth";

interface DemoAccount {
  id: string;
  email: string;
  name: string;
  role: "admin" | "client";
  companyName: string | null;
  label: string;
}

export default function HomePage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params.lang as string) ?? "en";
  const strings = getStrings(lang);

  const [accounts, setAccounts] = useState<DemoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);

  useEffect(() => {
    getDemoAccounts()
      .then(setAccounts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDemoLogin = async (account: DemoAccount) => {
    setLoggingIn(account.id);
    try {
      const result = await demoLogin(account.id);
      saveUser(result.user);
      if (account.role === "admin") {
        router.push(`/${lang}/admin/dashboard`);
      } else {
        router.push(`/${lang}/client/dashboard`);
      }
    } catch {
      setLoggingIn(null);
    }
  };

  const adminAccount = accounts.find((a) => a.role === "admin");
  const clientAccounts = accounts.filter((a) => a.role === "client");

  return (
    <motion.div
      className="flex min-h-screen flex-col"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Navbar */}
      <header className="border-b border-zinc-200 dark:border-zinc-700">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              CT
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {strings.home.title}
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href={`/${lang}/register`}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {strings.nav.register}
            </Link>
            <Link
              href={`/${lang}/login`}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {strings.nav.login}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex items-center justify-center px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {strings.home.title}
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {strings.home.subtitle}
          </motion.p>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-500 dark:text-zinc-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {strings.home.heroDescription}
          </motion.p>
        </div>
      </section>

      {/* Demo Section */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-16 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary dark:bg-primary/20">
              🚀 {strings.demo.title}
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {strings.demo.description}
            </h2>
          </motion.div>

          {loading ? (
            <div className="text-center text-sm text-zinc-500">
              {strings.demo.loading}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Admin Card */}
              {adminAccount && (
                <motion.div
                  className="group cursor-pointer rounded-xl border-2 border-purple-200 bg-white p-6 shadow-sm transition-all hover:border-purple-400 hover:shadow-md dark:border-purple-800 dark:bg-zinc-800 dark:hover:border-purple-600"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => handleDemoLogin(adminAccount)}
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-xl dark:bg-purple-900/40">
                    🔐
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {strings.demo.adminLogin}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {strings.demo.adminDesc}
                  </p>
                  <div className="mt-4">
                    <Button
                      loading={loggingIn === adminAccount.id}
                      className="w-full"
                    >
                      {strings.demo.adminLogin}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Client Card */}
              <motion.div
                className="rounded-xl border-2 border-blue-200 bg-white p-6 shadow-sm dark:border-blue-800 dark:bg-zinc-800"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-xl dark:bg-blue-900/40">
                  🏢
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {strings.demo.clientLogin}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {strings.demo.clientDesc}
                </p>
                <div className="mt-4 space-y-2">
                  {clientAccounts.map((client, idx) => (
                    <button
                      key={client.id}
                      onClick={() => handleDemoLogin(client)}
                      disabled={loggingIn !== null}
                      className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                    >
                      <div className="flex items-center justify-between">
                        <span>{client.companyName ?? client.name}</span>
                        <span className="text-xs text-zinc-400">
                          {loggingIn === client.id ? "..." : "→"}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-400">
                        {client.email}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          <motion.div
            className="mt-8 text-center text-sm text-zinc-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href={`/${lang}/login`}
              className="font-medium text-primary hover:text-primary-dark dark:text-primary-light"
            >
              {strings.demo.orStandardLogin}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        &copy; {new Date().getFullYear()} {strings.home.title}. All rights
        reserved.
      </footer>
    </motion.div>
  );
}
