import en from "./en";
import es from "./es";
import pt from "./pt";
import type { Strings } from "./en";

/**
 * Relaxed type that allows any string value while keeping the shape.
 */
type DeepStringify<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: DeepStringify<T[K]> }
    : T;

const stringMap: Record<string, DeepStringify<Strings>> = {
  en,
  es,
  pt,
};

/**
 * Get the strings object for the given language code.
 * Falls back to English if the language is not found.
 */
export function getStrings(lang: string): Strings {
  return (stringMap[lang] ?? en) as Strings;
}

export type { Strings };
