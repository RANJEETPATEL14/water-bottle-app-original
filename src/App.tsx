import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Cloud, Smartphone } from "lucide-react";
import { loadAllData } from "./store";
import type { User, Delivery, Return, Tab } from "./types";
import { Toast } from "./components/Toast";
import { Dashboard } from "./components/Dashboard";
import { UsersTab } from "./components/UsersTab";
import { DeliveryTab } from "./components/DeliveryTab";
import { ReturnsTab } from "./components/ReturnsTab";
import { HistoryTab } from "./components/HistoryTab";

const tabs: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "users", label: "Users" },
  { id: "delivery", label: "Delivery" },
  { id: "returns", label: "Returns" },
  { id: "history", label: "History" },
];

export default function App() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    loadAllData().then((data) => {
      setUsers(data.users);
      setDeliveries(data.deliveries);
      setReturns(data.returns);
      setIsOnline(data.isOnline);
      setLoading(false);
    });
  }, []);

  async function refresh() {
    setLoading(true);
    const data = await loadAllData();
    setUsers(data.users);
    setDeliveries(data.deliveries);
    setReturns(data.returns);
    setIsOnline(data.isOnline);
    setLoading(false);
    showToast("Data refreshed!", "success");
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-br from-sky-500 to-sky-700 text-white p-4 pb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs flex items-center gap-1">
            {isOnline ? (
              <>
                <Cloud size={12} />
                <span className="text-emerald-300">Cloud Sync</span>
              </>
            ) : (
              <>
                <Smartphone size={12} />
                <span className="text-amber-300">Local Only</span>
              </>
            )}
          </span>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="bg-white/20 px-2.5 py-1 rounded-md text-xs flex items-center gap-1 hover:bg-white/30 transition-colors"
            >
              <RefreshCw size={12} /> Sync
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center">💧 Water Supply</h1>
        <p className="text-sm text-center opacity-90">{dateStr}</p>
      </header>

      {/* Navigation */}
      <nav className="flex bg-white border-b border-slate-200 sticky top-0 z-50 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 min-w-fit py-3.5 px-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
              tab === t.id
                ? "text-sky-500 border-sky-500"
                : "text-slate-500 border-transparent hover:bg-sky-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className={`p-4 pb-8 ${loading ? "opacity-70 pointer-events-none" : ""}`}>
        {tab === "dashboard" && (
          <Dashboard
            users={users}
            deliveries={deliveries}
            returns={returns}
            isOnline={isOnline}
            onDataChange={(d, r) => { setDeliveries(d); setReturns(r); }}
            onAddUser={(u) => setUsers((prev) => [...prev, u])}
            showToast={showToast}
          />
        )}
        {tab === "users" && (
          <UsersTab
            users={users}
            deliveries={deliveries}
            returns={returns}
            isOnline={isOnline}
            onUsersChange={setUsers}
            showToast={showToast}
          />
        )}
        {tab === "delivery" && (
          <DeliveryTab
            users={users}
            deliveries={deliveries}
            isOnline={isOnline}
            onDeliveriesChange={setDeliveries}
            showToast={showToast}
          />
        )}
        {tab === "returns" && (
          <ReturnsTab
            users={users}
            deliveries={deliveries}
            returns={returns}
            isOnline={isOnline}
            onReturnsChange={setReturns}
            showToast={showToast}
          />
        )}
        {tab === "history" && (
          <HistoryTab
            users={users}
            deliveries={deliveries}
            showToast={showToast}
          />
        )}
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
