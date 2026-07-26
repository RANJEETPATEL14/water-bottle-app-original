import { useState } from "react";
import { FileText, TrendingUp, TrendingDown, Boxes, Users as UsersIcon } from "lucide-react";
import { useApp } from "../context";
import { getCustomerDues, getTotalDue, getTotalBottlesOut, money } from "../store";
import { ScreenHeader, EmptyState } from "./ui";

/* ----------------------------- Invoices ---------------------------------- */

export function InvoicesScreen() {
  const { customers, deliveries, returns, payments, showToast } = useApp();
  const withDues = customers
    .map((c) => ({ c, dues: getCustomerDues(c, deliveries, returns, payments) }))
    .filter((x) => x.dues.totalDue > 0)
    .sort((a, b) => b.dues.totalDue - a.dues.totalDue);

  return (
    <div className="pb-8">
      <ScreenHeader title="Invoices" />
      <div className="p-4 space-y-3">
        {withDues.length === 0 ? (
          <EmptyState message="No outstanding invoices. Everyone is settled up!" />
        ) : (
          withDues.map(({ c, dues }) => (
            <button
              key={c.id}
              onClick={() => showToast(`Invoice for ${c.name}: ${money(dues.totalDue)} due`, "success")}
              className="w-full text-left bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
            >
              <FileText size={22} className="text-sky-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{c.name}</h3>
                <p className="text-xs text-slate-400">{c.phone}</p>
              </div>
              <span className="font-bold text-red-500">{money(dues.totalDue)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Reports ---------------------------------- */

export function ReportsScreen() {
  const { customers, deliveries, returns, payments, expenses } = useApp();
  const totalDue = getTotalDue(customers, deliveries, returns, payments);
  const collected = payments.reduce((s, p) => s + p.amount, 0);
  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const jarsOut = getTotalBottlesOut(deliveries, returns);

  const cards = [
    { icon: UsersIcon, label: "Customers", value: String(customers.length), color: "text-sky-500" },
    { icon: Boxes, label: "Jars Out", value: String(jarsOut), color: "text-amber-500" },
    { icon: TrendingUp, label: "Collected", value: money(collected), color: "text-emerald-500" },
    { icon: TrendingDown, label: "Expenses", value: money(spent), color: "text-red-500" },
  ];

  return (
    <div className="pb-8">
      <ScreenHeader title="Reports" />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm">
                <Icon size={24} className={c.color} />
                <div className={`text-xl font-bold mt-2 ${c.color}`}>{c.value}</div>
                <div className="text-xs text-slate-400">{c.label}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <Row label="Total Outstanding Due" value={money(totalDue)} strong />
          <Row label="Total Payments Collected" value={money(collected)} />
          <Row label="Total Expenses" value={money(spent)} />
          <Row label="Net (Collected − Expenses)" value={money(collected - spent)} strong />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm ${strong ? "font-bold text-slate-800" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

/* ------------------------------ Messages --------------------------------- */

export function MessagesScreen() {
  const tabs = ["Subscriptions", "Customize Message", "Settings", "Used Messages"];
  const [tab, setTab] = useState(0);
  return (
    <div>
      <header className="bg-sky-500 text-white">
        <ScreenHeaderInline title="Message Subscriptions" />
        <div className="flex overflow-x-auto">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 min-w-fit px-3 pb-2 text-xs whitespace-nowrap border-b-2 ${
                tab === i ? "border-white" : "border-transparent text-white/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>
      <EmptyState message="No message subscriptions yet. Add one to notify customers automatically." />
    </div>
  );
}

/* ------------------------- Generic placeholder --------------------------- */

const LABELS: Record<string, { title: string; body: string }> = {
  offline: { title: "Offline Mode", body: "Your data is already stored on this device and works without internet. It syncs to the cloud automatically when you're back online." },
  employees: { title: "Employees", body: "Manage delivery staff and their assigned routes. Coming soon." },
  event: { title: "Events", body: "Schedule agency events and reminders. Coming soon." },
  membership: { title: "Membership", body: "Manage subscription plans for your customers. Coming soon." },
  leaves: { title: "Leaves", body: "Track staff leaves and holidays. Coming soon." },
  support: { title: "Support", body: "Need help? Reach us any time — we're here to support your business." },
  website: { title: "Website", body: "Your customer-facing website settings will appear here. Coming soon." },
};

export function SimpleScreen({ screenKey }: { screenKey: string }) {
  const info = LABELS[screenKey] ?? { title: "Coming Soon", body: "This section is under construction." };
  return (
    <div>
      <ScreenHeader title={info.title} />
      <div className="p-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full bg-sky-50 flex items-center justify-center mx-auto mb-4 text-4xl">
            💧
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">{info.body}</p>
        </div>
      </div>
    </div>
  );
}

// Inline header variant for Messages (no separate back-button bar duplication)
function ScreenHeaderInline({ title }: { title: string }) {
  const { back } = useApp();
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      <button onClick={back} className="w-9 h-9 rounded-full border border-white/70 flex items-center justify-center">
        ‹
      </button>
      <h1 className="text-lg font-bold">{title}</h1>
    </div>
  );
}
