import { useState, useMemo } from "react";
import { Inbox, BarChart3, Trash2 } from "lucide-react";
import type { User, Delivery, Return } from "../types";
import {
  formatDate,
  formatDisplayDate,
  getUserBottlesOut,
  getTotalBottlesOut,
  getTodayReturnCount,
  addReturn,
  deleteReturn,
  findUser,
} from "../store";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { QuantitySelector } from "./QuantitySelector";

interface ReturnsTabProps {
  users: User[];
  deliveries: Delivery[];
  returns: Return[];
  isOnline: boolean;
  onReturnsChange: (returns: Return[]) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export function ReturnsTab({
  users,
  deliveries,
  returns,
  isOnline,
  onReturnsChange,
  showToast,
}: ReturnsTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [bottles, setBottles] = useState(1);
  const [notes, setNotes] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));
  const selectedUser = findUser(users, userId);
  const selectedBottlesOut = userId
    ? getUserBottlesOut(deliveries, returns, userId)
    : 0;

  const filtered = useMemo(() => {
    let result = returns;
    if (filterUser) result = result.filter((r) => String(r.userId) === filterUser);
    if (filterMonth) {
      const [y, m] = filterMonth.split("-").map(Number);
      result = result.filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === y && d.getMonth() === (m ?? 0) - 1;
      });
    }
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [returns, filterUser, filterMonth]);

  const totalFiltered = filtered.reduce((sum, r) => sum + Number(r.bottles), 0);

  const grouped = useMemo(() => {
    const map: Record<string, Return[]> = {};
    for (const r of filtered) {
      const key = r.date;
      if (!map[key]) map[key] = [];
      map[key]!.push(r);
    }
    return map;
  }, [filtered]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) { showToast("Please select a user", "error"); return; }
    const r = addReturn(returns, { userId, date, bottles, notes }, isOnline);
    onReturnsChange([...returns, r]);
    const user = findUser(users, userId);
    showToast(`${bottles} bottle(s) returned by ${user?.name}!`, "success");
    setModalOpen(false);
    setUserId("");
    setBottles(1);
    setNotes("");
  }

  function handleDelete(id: string) {
    setDeleteTarget(id);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const updated = deleteReturn(returns, deleteTarget, isOnline);
    onReturnsChange(updated);
    showToast("Return record deleted!", "success");
    setDeleteTarget(null);
  }

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Bottle Returns</h2>
        <button
          onClick={() => {
            setDate(formatDate(new Date()));
            setModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all"
        >
          + Record Return
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <Inbox size={28} className="text-emerald-500" />
          <div>
            <h3 className="text-2xl font-bold text-emerald-500">{getTodayReturnCount(returns)}</h3>
            <p className="text-xs text-slate-500">Today's Returns</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <BarChart3 size={28} className="text-amber-500" />
          <div>
            <h3 className="text-2xl font-bold text-amber-500">{getTotalBottlesOut(deliveries, returns)}</h3>
            <p className="text-xs text-slate-500">Bottles Out</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-base bg-white">
          <option value="">All Users</option>
          {sorted.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-base bg-white" />
      </div>

      <h2 className="text-lg font-semibold mb-3">Recent Returns</h2>
      {filtered.length === 0 ? (
        <p className="text-center py-8 text-slate-500 text-sm">No returns recorded for selected filters</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-sky-500 to-sky-600 text-white">
                <th className="p-3 text-left text-xs font-semibold">Date</th>
                <th className="p-3 text-left text-xs font-semibold">Customer</th>
                <th className="p-3 text-center text-xs font-semibold">Bottles</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([dateKey, items]) => {
                const dayTotal = items.reduce((s, r) => s + Number(r.bottles), 0);
                return items.map((r, idx) => {
                  const user = findUser(users, r.userId);
                  return (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0">
                      <td className="p-2.5 text-sm font-semibold text-sky-500 whitespace-nowrap">
                        {idx === 0 ? formatDisplayDate(dateKey) : ""}
                      </td>
                      <td className="p-2.5 text-sm font-medium">{user?.name ?? "Unknown"}</td>
                      <td className="p-2.5 text-sm text-center font-semibold text-emerald-500">+{r.bottles}</td>
                      <td className="p-2.5">
                        <button onClick={() => handleDelete(r.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:scale-110 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                }).concat(
                  <tr key={`total-${dateKey}`} className="bg-slate-50 border-t-2 border-sky-500">
                    <td colSpan={2} className="p-2.5 text-sm font-bold text-right">Day Total:</td>
                    <td className="p-2.5 text-sm text-center font-bold text-emerald-500">+{dayTotal}</td>
                    <td></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Total Returns (filtered):</span>
          <strong className="text-xl text-emerald-500">{totalFiltered}</strong>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Bottle Return">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select User *</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} required className="w-full p-3 border border-slate-200 rounded-xl text-base bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100">
                <option value="">Choose a user...</option>
                {sorted.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bottles Out with User</label>
              <div className={`p-3 rounded-lg font-semibold ${
                !userId ? "bg-amber-100 text-amber-800" : selectedBottlesOut > 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
              }`}>
                {!userId
                  ? "Select a user to see bottles out"
                  : selectedBottlesOut > 0
                    ? `${selectedBottlesOut} bottles currently out with ${selectedUser?.name}`
                    : `No bottles currently out with ${selectedUser?.name}`}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Return Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full p-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Number of Bottles Returned *</label>
              <QuantitySelector value={bottles} onChange={setBottles} max={500} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about the return..." className="w-full p-3 border border-slate-200 rounded-xl text-base min-h-[80px] resize-y focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-slate-50 font-medium hover:bg-slate-100 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-medium hover:shadow-lg transition-all">Record Return</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message="This will permanently delete this return record."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
