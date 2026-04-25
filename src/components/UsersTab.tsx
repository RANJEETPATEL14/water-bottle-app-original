import { useState } from "react";
import { Pencil, Trash2, Pause, Play } from "lucide-react";
import type { User, Delivery, Return } from "../types";
import { addUser, updateUser, deleteUser as deleteUserStore, getUserBottlesOut, findUser } from "../store";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { QuantitySelector } from "./QuantitySelector";

interface UsersTabProps {
  users: User[];
  deliveries: Delivery[];
  returns: Return[];
  isOnline: boolean;
  onUsersChange: (users: User[]) => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

export function UsersTab({
  users,
  deliveries,
  returns,
  isOnline,
  onUsersChange,
  showToast,
}: UsersTabProps) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [defaultBottles, setDefaultBottles] = useState(1);
  const [price, setPrice] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const deleteUser = deleteTarget ? findUser(users, deleteTarget) : null;

  const filtered = search.trim()
    ? users.filter((u) => {
        const q = search.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.phone.includes(search) ||
          u.address.toLowerCase().includes(q)
        );
      })
    : users;

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  function openModal(userId?: string) {
    if (userId) {
      const user = findUser(users, userId);
      if (!user) return;
      setEditingId(userId);
      setName(user.name);
      setPhone(user.phone);
      setAddress(user.address);
      setDefaultBottles(user.defaultBottles);
      setPrice(user.price ?? 20);
    } else {
      setEditingId(null);
      setName("");
      setPhone("");
      setAddress("");
      setDefaultBottles(1);
      setPrice(20);
    }
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      defaultBottles,
      price,
    };
    if (editingId) {
      const updated = updateUser(users, editingId, data, isOnline);
      onUsersChange(updated);
      showToast("User updated successfully!", "success");
    } else {
      const newUser = addUser(users, { ...data, active: true }, isOnline);
      onUsersChange([...users, newUser]);
      showToast("User added successfully!", "success");
    }
    setModalOpen(false);
  }

  function toggleActive(id: string) {
    const user = findUser(users, id);
    if (!user) return;
    const newStatus = user.active === false;
    const updated = updateUser(users, id, { active: newStatus }, isOnline);
    onUsersChange(updated);
    showToast(`${user.name} ${newStatus ? "activated" : "deactivated"}!`, "success");
  }

  function handleDelete(id: string) {
    setDeleteTarget(id);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const updated = deleteUserStore(users, deleteTarget, isOnline);
    onUsersChange(updated);
    showToast("User deleted successfully!", "success");
    setDeleteTarget(null);
  }

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Manage Users</h2>
        <button
          onClick={() => openModal()}
          className="px-5 py-2.5 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 text-white text-sm font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all"
        >
          + Add User
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
        />
      </div>

      {sorted.length === 0 ? (
        <p className="text-center py-8 text-slate-500 text-sm">No users added yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((user) => {
            const bottlesOut = getUserBottlesOut(deliveries, returns, user.id);
            const isActive = user.active !== false;
            return (
              <div
                key={user.id}
                className={`bg-white rounded-xl p-4 shadow-sm flex justify-between items-start ${!isActive ? "opacity-60" : ""}`}
              >
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2 flex-wrap">
                    {user.name}
                    <span className={`text-[0.7rem] font-semibold px-2 py-0.5 rounded-full ${isActive ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </h3>
                  <p className="text-sm text-slate-500">📞 {user.phone}</p>
                  <p className="text-sm text-slate-500">📍 {user.address || "-"}</p>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="bg-sky-50 text-sky-500 text-[0.7rem] font-medium px-2 py-0.5 rounded-full">
                      Default: {user.defaultBottles} bottles/day
                    </span>
                    <span className="bg-emerald-50 text-emerald-600 text-[0.7rem] font-medium px-2 py-0.5 rounded-full">
                      ₹{user.price ?? 20}/bottle
                    </span>
                    <span className={`text-[0.7rem] font-semibold px-2 py-0.5 rounded-full ${bottlesOut > 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                      {bottlesOut > 0 ? `🔄 ${bottlesOut} out` : "✓ 0 out"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 ml-2">
                  <button
                    onClick={() => toggleActive(user.id)}
                    title={isActive ? "Deactivate" : "Activate"}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${isActive ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}
                  >
                    {isActive ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button
                    onClick={() => openModal(user.id)}
                    title="Edit"
                    className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center hover:scale-110 transition-all"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    title="Delete"
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:scale-110 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit User" : "Add New User"}
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" className="w-full p-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" className="w-full p-3 border border-slate-200 rounded-xl text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address (Optional)</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address" className="w-full p-3 border border-slate-200 rounded-xl text-base min-h-[80px] resize-y focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Default Daily Bottles</label>
              <QuantitySelector value={defaultBottles} onChange={setDefaultBottles} max={50} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price per Bottle (₹)</label>
              <QuantitySelector value={price} onChange={setPrice} min={1} max={1000} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-slate-200 bg-slate-50 font-medium hover:bg-slate-100 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3.5 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white font-medium hover:shadow-lg transition-all">Save User</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={deleteUser ? `This will permanently delete "${deleteUser.name}".` : ""}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
