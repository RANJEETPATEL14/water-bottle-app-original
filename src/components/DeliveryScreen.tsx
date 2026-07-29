import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronRight as Chevron, Lightbulb, CheckCircle2 } from "lucide-react";
import { useApp } from "../context";
import {
  findUser,
  getCustomerDues,
  getDeliveriesByUser,
  getDeliveriesByDate,
  formatDate,
  formatDisplayDate,
  money,
} from "../store";
import type { DeliveryItem, PaymentMode, Shift } from "../types";
import { ScreenHeader, Avatar, SHIFT_OPTIONS, Stepper } from "./ui";
import { CustomerPicker } from "./CustomerPicker";

const MODES: { value: PaymentMode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
  { value: "wallet", label: "Wallet" },
];

export function DeliveryScreen({ customerId }: { customerId?: string }) {
  const { customers, deliveries, returns, payments, products, agency, addDelivery, updateDelivery, addPayment, back, showToast } =
    useApp();

  const [selectedId, setSelectedId] = useState<string | undefined>(customerId);
  const [picker, setPicker] = useState(!customerId);
  const [date, setDate] = useState(formatDate(new Date()));
  const [shift, setShift] = useState<Shift>("morning");
  const [rows, setRows] = useState<Record<string, DeliveryItem>>({});
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<PaymentMode>("cash");
  const [shareOnSubmit, setShareOnSubmit] = useState(false);

  const customer = selectedId ? findUser(customers, selectedId) : undefined;
  const dues = customer ? getCustomerDues(customer, deliveries, returns, payments) : null;

  // Existing transaction for this exact customer + date + shift (update mode).
  const existing = useMemo(() => {
    if (!customer) return undefined;
    return getDeliveriesByDate(deliveries, date).find(
      (d) => String(d.userId) === String(customer.id) && d.shift === shift,
    );
  }, [customer, deliveries, date, shift]);

  // Reload the form when the customer / date / shift slot changes, pulling in
  // any existing transaction for that slot so it can be updated.
  const slotKey = `${customer?.id ?? ""}-${date}-${shift}`;
  const [lastSlot, setLastSlot] = useState("");
  if (customer && slotKey !== lastSlot) {
    const preset: Record<string, DeliveryItem> = {};
    if (existing) {
      const items = existing.items ?? [];
      items.forEach((it, i) => {
        const match = products.find((p) => String(p.id) === String(it.productId));
        const target = match ?? products[i] ?? products[0];
        if (!target) return;
        const cur = preset[target.id] ?? { productId: target.id, delivered: 0, received: 0 };
        preset[target.id] = {
          productId: target.id,
          delivered: cur.delivered + Number(it.delivered || 0),
          received: cur.received + Number(it.received || 0),
        };
      });
      if (items.length === 0 && Number(existing.bottles) > 0 && products[0]) {
        preset[products[0].id] = { productId: products[0].id, delivered: Number(existing.bottles), received: 0 };
      }
    }
    setRows(preset);
    setLastSlot(slotKey);
  }

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

  /** Net jars still out with this customer for one product (delivered − received). */
  function balanceJar(productId: string): number {
    if (!customer) return 0;
    let out = 0;
    for (const d of getDeliveriesByUser(deliveries, customer.id)) {
      for (const it of d.items ?? []) {
        if (String(it.productId) === String(productId)) out += Number(it.delivered) - Number(it.received);
      }
    }
    return out;
  }

  const total = products.reduce((sum, p) => sum + getRow(p.id).delivered * rate(p.id), 0);

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(formatDate(d));
  }

  function reset() {
    setRows({});
    setPayAmount("");
  }

  function buildShareText(items: DeliveryItem[], amount: number, paid: number): string {
    const lines = items
      .map((i) => {
        const p = products.find((x) => x.id === i.productId);
        return `${p?.name ?? "Product"}: ${i.delivered} delivered, ${i.received} received`;
      })
      .join("\n");
    return (
      `${agency.name}\n${customer?.name} (${customer?.phone})\n${formatDisplayDate(date)} · ${shift}\n\n` +
      `${lines}\n\nTotal: ${money(amount)}` +
      (paid > 0 ? `\nPayment received: ${money(paid)} (${payMode})` : "")
    );
  }

  async function shareText(text: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title: agency.name, text });
        return;
      } catch {
        /* cancelled */
      }
    }
    const phone = (customer?.phone ?? "").replace(/\D/g, "");
    window.open(phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `sms:?body=${encodeURIComponent(text)}`, "_blank");
  }

  function submit(alsoShare: boolean) {
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

    if (existing) {
      updateDelivery(existing.id, { date, shift, items, bottles, price: customer.price, amount });
      showToast(`Delivery updated for ${customer.name}`, "success");
    } else {
      addDelivery({ userId: customer.id, date, shift, items, bottles, price: customer.price, amount, notes: "" });
      showToast(`Delivery saved for ${customer.name}`, "success");
    }

    // Optional inline payment collection.
    const paid = parseFloat(payAmount) || 0;
    if (paid > 0) {
      addPayment({ userId: customer.id, amount: paid, mode: payMode, receiver: agency.ownerName, date, remark: "" });
      showToast(`Payment of ${money(paid)} recorded`, "success");
    }

    if (alsoShare || shareOnSubmit) {
      void shareText(buildShareText(items, amount, paid));
    }
    back();
  }

  const createdLabel = existing
    ? `${new Date(existing.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${new Date(existing.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
    : "";

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

        {/* Share on submit */}
        <label className="flex items-center justify-end gap-3">
          <span className="text-sm text-slate-600">Share on submit</span>
          <button
            onClick={() => setShareOnSubmit((s) => !s)}
            className={`w-12 h-6 rounded-full transition-colors relative ${shareOnSubmit ? "bg-sky-500" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${shareOnSubmit ? "left-6" : "left-0.5"}`} />
          </button>
        </label>

        {dues && dues.totalDue > 0 && (
          <div className="bg-pink-50 rounded-xl p-3 flex items-start gap-2">
            <Lightbulb size={20} className="text-sky-500 shrink-0" />
            <p className="text-sm text-slate-600">
              Customer {customer?.name} has due amount of {money(dues.totalDue)}, please collect payment.
            </p>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          {existing ? (
            <span>
              You already created transaction for {createdLabel}, you can update if you want.
            </span>
          ) : (
            <span>Create transaction for {formatDisplayDate(date)}.</span>
          )}
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
                  <p className="text-xs text-slate-400">Balance Jar:- {balanceJar(p.id)}</p>
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

        {/* Payment Receive */}
        {customer && (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Payment Receive</h3>
              <span className="text-xs text-slate-400">Due Amount: {money(dues?.totalDue ?? 0)}</span>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-sky-600 mb-1">Amount</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0"
                  className="w-full border-0 border-b-2 border-slate-200 pb-2 text-base text-slate-800 outline-none focus:border-sky-500 bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <select
                value={payMode}
                onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-sky-500 font-medium"
              >
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex border-t border-slate-200 z-30">
        <button onClick={reset} className="flex-1 py-4 bg-white text-sky-500 font-semibold border-r border-slate-200">
          Reset
        </button>
        <button onClick={() => submit(false)} className="flex-1 py-4 bg-sky-500 text-white font-semibold border-r border-sky-400">
          {existing ? "Update" : "Submit"}
        </button>
        <button onClick={() => submit(true)} className="flex-1 py-4 bg-sky-500 text-white font-semibold">
          Share
        </button>
      </div>

      <CustomerPicker open={picker} onClose={() => setPicker(false)} onPick={setSelectedId} />
    </div>
  );
}
