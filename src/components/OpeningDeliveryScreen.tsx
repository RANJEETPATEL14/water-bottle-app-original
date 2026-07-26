import { useState } from "react";
import { Bike, ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "../context";
import { findUser, formatDate, formatDisplayDate } from "../store";
import type { DeliveryItem, Shift } from "../types";
import { ScreenHeader, SHIFT_OPTIONS, Segmented, Stepper } from "./ui";
import { CustomerPicker } from "./CustomerPicker";

export function OpeningDeliveryScreen({ customerId }: { customerId?: string }) {
  const { customers, products, addDelivery, back, showToast } = useApp();
  const [selectedId, setSelectedId] = useState<string | undefined>(customerId);
  const [picker, setPicker] = useState(!customerId);
  const [date, setDate] = useState(formatDate(new Date()));
  const [shift, setShift] = useState<Shift>("morning");
  const [qty, setQty] = useState<Record<string, number>>({});

  const customer = selectedId ? findUser(customers, selectedId) : undefined;

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(formatDate(d));
  }

  function submit() {
    if (!customer) {
      showToast("Select a customer first", "error");
      return;
    }
    const items: DeliveryItem[] = products
      .map((p) => ({ productId: p.id, delivered: qty[p.id] ?? 0, received: 0 }))
      .filter((i) => i.delivered > 0);
    if (items.length === 0) {
      showToast("Enter delivered jars", "error");
      return;
    }
    const bottles = items.reduce((s, i) => s + i.delivered, 0);
    const amount = items.reduce((s, i) => {
      const p = products.find((x) => x.id === i.productId);
      return s + i.delivered * (p?.rate ?? customer.price);
    }, 0);
    addDelivery({ userId: customer.id, date, shift, items, bottles, price: customer.price, amount, notes: "Opening delivery" });
    showToast("Opening delivery saved", "success");
    back();
  }

  return (
    <div className="pb-8">
      <ScreenHeader title="" />
      <div className="bg-sky-500 flex flex-col items-center pb-6 -mt-2">
        <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-white">
          <Bike size={34} />
        </div>
        <p className="text-white font-semibold mt-2">Opening Delivery</p>
      </div>

      <div className="bg-white -mt-4 rounded-t-3xl p-5 space-y-5">
        <button onClick={() => setPicker(true)} className="w-full text-left">
          <p className="text-sm text-slate-500">
            For <span className="font-bold text-slate-800">{customer ? customer.name : "Select customer"}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Add previously delivered products for which you need to receive the empty container back.
          </p>
        </button>

        <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center font-semibold text-sky-500 text-sm">{formatDisplayDate(date)}</div>
          <button onClick={() => shiftDate(1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronRight size={18} />
          </button>
        </div>

        <div>
          <p className="text-sm text-sky-600 font-medium mb-2">Select Shift</p>
          <Segmented options={SHIFT_OPTIONS} value={shift} onChange={setShift} />
        </div>

        {products.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-4">Add a product first.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <span className="font-bold text-slate-800">{p.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">Delivered</span>
                <Stepper value={qty[p.id] ?? 0} onChange={(v) => setQty((prev) => ({ ...prev, [p.id]: v }))} />
              </div>
            </div>
          ))
        )}

        <button onClick={submit} className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">
          Submit
        </button>
      </div>

      <CustomerPicker open={picker} onClose={() => setPicker(false)} onPick={setSelectedId} />
    </div>
  );
}
