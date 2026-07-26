import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { formatDate, formatDisplayDate, money } from "../store";
import { ScreenHeader, Field, inputClass, EmptyState } from "./ui";
import { Modal } from "./Modal";

export function ExpensesScreen() {
  const { expenses, addExpense, deleteExpense, showToast } = useApp();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Fuel");
  const [date, setDate] = useState(formatDate(new Date()));
  const [notes, setNotes] = useState("");

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const sorted = [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!title.trim() || !amt) {
      showToast("Enter title and amount", "error");
      return;
    }
    addExpense({ title: title.trim(), amount: amt, category, date, notes: notes.trim() });
    showToast("Expense added", "success");
    setOpen(false);
    setTitle("");
    setAmount("");
    setNotes("");
  }

  return (
    <div className="pb-24">
      <ScreenHeader title="Expenses" subtitle={`Total: ${money(total)}`} />
      <div className="p-4 space-y-3">
        {sorted.length === 0 ? (
          <EmptyState message="No expenses recorded yet." />
        ) : (
          sorted.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{e.title}</h3>
                <p className="text-xs text-slate-400">
                  {e.category} · {formatDisplayDate(e.date)}
                </p>
              </div>
              <span className="font-bold text-red-500">{money(e.amount)}</span>
              <button onClick={() => { deleteExpense(e.id); showToast("Deleted", "success"); }} className="text-slate-300 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-sky-500 text-white shadow-lg flex items-center justify-center"
      >
        <Plus size={28} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="New Expense">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Title" required>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount (₹)" required>
              <input className={inputClass} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Category">
              <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                {["Fuel", "Salary", "Maintenance", "Purchase", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Date">
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Notes">
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <button type="submit" className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">
            Add Expense
          </button>
        </form>
      </Modal>
    </div>
  );
}
