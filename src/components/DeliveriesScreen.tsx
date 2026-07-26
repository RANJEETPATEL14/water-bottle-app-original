import { Plus, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { findUser, formatDisplayDate, money } from "../store";
import { ScreenHeader, EmptyState } from "./ui";

export function DeliveriesScreen() {
  const { deliveries, customers, navigate, deleteDelivery, showToast } = useApp();
  const sorted = [...deliveries].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <div className="pb-24">
      <ScreenHeader title="Deliveries" subtitle={`${deliveries.length} total`} />
      <div className="p-4 space-y-3">
        {sorted.length === 0 ? (
          <EmptyState message="No deliveries yet. Create one from the dashboard." />
        ) : (
          sorted.map((d) => {
            const c = findUser(customers, d.userId);
            return (
              <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{c?.name ?? "Unknown"}</h3>
                  <p className="text-xs text-slate-400 capitalize">
                    {formatDisplayDate(d.date)} · {d.shift}
                  </p>
                </div>
                <div className="text-center bg-sky-50 px-3 py-1.5 rounded-xl">
                  <div className="font-bold text-sky-500">{d.bottles}</div>
                  <div className="text-[0.6rem] text-slate-400">jars</div>
                </div>
                <span className="font-semibold text-slate-700 w-16 text-right">{money(d.amount)}</span>
                <button onClick={() => { deleteDelivery(d.id); showToast("Deleted", "success"); }} className="text-slate-300 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={() => navigate({ name: "delivery" })}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-14 h-14 rounded-full bg-sky-500 text-white shadow-lg flex items-center justify-center"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
