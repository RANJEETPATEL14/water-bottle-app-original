import { Plus, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { findUser, formatDisplayDate, money } from "../store";
import { ScreenHeader, EmptyState } from "./ui";

const MODE_LABEL: Record<string, string> = {
  cash: "Cash",
  cheque: "Cheque",
  online: "Online",
  wallet: "Wallet",
};

export function PaymentsScreen() {
  const { payments, customers, navigate, deletePayment, showToast } = useApp();
  const sorted = [...payments].sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="pb-24">
      <ScreenHeader title="Payments" subtitle={`Total collected: ${money(total)}`} />
      <div className="p-4 space-y-3">
        {sorted.length === 0 ? (
          <EmptyState message="No payments recorded yet." />
        ) : (
          sorted.map((p) => {
            const c = findUser(customers, p.userId);
            return (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{c?.name ?? "Unknown"}</h3>
                  <p className="text-xs text-slate-400">
                    {MODE_LABEL[p.mode] ?? p.mode} · {formatDisplayDate(p.date)}
                  </p>
                  {p.remark && <p className="text-xs text-slate-400 truncate">{p.remark}</p>}
                </div>
                <span className="font-bold text-emerald-500">{money(p.amount)}</span>
                <button
                  onClick={() => {
                    deletePayment(p.id);
                    showToast("Payment deleted", "success");
                  }}
                  className="text-slate-300 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={() => navigate({ name: "payment" })}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-sky-500 text-white shadow-lg flex items-center justify-center"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
