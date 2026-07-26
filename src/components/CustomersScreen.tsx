import { useMemo, useState } from "react";
import { Phone, HandCoins } from "lucide-react";
import { useApp } from "../context";
import { getCustomerDues, findGroup } from "../store";
import type { Frequency } from "../types";
import { ScreenHeader, SearchBar, Segmented, DuesRow, Avatar, EmptyState } from "./ui";

type Filter = "all" | Frequency;

export function CustomersScreen() {
  const { customers, deliveries, returns, payments, groups, navigate } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((c) => (filter === "all" ? true : c.frequency === filter))
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, query, filter]);

  return (
    <div className="pb-24">
      <ScreenHeader title="Customers" />

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

        {list.length === 0 ? (
          <EmptyState message="No customers yet. Tap Create Customer to add your first one." />
        ) : (
          <div className="space-y-3">
            {list.map((c) => {
              const dues = getCustomerDues(c, deliveries, returns, payments);
              const group = findGroup(groups, c.groupId);
              return (
                <button
                  key={c.id}
                  onClick={() => navigate({ name: "customerDetail", id: c.id })}
                  className="w-full text-left bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Avatar />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 leading-tight">{c.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>
                      <p className="text-xs text-slate-400">{group?.name ?? "—"}</p>
                    </div>
                    <div className="flex gap-3 pt-1">
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sky-500"
                        >
                          <Phone size={20} />
                        </a>
                      )}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({ name: "payment", customerId: c.id });
                        }}
                        className="text-sky-500"
                      >
                        <HandCoins size={20} />
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 mt-3">
                    <DuesRow dues={dues} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-slate-200 p-3 flex gap-3 z-30">
        <button
          onClick={() => navigate({ name: "customers" })}
          className="flex-1 py-3 rounded-xl border border-sky-500 text-sky-500 font-medium"
        >
          Invite All
        </button>
        <button
          onClick={() => navigate({ name: "customerForm" })}
          className="flex-1 py-3 rounded-xl bg-sky-500 text-white font-medium"
        >
          Create Customer
        </button>
      </div>
    </div>
  );
}
