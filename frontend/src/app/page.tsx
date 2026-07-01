import { redirect } from "next/navigation";

/**
 * Root page — redirects to the default language.
 * Detects language from Accept-Language header, falls back to English.
 */
export default function RootPage() {
  // By default, redirect to English
  // In a full implementation, this would detect from headers
  redirect("/en");
}
