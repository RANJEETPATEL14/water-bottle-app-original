import { useState } from "react";
import type { User, Delivery } from "../types";
import { formatDate, addDelivery, findUser } from "../store";
import { QuantitySelector } from "./QuantitySelector";

interface DeliveryTabProps {
  users: User[];
  deliveries: Delivery[];
  isOnline: boolean;
  onDeliveriesChange: (deliveries: Delivery[]) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export function DeliveryTab({
  users,
  deliveries,
  isOnline,
  onDeliveriesChange,
  showToast,
}: DeliveryTabProps) {
  const [userId, setUserId] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [bottles, setBottles] = useState(1);
  const [price, setPrice] = useState(20);
  const [notes, setNotes] = useState("");

  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));

  function handleUserChange(id: string) {
    setUserId(id);
    const user = findUser(users, id);
    if (user) {
      setBottles(user.defaultBottles || 1);
      setPrice(user.price ?? 20);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      showToast("Please select a user", "error");
      return;
    }
    const d = addDelivery(deliveries, { userId, date, bottles, price, notes }, isOnline);
    onDeliveriesChange([...deliveries, d]);
    const user = findUser(users, userId);
    showToast(`${bottles} bottle(s) added for ${user?.name}!`, "success");
    setUserId("");
    setBottles(1);
    setPrice(20);
    setNotes("");
  }

  return (
    <div className="">
      <h2 className="text-lg font-semibold mb-4">Add Daily Delivery</h2>
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select User</label>
            <select
              value={userId}
              onChange={(e) => handleUserChange(e.target.value)}
              required
              className="w-full p-3 border border-slate-200 rounded-xl text-base bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Choose a user...</option>
              {sorted.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Delivery Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full p-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of Bottles</label>
            <QuantitySelector value={bottles} onChange={setBottles} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price per Bottle (₹)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 20)}
              min={1}
              max={1000}
              className="w-full p-3 border border-slate-200 rounded-xl text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special notes..."
              className="w-full p-3 border border-slate-200 rounded-xl text-base min-h-[80px] resize-y focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all"
        >
          Add Delivery
        </button>
      </form>
    </div>
  );
}
