import { useState } from "react";
import { Users, Droplets, Package, Clock, RotateCcw, Minus, Plus, Check } from "lucide-react";
import type { User, Delivery, Return } from "../types";
import {
  formatDate,
  getDeliveriesByDate,
  getTodayBottleCount,
  getMonthBottleCount,
  getTotalBottlesOut,
  getPendingDeliveries,
  getUserBottlesOut,
  addUser,
  addDelivery,
  addReturn,
  findUser,
} from "../store";
import { Modal } from "./Modal";
import { QuantitySelector } from "./QuantitySelector";

interface DashboardProps {
  users: User[];
  deliveries: Delivery[];
  returns: Return[];
  isOnline: boolean;
  onDataChange: (deliveries: Delivery[], returns: Return[]) => void;
  onAddUser: (user: User) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export function Dashboard({
  users,
  deliveries,
  returns,
  isOnline,
  onDataChange,
  onAddUser,
  showToast,
}: DashboardProps) {
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkName, setBulkName] = useState("");
  const [bulkPhone, setBulkPhone] = useState("");
  const [bulkAddress, setBulkAddress] = useState("");
  const [bulkBottles, setBulkBottles] = useState(5);
  const [bulkPrice, setBulkPrice] = useState(20);
  const [bulkDate, setBulkDate] = useState(formatDate(new Date()));
  const [bulkNotes, setBulkNotes] = useState("");
  const [pendingInputs, setPendingInputs] = useState<
    Record<string, { deliver: number; ret: number }>
  >({});
  const today = formatDate(new Date());
  const todayDeliveries = getDeliveriesByDate(deliveries, today);
  const pending = getPendingDeliveries(users, deliveries);
  const sorted = [...pending].sort((a, b) => a.name.localeCompare(b.name));

  function getInputs(userId: string) {
    if (pendingInputs[userId]) return pendingInputs[userId];
    const user = findUser(users, userId);
    const bottlesOut = getUserBottlesOut(deliveries, returns, userId);
    return { deliver: user?.defaultBottles ?? 1, ret: bottlesOut > 0 ? bottlesOut : 0 };
  }

  function setInput(userId: string, field: "deliver" | "ret", value: number) {
    const current = getInputs(userId);
    setPendingInputs((prev) => ({
      ...prev,
      [userId]: { ...current, [field]: value },
    }));
  }

