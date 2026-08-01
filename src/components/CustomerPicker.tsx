import { useState, useMemo } from "react";
import { useApp } from "../context";
import { sortCustomers } from "../store";
import { Modal } from "./Modal";
import { SearchBar, Avatar } from "./ui";

export function CustomerPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const { customers, customerSort } = useApp();
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = customers.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q),
    );
    return sortCustomers(filtered, customerSort);
  }, [customers, query, customerSort]);

  return (
    <Modal open={open} onClose={onClose} title="Select Customer">
      <div className="space-y-3">
        <SearchBar value={query} onChange={setQuery} />
        <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100">
          {list.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-6">No customers found.</p>
          )}
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onPick(c.id);
                onClose();
              }}
              className="w-full flex items-center gap-3 py-3 text-left"
            >
              <Avatar size={40} />
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 leading-tight">{c.name}</h3>
                <p className="text-xs text-slate-400">{c.phone}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
