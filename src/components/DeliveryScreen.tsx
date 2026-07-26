import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronRight as Chevron, Lightbulb, CheckCircle2 } from "lucide-react";
import { useApp } from "../context";
import { findUser, getCustomerDues, formatDate, formatDisplayDate, money } from "../store";
import type { DeliveryItem, Shift } from "../types";
import { ScreenHeader, Avatar, SHIFT_OPTIONS, Stepper } from "./ui";
import { CustomerPicker } from "./CustomerPicker";

export function DeliveryScreen({ customerId }: { customerId?: string }) {
  const { customers, deliveries, returns, payments, products, addDelivery, back, showToast } = useApp();

  const [selectedId, setSelectedId] = useState<string | undefined>(customerId);
  const [picker, setPicker] = useState(!customerId);
  const [date, setDate] = useState(formatDate(new Date()));
  const [shift, setShift] = useState<Shift>("morning");
  const [rows, setRows] = useState<Record<string, DeliveryItem>>({});

  const customer = selectedId ? findUser(customers, selectedId) : undefined;
  const dues = customer ? getCustomerDues(customer, deliveries, returns, payments) : null;

  function getRow(productId: string): DeliveryItem {
    return rows[productId] ?? { productId, delivered: 0, received: 0 };
  }
  function setRow(productId: string, patch: Partial<DeliveryItem>) {
    setRows((prev) => ({ ...prev, [productId]: { ...getRow(productId), ...patch } }));
  }

  function rate(productId: string): number {
    const p = products.find((x) => x.id === productId);
    return p?.rate ?? customer?.price ?? 20;
  }

  const total = products.reduce((sum, p) => sum + getRow(p.id).delivered * rate(p.id), 0);

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(formatDate(d));
  }

  function reset() {
    setRows({});
  }

  function submit() {
    if (!customer) {
      showToast("Select a customer first", "error");
      return;
    }
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
    showToast(`Delivery saved for ${customer.name}`, "success");
    back();
  }

  return (
    <div className="pb-28">
      <ScreenHeader title="Single Delivery" />

      <div className="p-4 space-y-4">
        {/* Customer card */}
        <button
          onClick={() => setPicker(true)}
          className="w-full text-left bg-white rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Avatar />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-sky-500 font-medium">Customer Name *</p>
              <h3 className="font-semibold text-slate-800 truncate">
                {customer ? customer.name : "Tap to select"}
              </h3>
            </div>
            <Chevron size={20} className="text-slate-300" />
          </div>
          {customer && dues && (
            <div className="grid grid-cols-4 divide-x divide-slate-100 border-t border-slate-100 mt-3 pt-2">
              {[
                { label: "Balance Jar", value: String(dues.balanceJar), color: "text-sky-500" },
                { label: "Past Due", value: money(dues.pastDue), color: "text-slate-800" },
                { label: "Current Due", value: money(dues.currentDue), color: "text-slate-800" },
                { label: "Total Due", value: money(dues.totalDue), color: "text-red-500" },
              ].map((c) => (
                <div key={c.label} className="text-center px-1">
                  <div className={`font-bold text-xs ${c.color}`}>{c.value}</div>
                  <div className="text-[0.6rem] text-slate-400">{c.label}</div>
                </div>
              ))}
            </div>
          )}
        </button>

        {/* Date + shift */}
        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center font-semibold text-sky-500 text-sm">
            {formatDisplayDate(date)}
          </div>
          <button onClick={() => shiftDate(1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronRight size={18} />
          </button>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as Shift)}
            className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-sky-500 font-medium"
          >
            {SHIFT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {dues && dues.totalDue > 0 && (
          <div className="bg-pink-50 rounded-xl p-3 flex items-start gap-2">
            <Lightbulb size={20} className="text-sky-500 shrink-0" />
            <p className="text-sm text-slate-600">
              Customer {customer?.name} has due amount of {money(dues.totalDue)}, please collect payment.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CheckCircle2 size={18} className="text-emerald-500" />
          Create transaction for {formatDisplayDate(date)}.
        </div>

        {/* Product rows */}
        {products.map((p) => {
          const row = getRow(p.id);
          const cost = row.delivered * rate(p.id);
          return (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800">{p.name}</h3>
                  <p className="text-xs text-slate-400">Rate:- {p.rate.toFixed(1)}/-</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Delivered</span>
                  <Stepper value={row.delivered} onChange={(v) => setRow(p.id, { delivered: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Received</span>
                  <Stepper value={row.received} onChange={(v) => setRow(p.id, { received: v })} />
                </div>
              </div>
              <p className="text-right text-xs text-slate-500 mt-2">
                Product Cost ({p.rate.toFixed(1)} × {row.delivered}) ={" "}
                <span className="font-bold text-slate-800">{money(cost)}</span>
              </p>
            </div>
          );
        })}

        <div className="text-right font-semibold text-slate-700">
          Total Amount <span className="text-slate-900">{money(total)}</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex border-t border-slate-200 z-30">
        <button onClick={reset} className="flex-1 py-4 bg-white text-sky-500 font-semibold">
          Reset
        </button>
        <button onClick={submit} className="flex-1 py-4 bg-sky-500 text-white font-semibold">
          Submit
        </button>
      </div>

      <CustomerPicker open={picker} onClose={() => setPicker(false)} onPick={setSelectedId} />
    </div>
  );
}
