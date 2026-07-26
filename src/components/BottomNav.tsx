import { Wallet, Home, Store, QrCode, Settings } from "lucide-react";
import { useApp, type Route } from "../context";

const items: { icon: typeof Home; label: string; route: Route }[] = [
  { icon: Wallet, label: "Payments", route: { name: "payments" } },
  { icon: Home, label: "Home", route: { name: "home" } },
  { icon: Store, label: "Products", route: { name: "products" } },
  { icon: QrCode, label: "Scan", route: { name: "deliveryBrowse" } },
  { icon: Settings, label: "Agency", route: { name: "agency" } },
];

export function BottomNav() {
  const { route, navigate, goHome } = useApp();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-slate-200 flex z-30">
      {items.map((it) => {
        const active = route.name === it.route.name;
        const Icon = it.icon;
        return (
          <button
            key={it.label}
            onClick={() => (it.route.name === "home" ? goHome() : navigate(it.route))}
            className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 ${
              active ? "text-sky-500" : "text-slate-400"
            }`}
          >
            <Icon size={22} />
            {it.route.name === "home" && (
              <span className="text-[0.65rem] font-medium">Home</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
