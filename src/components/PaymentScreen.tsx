import { useState } from "react";
import { CreditCard, Check, ChevronRight } from "lucide-react";
import { useApp } from "../context";
import { findUser, formatDate } from "../store";
import type { PaymentMode } from "../types";
import { ScreenHeader, Field, inputClass } from "./ui";
import { CustomerPicker } from "./CustomerPicker";

const MODES: { value: PaymentMode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
  { value: "wallet", label: "Wallet" },
];

export function PaymentScreen({ customerId }: { customerId?: string }) {
  const { customers, agency, addPayment, back, showToast } = useApp();
  const [selectedId, setSelectedId] = useState<string | undefined>(customerId);
  const [picker, setPicker] = useState(false);
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [receiver, setReceiver] = useState(agency.ownerName);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [remark, setRemark] = useState("");
  const [share, setShare] = useState(false);

  const customer = selectedId ? findUser(customers, selectedId) : undefined;

  function submit() {
    if (!customer) {
      showToast("Select a customer", "error");
      return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      showToast("Enter a valid amount", "error");
      return;
    }
    addPayment({ userId: customer.id, amount: amt, mode, receiver: receiver.trim(), date, remark: remark.trim() });
    showToast(`Payment of ₹${amt} recorded`, "success");
    back();
  }

  return (
    <div className="pb-8">
      <ScreenHeader title="" />
      <div className="bg-sky-500 flex flex-col items-center pb-6 -mt-2">
        <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-white">
          <CreditCard size={36} />
        </div>
        <p className="text-white font-semibold mt-2">Payment Entry</p>
      </div>

      <div className="bg-white -mt-4 rounded-t-3xl p-5 space-y-5">
        <label className="flex items-center justify-end gap-3">
          <span className="text-slate-600">Share on submit</span>
          <button
            onClick={() => setShare((s) => !s)}
            className={`w-12 h-6 rounded-full transition-colors relative ${share ? "bg-sky-500" : "bg-slate-300"}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${share ? "left-6" : "left-0.5"}`}
            />
          </button>
        </label>

        <div>
          <p className="text-sm font-medium text-sky-600 mb-2">Payment Mode</p>
          <div className="flex flex-wrap gap-4">
            {MODES.map((m) => (
              <button key={m.value} onClick={() => setMode(m.value)} className="flex items-center gap-1.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    mode === m.value ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                  }`}
                >
                  {mode === m.value && <Check size={14} />}
                </span>
                <span className="text-slate-700">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Field label="Customer Name" required>
          <button
            onClick={() => setPicker(true)}
            className={`${inputClass} flex items-center justify-between text-left`}
          >
            <span className={customer ? "text-slate-800" : "text-slate-400"}>
              {customer ? customer.name : "Select customer"}
            </span>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        </Field>

        <Field label="Receiver Name" required>
          <input className={inputClass} value={receiver} onChange={(e) => setReceiver(e.target.value)} />
        </Field>

        <Field label="Amount" required>
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>

        <Field label="Select Date" required>
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="Remark">
          <input className={inputClass} value={remark} onChange={(e) => setRemark(e.target.value)} />
        </Field>

        <button onClick={submit} className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">
          Add Payment
        </button>
      </div>

      <CustomerPicker open={picker} onClose={() => setPicker(false)} onPick={setSelectedId} />
    </div>
  );
}
