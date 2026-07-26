import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, HandCoins } from "lucide-react";
import { useApp } from "../context";
import { getCustomerInvoice, getInvoiceRef } from "../store";
import type { Frequency } from "../types";
import { ScreenHeader, SearchBar, Segmented, Avatar, EmptyState } from "./ui";

type Filter = "all" | Frequency;

export function InvoicesScreen() {
  const { customers, deliveries, payments, products, navigate, showToast } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const monthStart = new Date(ym.year, ym.month, 1);
  const monthEnd = new Date(ym.year, ym.month + 1, 0);
  const rangeLabel = `${String(monthStart.getDate()).padStart(2, "0")} - ${monthEnd.getDate()} ${monthStart.toLocaleDateString("en-US", { month: "long" })} ,${ym.year}`;

  function stepMonth(delta: number) {
    setYm((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((c) => (filter === "all" ? true : c.frequency === filter))
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        c,
        invoice: getCustomerInvoice(c, deliveries, payments, products, ym.year, ym.month, getInvoiceRef(customers, c.id)),
      }))
      .filter((x) => x.invoice.subTotal > 0 || x.invoice.amountToPay > 0);
  }, [customers, deliveries, payments, products, query, filter, ym]);

  return (
    <div className="pb-24">
      <ScreenHeader title="Invoices" />
      <div className="p-4 space-y-3">
        <SearchBar value={query} onChange={setQuery} />
        <Segmented
          options={[
            { value: "all", label: "All" },
            { value: "daily", label: "Daily" },
            { value: "monthly", label: "Monthly" },
            { value: "weekly", label: "Weekly" },
          ]}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
        />

        <div className="flex items-center justify-between">
          <button onClick={() => stepMonth(-1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-700">{rangeLabel}</span>
          <button onClick={() => stepMonth(1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronRight size={16} />
          </button>
        </div>

        {list.length === 0 ? (
          <EmptyState message="No invoices for this month yet." />
        ) : (
          list.map(({ c, invoice }) => (
            <button
              key={c.id}
              onClick={() => navigate({ name: "invoiceDetail", customerId: c.id, year: ym.year, month: ym.month })}
              className="w-full text-left bg-white rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <Avatar />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 leading-tight">{c.name}</h3>
                  <p className="text-xs text-slate-400">{c.phone}</p>
                  <p className="text-xs text-slate-400">Invoice Ref: {invoice.ref}</p>
                </div>
                <HandCoins size={20} className="text-sky-500" />
              </div>
              <div className="grid grid-cols-2 border-t border-slate-100 mt-3 pt-2 text-center">
                <div>
                  <div className="text-[0.65rem] text-slate-400">Invoice Amount:</div>
                  <div className="font-bold text-sky-500">₹{invoice.subTotal.toFixed(2)}/-</div>
                </div>
                <div>
                  <div className="text-[0.65rem] text-slate-400">Payable Amount:</div>
                  <div className="font-bold text-red-500">₹{invoice.amountToPay.toFixed(2)}/-</div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-slate-200 p-3 flex gap-3 z-30">
        <button
          onClick={() => showToast("Select an invoice to share it", "success")}
          className="flex-1 py-3 rounded-xl border border-sky-500 text-sky-500 font-medium"
        >
          Share Invoice
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 py-3 rounded-xl bg-sky-500 text-white font-medium"
        >
          Print Invoices
        </button>
      </div>
    </div>
  );
}
