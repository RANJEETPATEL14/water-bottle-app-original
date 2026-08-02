import { useMemo, useState } from "react";
import { Phone, HandCoins, Umbrella, UserPlus, Trash2, Check } from "lucide-react";
import { useApp } from "../context";
import { getGroupDues, getCustomerDues, findGroup, sortCustomers, DEFAULT_GROUP_ID } from "../store";
import type { Customer, Frequency } from "../types";
import { ScreenHeader, SearchBar, Segmented, DuesRow, Avatar, EmptyState } from "./ui";
import { Modal } from "./Modal";

type Filter = "all" | Frequency;

export function GroupDetailScreen({ id }: { id: string }) {
  const { groups, customers, deliveries, returns, payments, customerSort, updateCustomer, navigate, showToast } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);

  const group = findGroup(groups, id);

  const members = useMemo(() => {
    if (!group) return [];
    const q = query.trim().toLowerCase();
    const filtered = customers
      .filter((c) => String(c.groupId) === String(group.id))
      .filter((c) => (filter === "all" ? true : c.frequency === filter))
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q));
    return sortCustomers(filtered, customerSort);
  }, [group, customers, query, filter, customerSort]);

  if (!group) {
    return (
      <div>
        <ScreenHeader title="Group" />
        <p className="p-8 text-center text-slate-400">Group not found.</p>
      </div>
    );
  }

  const dues = getGroupDues(group, customers, deliveries, returns, payments);

  function removeFromGroup(customer: Customer) {
    updateCustomer(customer.id, { groupId: DEFAULT_GROUP_ID });
    showToast(`${customer.name} removed from group`, "success");
  }

  return (
    <div className="pb-24">
      <ScreenHeader title={group.name} />

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

        {/* Group summary card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
              <Umbrella size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 leading-tight">{group.name}</h3>
              <p className="text-xs text-slate-400">Created By: {group.createdBy}</p>
            </div>
            <div className="text-center pl-2">
              <div className="font-bold text-slate-800">{dues.customerCount}</div>
              <div className="text-[0.65rem] text-slate-400">Customers</div>
            </div>
          </div>
          <div className="border-t border-slate-100 mt-3">
            <DuesRow dues={dues} variant="group" />
          </div>
        </div>

        {removeMode && (
          <p className="text-center text-xs text-red-500 font-medium">
            Tap a customer to remove them from this group.
          </p>
        )}

        {/* Customer list */}
        {members.length === 0 ? (
          <EmptyState message="No customers in this group yet. Tap Add Customers below." />
        ) : (
          <div className="space-y-3">
            {members.map((c) => {
              const cd = getCustomerDues(c, deliveries, returns, payments);
              return (
                <button
                  key={c.id}
                  onClick={() =>
                    removeMode ? removeFromGroup(c) : navigate({ name: "customerDetail", id: c.id })
                  }
                  className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm ${
                    removeMode ? "ring-2 ring-red-200" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 leading-tight">{c.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{c.phone}</p>
                    </div>
                    {removeMode ? (
                      <Trash2 size={20} className="text-red-500" />
                    ) : (
                      <div className="flex gap-3 pt-1">
                        {c.phone && (
                          <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="text-sky-500">
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
                    )}
                  </div>
                  <div className="border-t border-slate-100 mt-3">
                    <DuesRow dues={cd} />
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
          onClick={() => setRemoveMode((m) => !m)}
          className={`flex-1 py-3 rounded-xl border font-medium flex items-center justify-center gap-2 ${
            removeMode ? "bg-red-500 text-white border-red-500" : "border-red-400 text-red-500"
          }`}
        >
          <Trash2 size={18} />
          {removeMode ? "Done" : "Remove Customers"}
        </button>
        <button
          onClick={() => setAddOpen(true)}
          className="flex-1 py-3 rounded-xl bg-sky-500 text-white font-medium flex items-center justify-center gap-2"
        >
          <UserPlus size={18} />
          Add Customers
        </button>
      </div>

      <AddCustomersModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        groupId={group.id}
        onAdd={(ids) => {
          ids.forEach((cid) => updateCustomer(cid, { groupId: group.id }));
          showToast(`${ids.length} customer(s) added`, "success");
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Add-customers multi-select modal                                          */
/* -------------------------------------------------------------------------- */

function AddCustomersModal({
  open,
  onClose,
  groupId,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  groupId: string;
  onAdd: (ids: string[]) => void;
}) {
  const { customers, customerSort } = useApp();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reset selection each time the modal opens.
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setSelected(new Set());
    setQuery("");
    setWasOpen(true);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const candidates = customers.filter(
      (c) => String(c.groupId) !== String(groupId) && (!q || c.name.toLowerCase().includes(q) || c.phone.includes(q)),
    );
    return sortCustomers(candidates, customerSort);
  }, [customers, groupId, query, customerSort]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Customers">
      <div className="space-y-3">
        <SearchBar value={query} onChange={setQuery} />
        <div className="max-h-[45vh] overflow-y-auto divide-y divide-slate-100">
          {list.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-6">No other customers to add.</p>
          )}
          {list.map((c) => {
            const on = selected.has(c.id);
            return (
              <button key={c.id} onClick={() => toggle(c.id)} className="w-full flex items-center gap-3 py-3 text-left">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                    on ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                  }`}
                >
                  {on && <Check size={14} />}
                </span>
                <Avatar size={40} />
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 leading-tight">{c.name}</h3>
                  <p className="text-xs text-slate-400">{c.phone}</p>
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            if (selected.size === 0) return;
            onAdd([...selected]);
            onClose();
          }}
          disabled={selected.size === 0}
          className="w-full py-3 rounded-xl bg-sky-500 text-white font-semibold disabled:opacity-40"
        >
          Add {selected.size > 0 ? `(${selected.size})` : ""}
        </button>
      </div>
    </Modal>
  );
}