  function quickAction(userId: string) {
    const { deliver, ret } = getInputs(userId);
    const user = findUser(users, userId);
    if (!user) return;
    if (deliver === 0 && ret === 0) {
      showToast("Enter delivery or return quantity", "error");
      return;
    }
    const bottlesOut = getUserBottlesOut(deliveries, returns, userId);
    if (ret > bottlesOut) {
      showToast(`Can't return more than ${bottlesOut} bottles`, "error");
      return;
    }

    let newDeliveries = deliveries;
    let newReturns = returns;
    const messages: string[] = [];

    if (deliver > 0) {
      const d = addDelivery(newDeliveries, {
        userId,
        date: today,
        bottles: deliver,
        price: user.price ?? 20,
        notes: "Quick delivery",
      }, isOnline);
      newDeliveries = [...newDeliveries, d];
      messages.push(`${deliver} delivered`);
    }
    if (ret > 0) {
      const r = addReturn(newReturns, {
        userId,
        date: today,
        bottles: ret,
        notes: "Quick return",
      }, isOnline);
      newReturns = [...newReturns, r];
      messages.push(`${ret} returned`);
    }
    onDataChange(newDeliveries, newReturns);
    setPendingInputs((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    showToast(`${user.name}: ${messages.join(", ")}!`, "success");
  }

  function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newUser = addUser(users, {
      name: bulkName,
      phone: bulkPhone,
      address: bulkAddress,
      defaultBottles: bulkBottles,
      price: bulkPrice,
      active: false,
    }, isOnline);
    onAddUser(newUser);

    const d = addDelivery(deliveries, {
      userId: newUser.id,
      date: bulkDate,
      bottles: bulkBottles,
      price: bulkPrice,
      notes: bulkNotes || "Bulk order",
    }, isOnline);
    onDataChange([...deliveries, d], returns);
    showToast(`Bulk order: ${bulkBottles} bottle(s) for ${bulkName}!`, "success");
    setBulkOpen(false);
    setBulkName("");
    setBulkPhone("");
    setBulkAddress("");
    setBulkDate(formatDate(new Date()));
    setBulkBottles(5);
    setBulkPrice(20);
    setBulkNotes("");
  }

  const stats = [
    { icon: <Users size={28} className="text-sky-500" />, value: users.length, label: "Total Users" },
    { icon: <Droplets size={28} className="text-sky-500" />, value: getTodayBottleCount(deliveries), label: "Today's Bottles" },
    { icon: <Package size={28} className="text-sky-500" />, value: getMonthBottleCount(deliveries), label: "This Month" },
    { icon: <Clock size={28} className="text-sky-500" />, value: pending.length, label: "Pending Today" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
            {s.icon}
            <div>
              <h3 className="text-2xl font-bold text-sky-500">{s.value}</h3>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl p-4 flex items-center gap-3 shadow-sm mb-4">
        <RotateCcw size={28} className="text-amber-600" />
        <div>
          <h3 className="text-2xl font-bold text-amber-600">
            {getTotalBottlesOut(deliveries, returns)}
          </h3>
          <p className="text-xs text-amber-800">Bottles Out (Not Returned)</p>
        </div>
      </div>

      <button
        onClick={() => setBulkOpen(true)}
        className="w-full mb-4 py-3.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all"
      >
        📦 Bulk / Special Order
      </button>

      <h2 className="text-lg font-semibold mb-3">Pending Deliveries</h2>
      {sorted.length === 0 ? (
        <p className="text-center py-8 text-slate-500 text-sm">
          All deliveries completed!
        </p>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {sorted.map((user) => {
            const inputs = getInputs(user.id);
            const bottlesOut = getUserBottlesOut(deliveries, returns, user.id);
            return (
              <div
                key={user.id}
                className="bg-white rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-2"
              >
                <div className="flex-1 min-w-[70px]">
                  <h4 className="text-sm font-semibold flex items-center flex-wrap gap-1">
                    {user.name}
                    {bottlesOut > 0 && (
                      <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[0.65rem] font-semibold">
                        🔄{bottlesOut}
                      </span>
                    )}
                  </h4>
                  <p className="text-emerald-500 font-semibold text-xs">
                    ₹{user.price ?? 20}/bottle
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[0.6rem] text-sky-500 font-semibold w-12">📦 Deliver</span>
                      <button type="button" onClick={() => setInput(user.id, "deliver", Math.max(0, inputs.deliver - 1))} className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-sky-50 active:scale-95"><Minus size={14} /></button>
                      <input
                        type="number"
                        value={inputs.deliver}
                        onChange={(e) => setInput(user.id, "deliver", Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                        className="w-10 text-center font-bold text-base border border-slate-200 rounded-md py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button type="button" onClick={() => setInput(user.id, "deliver", Math.min(100, inputs.deliver + 1))} className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-sky-50 active:scale-95"><Plus size={14} /></button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[0.6rem] text-emerald-500 font-semibold w-12">📥 Return</span>
                      <button type="button" onClick={() => setInput(user.id, "ret", Math.max(0, inputs.ret - 1))} className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-sky-50 active:scale-95"><Minus size={14} /></button>
                      <input
                        type="number"
                        value={inputs.ret}
                        onChange={(e) => setInput(user.id, "ret", Math.max(0, Math.min(bottlesOut, parseInt(e.target.value) || 0)))}
                        className="w-10 text-center font-bold text-base border border-slate-200 rounded-md py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button type="button" onClick={() => setInput(user.id, "ret", Math.min(bottlesOut, inputs.ret + 1))} className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center hover:bg-sky-50 active:scale-95"><Plus size={14} /></button>
                    </div>
                  </div>
                  <button
                    onClick={() => quickAction(user.id)}
                    className="bg-gradient-to-br from-sky-500 to-sky-600 text-white p-2 rounded-xl hover:shadow-lg transition-all"
                  >
                    <Check size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3 mt-6">Recent Deliveries</h2>
      {todayDeliveries.length === 0 ? (
        <p className="text-center py-8 text-slate-500 text-sm">
          No deliveries yet today
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {todayDeliveries
            .slice(-5)
            .reverse()
            .map((d) => {
              const user = findUser(users, d.userId);
              const price = d.price || (user?.price ?? 20);
              return (
                <div key={d.id} className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-semibold">{user?.name ?? "Unknown User"}</h4>
                    <p className="text-xs text-emerald-500 font-semibold">₹{price}/bottle</p>
                  </div>
                  <div className="flex flex-col items-center bg-sky-50 px-3 py-2 rounded-xl">
                    <span className="text-xl font-bold text-sky-500">{d.bottles}</span>
                    <small className="text-[0.625rem] text-slate-500">bottles</small>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Bulk Order Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk / Special Order">
        <form onSubmit={handleBulkSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name *</label>
              <input type="text" required value={bulkName} onChange={(e) => setBulkName(e.target.value)} placeholder="Enter customer name" className="w-full p-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input type="tel" required value={bulkPhone} onChange={(e) => setBulkPhone(e.target.value)} placeholder="Enter phone number" className="w-full p-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address (Optional)</label>
              <textarea value={bulkAddress} onChange={(e) => setBulkAddress(e.target.value)} placeholder="Enter address" className="w-full p-3 border border-slate-200 rounded-xl text-base min-h-[80px] resize-y focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Date *</label>
              <input type="date" required value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Number of Bottles *</label>
              <QuantitySelector value={bulkBottles} onChange={setBulkBottles} max={500} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price per Bottle (₹)</label>
              <QuantitySelector value={bulkPrice} onChange={setBulkPrice} min={1} max={1000} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
              <textarea value={bulkNotes} onChange={(e) => setBulkNotes(e.target.value)} placeholder="Special instructions..." className="w-full p-3 border border-slate-200 rounded-xl text-base min-h-[80px] resize-y focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setBulkOpen(false)} className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-slate-50 font-medium hover:bg-slate-100 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3.5 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white font-medium hover:shadow-lg transition-all">Add Order</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
