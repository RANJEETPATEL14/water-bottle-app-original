import { ArrowLeft, Minus, Plus, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useApp } from "../context";
import type { Dues, Shift } from "../types";
import { money } from "../store";

/* -------------------------------------------------------------------------- */
/*  Screen header (blue bar, back button, optional actions)                   */
/* -------------------------------------------------------------------------- */

export function ScreenHeader({
  title,
  onBack,
  right,
  subtitle,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  subtitle?: string;
}) {
  const { back } = useApp();
  return (
    <header className="bg-sky-500 text-white px-4 pt-4 pb-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack ?? back}
          className="w-10 h-10 rounded-full border border-white/70 flex items-center justify-center shrink-0 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{title}</h1>
          {subtitle && <p className="text-xs text-white/80 truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Search bar                                                                */
/* -------------------------------------------------------------------------- */

export function SearchBar({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm">
      <Search size={18} className="text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-sky-400"
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Floating action button                                                    */
/* -------------------------------------------------------------------------- */

export function Fab({ onClick, label = "Add" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-sky-500 text-white shadow-lg flex items-center justify-center hover:bg-sky-600 active:scale-95 transition-all"
      style={{ marginLeft: "0px" }}
    >
      <Plus size={28} />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dues grid — the Balance Jar / Past Due / Current Due / Total Due row      */
/* -------------------------------------------------------------------------- */

export function DuesRow({ dues, variant = "customer" }: { dues: Dues; variant?: "customer" | "group" }) {
  const cells =
    variant === "group"
      ? [
          { label: "Balance Jar", value: String(dues.balanceJar), color: "text-sky-500" },
          { label: "Past Due", value: dues.pastDue.toFixed(1), color: "text-red-500" },
          { label: "Current Due", value: dues.currentDue.toFixed(1), color: "text-red-500" },
          { label: "Advance", value: dues.advance.toFixed(1), color: "text-emerald-500" },
        ]
      : [
          { label: "Balance Jar", value: String(dues.balanceJar), color: "text-sky-500" },
          { label: "Past Due", value: money(dues.pastDue), color: "text-slate-800" },
          { label: "Current Due", value: money(dues.currentDue), color: "text-slate-800" },
          { label: "Total Due", value: money(dues.totalDue), color: "text-red-500" },
        ];
  return (
    <div className="grid grid-cols-4 divide-x divide-slate-100 pt-2">
      {cells.map((c) => (
        <div key={c.label} className="text-center px-1">
          <div className={`font-bold text-sm ${c.color}`}>{c.value}</div>
          <div className="text-[0.65rem] text-slate-400 leading-tight mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Segmented pill toggle                                                     */
/* -------------------------------------------------------------------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            value === o.value
              ? "bg-sky-500 text-white border-sky-500"
              : "bg-white text-sky-500 border-sky-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const SHIFT_OPTIONS: { value: Shift; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

/* -------------------------------------------------------------------------- */
/*  Stepper (− value +) used on delivery counters                            */
/* -------------------------------------------------------------------------- */

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const btn =
    "w-9 h-9 rounded-md text-white flex items-center justify-center active:scale-95 disabled:opacity-40 disabled:active:scale-100";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${btn} bg-sky-500`}
      >
        <Minus size={16} />
      </button>
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) =>
          onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || 0)))
        }
        className="w-14 h-9 text-center font-bold border border-slate-200 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-50"
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`${btn} bg-sky-500`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Labelled text field                                                       */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-sky-600 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full border-0 border-b-2 border-slate-200 pb-2 text-base text-slate-800 outline-none focus:border-sky-500 bg-transparent";

/* -------------------------------------------------------------------------- */
/*  Empty state with the "delivery guy" vibe of the reference app             */
/* -------------------------------------------------------------------------- */

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-sky-50 flex items-center justify-center mb-4 text-5xl">
        📦
      </div>
      <p className="text-slate-400 text-sm max-w-[220px]">{message}</p>
    </div>
  );
}

/** Circle avatar placeholder used across customer lists. */
export function Avatar({ size = 48 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-sky-500 flex items-center justify-center text-white shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
      </svg>
    </div>
  );
}
