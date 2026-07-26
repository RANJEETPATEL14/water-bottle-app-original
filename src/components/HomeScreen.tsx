import { useState } from "react";
import {
  Menu,
  UserCircle,
  Truck,
  UserPlus,
  HandCoins,
  Receipt,
  ShoppingBasket,
  Umbrella,
  Users,
  Warehouse,
  WifiOff,
  CalendarClock,
  FileText,
  UserCog,
  MessageSquare,
  CalendarDays,
  BadgeCheck,
  Palmtree,
  BarChart3,
  Headphones,
  Globe,
  RefreshCw,
  Cloud,
  Smartphone,
} from "lucide-react";
import { useApp, type Route } from "../context";
import { SideDrawer } from "./SideDrawer";

interface Module {
  icon: typeof Truck;
  label: string;
  route: Route;
  color?: string;
}

const quickActions: Module[] = [
  { icon: Truck, label: "Create Delivery", route: { name: "delivery" } },
  { icon: UserPlus, label: "Create Customer", route: { name: "customerForm" } },
  { icon: HandCoins, label: "Create Payment", route: { name: "payment" } },
  { icon: Receipt, label: "Create Expense", route: { name: "expenses" } },
];

const modules: Module[] = [
  { icon: ShoppingBasket, label: "Products", route: { name: "products" } },
  { icon: Umbrella, label: "Groups", route: { name: "groups" } },
  { icon: Users, label: "Customers", route: { name: "customers" } },
  { icon: Warehouse, label: "Load/Unload", route: { name: "inventory" } },
  { icon: Truck, label: "Deliveries", route: { name: "deliveries" } },
  { icon: WifiOff, label: "Offline Mode", route: { name: "simple", key: "offline" } },
  { icon: CalendarClock, label: "Monthly Card", route: { name: "monthly" } },
  { icon: HandCoins, label: "Payments", route: { name: "payments" } },
  { icon: FileText, label: "Invoices", route: { name: "invoices" } },
  { icon: Receipt, label: "Expenses", route: { name: "expenses" } },
  { icon: UserCog, label: "Employees", route: { name: "simple", key: "employees" } },
  { icon: MessageSquare, label: "Messages", route: { name: "messages" } },
  { icon: CalendarDays, label: "Event", route: { name: "simple", key: "event" } },
  { icon: BadgeCheck, label: "Membership", route: { name: "simple", key: "membership" } },
  { icon: Palmtree, label: "Leaves", route: { name: "simple", key: "leaves" } },
  { icon: BarChart3, label: "Reports", route: { name: "reports" } },
  { icon: Headphones, label: "Support", route: { name: "simple", key: "support" } },
  { icon: Globe, label: "Website", route: { name: "simple", key: "website" } },
];

export function HomeScreen() {
  const { agency, navigate, isOnline, refresh } = useApp();
  const [tab, setTab] = useState<"dashboard" | "business">("dashboard");
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="pb-4">
      {/* Header */}
      <header className="bg-sky-500 text-white px-4 pt-3 pb-0">
        <div className="flex items-center justify-between">
          <button onClick={() => setDrawer(true)} className="p-1">
            <Menu size={26} />
          </button>
          <div className="text-center flex-1">
            <p className="text-xs text-white/80">Welcome back,</p>
            <h1 className="text-lg font-bold leading-tight">{agency.name}</h1>
          </div>
          <button onClick={() => navigate({ name: "agency" })} className="p-1">
            <UserCircle size={26} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 mt-1">
          <button onClick={refresh} className="text-[0.65rem] flex items-center gap-1 opacity-90">
            {isOnline ? (
              <>
                <Cloud size={11} /> Cloud Sync
              </>
            ) : (
              <>
                <Smartphone size={11} /> Local
              </>
            )}
            <RefreshCw size={10} className="ml-1" />
          </button>
        </div>

        <div className="flex mt-3">
          {(["dashboard", "business"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 ${
                tab === t ? "border-white text-white" : "border-transparent text-white/70"
              }`}
            >
              {t === "dashboard" ? "DASHBOARD" : "My Business"}
            </button>
          ))}
        </div>
      </header>

      {tab === "dashboard" ? (
        <div className="p-4">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-5">
            <h2 className="font-bold text-slate-800 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.route)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className="relative w-14 h-14 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Icon size={26} className="text-slate-700" />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center">
                        +
                      </span>
                    </div>
                    <span className="text-[0.65rem] text-center leading-tight text-slate-600">
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module grid */}
          <div className="grid grid-cols-3 gap-3">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.label}
                  onClick={() => navigate(m.route)}
                  className="bg-white rounded-2xl py-5 px-2 shadow-sm flex flex-col items-center gap-2 hover:shadow-md active:scale-95 transition-all"
                >
                  <Icon size={30} className="text-slate-700" />
                  <span className="text-xs text-center text-slate-600 leading-tight">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <BusinessTab />
      )}

      <SideDrawer open={drawer} onClose={() => setDrawer(false)} />
    </div>
  );
}

function BusinessTab() {
  const { customers, deliveries, returns, payments } = useApp();
  return (
    <div className="p-4 space-y-3">
      <StatCard label="Total Customers" value={customers.length} />
      <StatCard label="Total Deliveries" value={deliveries.length} />
      <StatCard label="Total Returns" value={returns.length} />
      <StatCard label="Payments Recorded" value={payments.length} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="text-2xl font-bold text-sky-500">{value}</span>
    </div>
  );
}
