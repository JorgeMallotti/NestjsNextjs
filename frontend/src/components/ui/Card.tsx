import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export default function Card({
  hover = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 ${
        hover
          ? "transition-shadow hover:shadow-md dark:hover:border-zinc-600"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
