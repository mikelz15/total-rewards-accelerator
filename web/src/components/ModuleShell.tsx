import { ReactNode } from "react";

export function ModuleShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-12 max-w-2xl">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="text-base text-teal-800">{eyebrow}</p>
        </div>
        <p className="mt-5 text-lg leading-relaxed text-slate-600">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_rgba(15,23,42,0.05)] ${className}`}>
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const tones = {
    default: "text-slate-900",
    good: "text-teal-700",
    warn: "text-amber-600",
    bad: "text-rose-600",
  };
  return (
    <div className="rounded-2xl bg-white px-5 py-4">
      <div className={`text-3xl font-semibold tabular-nums tracking-tight ${tones[tone]}`}>{value}</div>
      <div className="mt-2 text-base text-slate-600">{label}</div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-teal-700 text-white hover:bg-teal-800",
    ghost: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
