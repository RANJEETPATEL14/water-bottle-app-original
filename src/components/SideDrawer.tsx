import {
  ShoppingBasket,
  Umbrella,
  Users,
  Warehouse,
  Truck,
  WifiOff,
  CalendarClock,
  HandCoins,
  FileText,
  Receipt,
  UserCog,
  MessageSquare,
  X,
} from "lucide-react";
import { useApp, type Route } from "../context";
import { Avatar } from "./ui";

const menu: { icon: typeof Users; label: string; route: Route }[] = [
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
];

export function SideDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { navigate, agency } = useApp();
  if (!open) return null;

  function go(route: Route) {
    onClose();
    navigate(route);
  }

  return (
    <div className="fixed inset-0 z-[900] flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />
      <div
        className="relative w-[78%] max-w-[320px] bg-white h-full overflow-y-auto animate-slide-in-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-sky-500 text-white p-5 pb-6">
          <div className="flex items-center justify-between">
            <p className="text-center flex-1 font-semibold">Agency Owner</p>
            <button onClick={onClose} className="p-1">
              <X size={20} />
            </button>
          </div>
          <div className="border-b border-white/30 my-3" />
          <div className="flex items-center gap-3">
            <Avatar size={56} />
            <div>
              <p className="font-bold text-lg leading-tight">{agency.ownerName}</p>
              {agency.ownerPhone && <p className="text-sm text-white/90">📱 {agency.ownerPhone}</p>}
            </div>
          </div>
        </div>
        <ul className="py-2">
          {menu.map((m) => {
            const Icon = m.icon;
            return (
              <li key={m.label}>
                <button
                  onClick={() => go(m.route)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-sky-50 text-slate-700"
                >
                  <Icon size={22} className="text-slate-700 shrink-0" />
                  <span className="flex-1 text-left text-[15px]">{m.label}</span>
                  <span className="text-slate-300">›</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
