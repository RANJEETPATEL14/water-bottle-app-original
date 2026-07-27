import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, FileDown, Plus, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import { useApp } from "../context";
import { findUser, findProduct, getDeliveriesByUser, formatDate, formatDisplayDate, money } from "../store";
import type { Customer, Delivery, DeliveryItem, Shift } from "../types";
import { ScreenHeader, Avatar, EmptyState, Stepper, SHIFT_OPTIONS } from "./ui";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { CustomerPicker } from "./CustomerPicker";

interface LineRow {
  id: string;
  shift: string;
  product: string;
  dlvd: number;
  rcvd: number;
  bal: number;
  time: string;
}

function toLineRows(dels: Delivery[], products: { id: string; name: string }[]): LineRow[] {
  const out: LineRow[] = [];
  for (const d of dels) {
    const time = new Date(d.createdAt || d.date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (d.items && d.items.length) {
      for (const it of d.items) {
        const p = products.find((x) => String(x.id) === String(it.productId));
        out.push({
          id: d.id,
          shift: d.shift,
          product: p?.name ?? "Product",
          dlvd: it.delivered,
          rcvd: it.received,
          bal: it.delivered - it.received,
          time,
        });
      }
    } else {
      out.push({ id: d.id, shift: d.shift, product: "Water Jar", dlvd: d.bottles, rcvd: 0, bal: d.bottles, time });
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*  Add-transaction modal — create a delivery for a specific day              */
/* -------------------------------------------------------------------------- */

function AddTransactionModal({
  open,
  onClose,
  customer,
  initialDate,
}: {
  open: boolean;
  onClose: () => void;
  customer: Customer;
  initialDate: string;
}) {
  const { products, addDelivery, showToast } = useApp();
  const [date, setDate] = useState(initialDate);
  const [shift, setShift] = useState<Shift>("morning");
  const [rows, setRows] = useState<Record<string, DeliveryItem>>({});
  const [showOthers, setShowOthers] = useState(false);

  // Reset the form whenever the modal is (re)opened for a new day.
  const [lastKey, setLastKey] = useState("");
  const key = `${open}-${initialDate}`;
  if (open && key !== lastKey) {
    setDate(initialDate);
    setShift("morning");
    setRows({});
    setShowOthers(false);
    setLastKey(key);
  }

  if (!open) return null;

  const primary = products[0];
  const others = products.slice(1);

  function getRow(productId: string): DeliveryItem {
    return rows[productId] ?? { productId, delivered: 0, received: 0 };
  }
  function setRow(productId: string, patch: Partial<DeliveryItem>) {
    setRows((prev) => ({ ...prev, [productId]: { ...getRow(productId), ...patch } }));
  }
  function rate(productId: string): number {
    const p = products.find((x) => x.id === productId);
    return p?.rate ?? customer.price ?? 20;
  }

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(formatDate(d));
  }

  function reset() {
    setRows({});
  }

  function submit() {
    const items = products.map((p) => getRow(p.id)).filter((i) => i.delivered > 0 || i.received > 0);
    if (items.length === 0) {
      showToast("Enter delivered or received jars", "error");
      return;
    }
    const bottles = items.reduce((s, i) => s + i.delivered, 0);
    const amount = items.reduce((s, i) => s + i.delivered * rate(i.productId), 0);
    addDelivery({
      userId: customer.id,
      date,
      shift,
      items,
      bottles,
      price: customer.price,
      amount,
      notes: "",
    });
    showToast(`Transaction saved for ${customer.name}`, "success");
    onClose();
  }

  function productCard(p: (typeof products)[number]) {
    const row = getRow(p.id);
    return (
      <div key={p.id} className="rounded-2xl border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 truncate">{p.name}</h3>
            <p className="text-xs text-slate-400">Rate:- {p.rate.toFixed(1)}/-</p>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-end gap-3">
              <span className="text-sm text-slate-600">Delivered</span>
              <Stepper value={row.delivered} onChange={(v) => setRow(p.id, { delivered: v })} />
            </div>
            <div className="flex items-center justify-end gap-3">
              <span className="text-sm text-slate-600">Received</span>
              <Stepper value={row.received} onChange={(v) => setRow(p.id, { received: v })} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={customer.name}>
      <div className="space-y-4 pb-2">
        {/* Date + shift pill */}
        <div className="flex items-center gap-2 rounded-2xl border-2 border-sky-400 px-2 py-2">
          <button onClick={() => shiftDate(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sky-500">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center font-semibold text-sky-500 text-sm">{formatDisplayDate(date)}</div>
          <button onClick={() => shiftDate(1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sky-500">
            <ChevronRight size={18} />
          </button>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as Shift)}
            className="border-0 text-sm text-sky-500 font-semibold bg-transparent focus:outline-none"
          >
            {SHIFT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-slate-500">
          Create transaction for <span className="font-semibold text-slate-700">{formatDisplayDate(date)}</span>.
        </p>

        {primary && productCard(primary)}

        {others.length > 0 && (
          <div>
            <button
              onClick={() => setShowOthers((v) => !v)}
              className="w-full flex items-center justify-between py-2 text-slate-700 font-medium"
            >
              Other product's
              {showOthers ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            {showOthers && <div className="space-y-3">{others.map(productCard)}</div>}
          </div>
        )}

        <div className="text-right text-sm font-semibold text-slate-700">
          Total{" "}
          <span className="text-slate-900">
            {money(products.reduce((s, p) => s + getRow(p.id).delivered * rate(p.id), 0))}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={reset} className="flex-1 py-3 rounded-xl border-2 border-sky-400 text-sky-500 font-semibold">
            Reset
          </button>
          <button onClick={submit} className="flex-1 py-3 rounded-xl bg-sky-500 text-white font-semibold">
            Submit
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function MonthlyScreen({ customerId }: { customerId?: string }) {
  const { customers, products, deliveries, agency, deleteDelivery, showToast } = useApp();
  const [selectedId, setSelectedId] = useState<string | undefined>(customerId);
  const [picker, setPicker] = useState(false);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [addDay, setAddDay] = useState<number | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const customer = selectedId ? findUser(customers, selectedId) : undefined;

  const monthLabel = new Date(ym.year, ym.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function stepMonth(delta: number) {
    setYm((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const rows = useMemo(() => {
    if (!customer) return [];
    return getDeliveriesByUser(deliveries, customer.id)
      .filter((d) => {
        const dd = new Date(d.date);
        return dd.getFullYear() === ym.year && dd.getMonth() === ym.month;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [customer, deliveries, ym]);

  // Per-product totals for the month
  const totals = useMemo(() => {
    const map = new Map<string, { delivered: number; received: number }>();
    for (const p of products) map.set(p.id, { delivered: 0, received: 0 });
    for (const d of rows) {
      for (const item of d.items ?? []) {
        const cur = map.get(item.productId) ?? { delivered: 0, received: 0 };
        cur.delivered += item.delivered;
        cur.received += item.received;
        map.set(item.productId, cur);
      }
    }
    return map;
  }, [rows, products]);

  // Deliveries grouped by day-of-month for the accordion.
  const byDay = useMemo(() => {
    const map = new Map<number, Delivery[]>();
    for (const d of rows) {
      const day = new Date(d.date).getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(d);
    }
    return map;
  }, [rows]);

  const daysInMonth = new Date(ym.year, ym.month + 1, 0).getDate();

  function exportPdf() {
    if (!customer) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(agency.name, 14, 18);
    doc.setFontSize(11);
    doc.text(`Monthly Statement — ${monthLabel}`, 14, 26);
    doc.text(`Customer: ${customer.name}`, 14, 34);
    doc.text(`Mobile: ${customer.phone}`, 14, 40);

    let y = 52;
    doc.setFontSize(11);
    doc.text("Product", 14, y);
    doc.text("Delivered", 90, y);
    doc.text("Received", 140, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 7;
    totals.forEach((v, pid) => {
      const p = findProduct(products, pid);
      if (!p) return;
      doc.text(p.name, 14, y);
      doc.text(String(v.delivered), 90, y);
      doc.text(String(v.received), 140, y);
      y += 7;
    });

    y += 4;
    doc.line(14, y, 196, y);
    y += 8;
    doc.text("Date-wise deliveries", 14, y);
    y += 7;
    rows.forEach((d) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const label = new Date(d.date).toLocaleDateString("en-GB");
      doc.text(`${label}  ·  ${d.shift}  ·  ${d.bottles} jar(s)  ·  Rs.${d.amount.toFixed(0)}`, 14, y);
      y += 7;
    });

    doc.save(`${customer.name}-${monthLabel}.pdf`);
    showToast("PDF downloaded", "success");
  }

  return (
    <div className="pb-8">
      <ScreenHeader
        title="Monthly Details"
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

        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2">
          <button onClick={() => stepMonth(-1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center font-semibold text-sky-500">{monthLabel}</div>
          <button onClick={() => stepMonth(1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronRight size={18} />
          </button>
        </div>

        {!customer ? (
          <EmptyState message="Select a customer to view their monthly card." />
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{customer.name}</h3>
                  <p className="text-sm text-slate-400">{customer.phone}</p>
                </div>
                <Avatar size={52} />
              </div>

              <table className="w-full mt-4 text-sm">
                <thead>
                  <tr className="bg-sky-500 text-white">
                    <th className="text-left px-3 py-2 rounded-l-lg font-medium">Product</th>
                    <th className="px-2 py-2 font-medium">Total Delivered</th>
                    <th className="px-2 py-2 rounded-r-lg font-medium">Total Received</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const t = totals.get(p.id) ?? { delivered: 0, received: 0 };
                    return (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-700">{p.name}</td>
                        <td className="px-2 py-2 text-center">{t.delivered}</td>
                        <td className="px-2 py-2 text-center">{t.received}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Column header */}
            <div className="bg-sky-500 text-white grid grid-cols-[1.6fr_1.4fr_0.7fr_0.7fr_0.7fr_1fr_auto] text-xs font-medium rounded-lg overflow-hidden">
              <span className="px-2 py-2">Shift</span>
              <span className="px-1 py-2">Product</span>
              <span className="px-1 py-2 text-center">DLVD</span>
              <span className="px-1 py-2 text-center">RCVD</span>
              <span className="px-1 py-2 text-center">Bal</span>
              <span className="px-1 py-2 text-center">Time</span>
              <span className="px-2 py-2" />
            </div>

            {/* Day-by-day accordion */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {Array.from({ length: daysInMonth }, (_, i) => daysInMonth - i).map((day) => {
                const dels = byDay.get(day) ?? [];
                const has = dels.length > 0;
                const dayDate = new Date(ym.year, ym.month, day);
                const label = `${dayDate.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}, ${String(ym.year).slice(2)}, ${dayDate.toLocaleDateString("en-US", { weekday: "short" })}`;
                const open = openDay === day;
                const lines = has ? toLineRows(dels, products) : [];
                return (
                  <div key={day}>
                    <div className="w-full flex items-center gap-3 px-3 py-3">
                      <button
                        onClick={() => setOpenDay(open ? null : day)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 ${
                            has ? "bg-emerald-500" : "bg-red-400"
                          }`}
                        >
                          <Check size={14} />
                        </span>
                        <span className="flex-1 font-medium text-slate-700">{label}</span>
                      </button>
                      {open && (
                        <button
                          onClick={() => setAddDay(day)}
                          aria-label="Add transaction"
                          className="w-8 h-8 flex items-center justify-center text-sky-500 active:scale-95"
                        >
                          <Plus size={20} />
                        </button>
                      )}
                      <button
                        onClick={() => setOpenDay(open ? null : day)}
                        aria-label={open ? "Collapse" : "Expand"}
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        <ChevronDown
                          size={18}
                          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                    {open && (
                      <div className="px-3 pb-3">
                        {lines.length === 0 ? (
                          <p className="text-center text-slate-400 text-sm py-3">No Transaction</p>
                        ) : (
                          <div className="rounded-lg border border-slate-100 overflow-hidden">
                            {lines.map((l, idx) => (
                              <div
                                key={idx}
                                className="grid grid-cols-[1.6fr_1.4fr_0.7fr_0.7fr_0.7fr_1fr_auto] text-xs border-b border-slate-100 last:border-0 items-center"
                              >
                                <span className="px-2 py-2 capitalize text-slate-600">{l.shift}</span>
                                <span className="px-1 py-2 text-slate-700 truncate">{l.product}</span>
                                <span className="px-1 py-2 text-center">{l.dlvd}</span>
                                <span className="px-1 py-2 text-center">{l.rcvd}</span>
                                <span className="px-1 py-2 text-center">{l.bal}</span>
                                <span className="px-1 py-2 text-center text-slate-500">{l.time}</span>
                                <button
                                  onClick={() => setDelId(l.id)}
                                  aria-label="Delete transaction"
                                  className="px-2 py-2 flex items-center justify-center text-red-400 active:scale-95"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Previous / Next month paging */}
            <div className="flex rounded-2xl overflow-hidden border border-slate-200">
              <button
                onClick={() => { stepMonth(-1); setOpenDay(null); }}
                className="flex-1 py-3 bg-white text-sky-500 font-semibold flex items-center justify-center gap-1"
              >
                <ChevronLeft size={18} /> Previous
              </button>
              <button
                onClick={() => { stepMonth(1); setOpenDay(null); }}
                className="flex-1 py-3 bg-sky-500 text-white font-semibold flex items-center justify-center gap-1"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      <CustomerPicker open={picker} onClose={() => setPicker(false)} onPick={setSelectedId} />

      {customer && addDay !== null && (
        <AddTransactionModal
          open={addDay !== null}
          onClose={() => setAddDay(null)}
          customer={customer}
          initialDate={formatDate(new Date(ym.year, ym.month, addDay))}
        />
      )}

      <ConfirmDialog
        open={delId !== null}
        message="This transaction will be permanently deleted."
        onCancel={() => setDelId(null)}
        onConfirm={() => {
          if (delId) {
            deleteDelivery(delId);
            showToast("Transaction deleted", "success");
          }
          setDelId(null);
        }}
      />
    </div>
  );
}
