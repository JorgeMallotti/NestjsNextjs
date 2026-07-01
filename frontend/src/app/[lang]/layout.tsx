import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getStrings } from "@/strings";

interface LangLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: LangLayoutProps): Promise<Metadata> {
  const { lang } = await params;
  const strings = getStrings(lang);

  return {
    title: `${strings.home.title} — ${strings.home.subtitle}`,
    description: strings.home.heroDescription,
  };
}

export default async function LangLayout({
  children,
  params,
}: LangLayoutProps) {
  const { lang } = await params;

  return (
    <>
      <div lang={lang}>{children}</div>
    </>
  );
}
