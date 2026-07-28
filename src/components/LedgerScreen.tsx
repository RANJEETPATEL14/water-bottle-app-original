import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { useApp } from "../context";
import { findUser, getDeliveriesByUser, getPaymentsByUser, money } from "../store";
import type { Delivery } from "../types";
import { ScreenHeader, EmptyState } from "./ui";
import { CustomerPicker } from "./CustomerPicker";

interface LedgerRow {
  key: string;
  label: string;
  items: number;
  debit: number;
  credit: number;
  balance: number;
}

function jarsOf(d: Delivery): number {
  if (d.items && d.items.length) return d.items.reduce((s, i) => s + Number(i.delivered || 0), 0);
  return Number(d.bottles) || 0;
}
function chargeOf(d: Delivery): number {
  return Number(d.amount || Number(d.bottles) * Number(d.price));
}

export function LedgerScreen({ customerId }: { customerId?: string }) {
  const { customers, deliveries, payments, agency, showToast } = useApp();
  const [selectedId, setSelectedId] = useState<string | undefined>(customerId);
  const [picker, setPicker] = useState(false);

  const customer = selectedId ? findUser(customers, selectedId) : undefined;

  const rows = useMemo<LedgerRow[]>(() => {
    if (!customer) return [];
    const dels = getDeliveriesByUser(deliveries, customer.id);
    const pays = getPaymentsByUser(payments, customer.id);

    // Aggregate deliveries (debit) and payments (credit) per calendar month.
    const map = new Map<string, { year: number; month: number; items: number; debit: number; credit: number }>();
    const bucket = (year: number, month: number) => {
      const k = `${year}-${month}`;
      if (!map.has(k)) map.set(k, { year, month, items: 0, debit: 0, credit: 0 });
      return map.get(k)!;
    };
    for (const d of dels) {
      const dt = new Date(d.date);
      const b = bucket(dt.getFullYear(), dt.getMonth());
      b.items += jarsOf(d);
      b.debit += chargeOf(d);
    }
    for (const p of pays) {
      const dt = new Date(p.date);
      bucket(dt.getFullYear(), dt.getMonth()).credit += Number(p.amount || 0);
    }

    // Oldest → newest so the running balance accumulates correctly.
    const sorted = [...map.values()].sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month,
    );
    let running = 0;
    const out: LedgerRow[] = sorted.map((r) => {
      running += r.debit - r.credit;
      const lastDay = new Date(r.year, r.month + 1, 0);
      const label = `${lastDay.getDate()}, ${lastDay.toLocaleDateString("en-US", { month: "short" })} ${r.year}`;
      return { key: `${r.year}-${r.month}`, label, items: r.items, debit: r.debit, credit: r.credit, balance: running };
    });
    // Newest first for display.
    return out.reverse();
  }, [customer, deliveries, payments]);

  const totalInvoice = rows.reduce((s, r) => s + r.debit, 0);
  const totalPaid = rows.reduce((s, r) => s + r.credit, 0);
  const totalDue = totalInvoice - totalPaid;

  function exportPdf() {
    if (!customer) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(agency.name, 14, 18);
    doc.setFontSize(11);
    doc.text("Ledger View", 14, 26);
    doc.text(`Customer: ${customer.name}`, 14, 34);
    doc.text(`Mobile: ${customer.phone}`, 14, 40);

    doc.text(`Total Invoice Amount (A): ${totalInvoice.toFixed(1)}`, 14, 50);
    doc.text(`Total Paid Amount (B): ${totalPaid.toFixed(1)}`, 14, 56);
    doc.text(`Total Due Amount (A - B): ${totalDue.toFixed(1)}`, 14, 62);

    let y = 74;
    doc.text("Date", 14, y);
    doc.text("Items", 70, y);
    doc.text("Debit", 100, y);
    doc.text("Credit", 135, y);
    doc.text("Balance", 170, y);
    y += 3;
    doc.line(14, y, 196, y);
    y += 7;
    rows.forEach((r) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(r.label, 14, y);
      doc.text(String(r.items), 70, y);
      doc.text(r.debit.toFixed(1), 100, y);
      doc.text(r.credit > 0 ? r.credit.toFixed(1) : "-", 135, y);
      doc.text(r.balance.toFixed(1), 170, y);
      y += 7;
    });

    doc.save(`${customer.name}-Ledger.pdf`);
    showToast("PDF downloaded", "success");
  }

  return (
    <div className="pb-8">
      <ScreenHeader
        title="Ledger View"
        right={
          customer ? (
            <button onClick={exportPdf} className="p-2 flex items-center gap-1 text-white">
              <FileDown size={20} />
              <span className="text-xs font-semibold">PDF</span>
            </button>
          ) : undefined
        }
      />

      <div className="p-4 space-y-4">
        <button onClick={() => setPicker(true)} className="w-full text-left bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-sky-500 font-medium">Customer Name *</p>
          <h3 className="font-semibold text-slate-800">{customer ? customer.name : "Select customer"}</h3>
        </button>

        {!customer ? (
          <EmptyState message="Select a customer to view their ledger." />
        ) : (
          <>
            {/* Summary cards */}
            <div className="rounded-xl bg-slate-100 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Total Invoice Amount (A)</p>
                <p className="text-xs text-slate-500">Includes discount and extra charges</p>
              </div>
              <span className="font-bold text-red-500">{totalInvoice.toFixed(1)}</span>
            </div>
            <div className="rounded-xl bg-emerald-100 px-4 py-3 flex items-center justify-between">
              <p className="font-semibold text-slate-800">Total Paid Amount (B)</p>
              <span className="font-bold text-emerald-600">{totalPaid.toFixed(1)}</span>
            </div>
            <div className="rounded-xl bg-red-100 px-4 py-3 flex items-center justify-between">
              <p className="font-semibold text-slate-800">Total Due Amount (A - B)</p>
              <span className="font-bold text-red-500">{totalDue.toFixed(1)}</span>
            </div>

            {/* Table header */}
            <div className="bg-sky-500 text-white grid grid-cols-[1.3fr_0.7fr_1fr_1fr_1fr] text-xs font-medium rounded-xl overflow-hidden">
              <span className="px-3 py-3">Date</span>
              <span className="px-1 py-3 text-center">No. of item</span>
              <span className="px-1 py-3 text-center">Debit (Invoice)</span>
              <span className="px-1 py-3 text-center">Credit (Payment)</span>
              <span className="px-1 py-3 text-center">Balance</span>
            </div>

            {rows.length === 0 ? (
              <EmptyState message="No transactions for this customer yet." />
            ) : (
              <div className="space-y-3">
                {rows.map((r) => (
                  <div
                    key={r.key}
                    className="bg-white rounded-xl shadow-sm grid grid-cols-[1.3fr_0.7fr_1fr_1fr_1fr] items-center text-sm"
                  >
                    <span className="px-3 py-4 text-slate-800">{r.label}</span>
                    <span className="px-1 py-4 text-center text-slate-700">{r.items}</span>
                    <span className="px-1 py-4 text-center text-red-500">{money(r.debit)}</span>
                    <span className="px-1 py-4 text-center text-emerald-600">
                      {r.credit > 0 ? money(r.credit) : "-"}
                    </span>
                    <span className="px-1 py-4 text-center text-red-500 font-medium">{money(r.balance)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <CustomerPicker open={picker} onClose={() => setPicker(false)} onPick={setSelectedId} />
    </div>
  );
}
