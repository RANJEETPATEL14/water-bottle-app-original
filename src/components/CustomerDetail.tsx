import {
  UserCog,
  Package,
  HandCoins,
  Truck,
  ShieldCheck,
  FileText,
  Pencil,
  Trash2,
  CalendarClock,
} from "lucide-react";
import { useApp } from "../context";
import { findUser, findGroup, getCustomerDues, money } from "../store";
import { ScreenHeader, Avatar } from "./ui";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

export function CustomerDetail({ id }: { id: string }) {
  const { customers, groups, deliveries, returns, payments, navigate, back, deleteCustomer, showToast } = useApp();
  const customer = findUser(customers, id);
  const [confirm, setConfirm] = useState(false);

  if (!customer) {
    return (
      <div>
        <ScreenHeader title="Customer" />
        <p className="p-8 text-center text-slate-400">Customer not found.</p>
      </div>
    );
  }

  const dues = getCustomerDues(customer, deliveries, returns, payments);
  const group = findGroup(groups, customer.groupId);

  const menu = [
    { icon: UserCog, title: "Profile", sub: "Update customer basic details", action: () => navigate({ name: "customerForm", id }) },
    { icon: Package, title: "Customer Products", sub: "Assign specific product to customer with specific rate.", action: () => showToast(`${customer.name} rate: ${money(customer.price)}/jar`, "success") },
    { icon: HandCoins, title: "Opening Amount", sub: "Add opening balance details for this customer", action: () => showToast(`Opening amount: ${money(customer.openingDue)}`, "success") },
    { icon: Truck, title: "Opening Delivery", sub: "Add previous delivered products for which you need to receive empty container.", action: () => navigate({ name: "delivery", customerId: id }) },
    { icon: ShieldCheck, title: "Security Deposit", sub: "Add security deposit for this customer", action: () => showToast(`Security deposit: ${money(customer.securityDeposit)}`, "success") },
    { icon: FileText, title: "Customer Invoice Preference", sub: "Set customer invoice preference.", action: () => navigate({ name: "invoices" }) },
  ];

  const bottomTabs = [
    { icon: UserCog, label: "Details", action: () => {} },
    { icon: HandCoins, label: "Payment", action: () => navigate({ name: "payment", customerId: id }) },
    { icon: FileText, label: "Invoice", action: () => navigate({ name: "invoices" }) },
    { icon: CalendarClock, label: "Monthly", action: () => navigate({ name: "monthly", customerId: id }) },
    { icon: Truck, label: "Delivery", action: () => navigate({ name: "delivery", customerId: id }) },
  ];

  return (
    <div className="pb-20">
      <ScreenHeader
        title=""
        right={
          <div className="flex gap-2">
            <button onClick={() => navigate({ name: "customerForm", id })} className="p-2">
              <Pencil size={18} />
            </button>
            <button onClick={() => setConfirm(true)} className="p-2">
              <Trash2 size={18} />
            </button>
          </div>
        }
      />

      {/* Profile card */}
      <div className="px-4 -mt-2">
        <div className="bg-white rounded-2xl p-4 shadow-md relative overflow-hidden">
          {customer.active && (
            <div className="absolute top-3 -right-8 bg-emerald-500 text-white text-[0.65rem] font-semibold px-8 py-0.5 rotate-45">
              Active
            </div>
          )}
          <div className="flex items-center gap-3">
            <Avatar size={64} />
            <div className="min-w-0">
              <h2 className="font-bold text-lg text-slate-800 leading-tight">{customer.name}</h2>
              <p className="text-sm text-slate-400">{customer.phone}</p>
              <p className="text-sm text-slate-400">{group?.name ?? "—"}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x divide-slate-100 mt-4">
            {[
              { label: "Balance Jar", value: String(dues.balanceJar), color: "text-sky-500" },
              { label: "Past Due", value: money(dues.pastDue), color: "text-slate-800" },
              { label: "Current Due", value: money(dues.currentDue), color: "text-slate-800" },
              { label: "Total Due", value: money(dues.totalDue), color: "text-red-500" },
            ].map((c) => (
              <div key={c.label} className="text-center px-1">
                <div className={`font-bold text-sm ${c.color}`}>{c.value}</div>
                <div className="text-[0.65rem] text-slate-400 mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 mt-3 overflow-hidden flex">
            <div className="bg-red-400 h-full" style={{ width: "70%" }} />
            <div className="bg-amber-400 h-full" style={{ width: "15%" }} />
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 mt-4">
        {menu.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.title}
              onClick={m.action}
              className="w-full flex items-center gap-4 py-4 border-b border-slate-100 text-left"
            >
              <Icon size={26} className="text-sky-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800">{m.title}</h3>
                <p className="text-xs text-slate-400">{m.sub}</p>
              </div>
              <span className="text-slate-300">›</span>
            </button>
          );
        })}
      </div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-slate-200 flex z-30">
        {bottomTabs.map((t, i) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              onClick={t.action}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 ${
                i === 0 ? "text-sky-500" : "text-slate-400"
              }`}
            >
              <Icon size={20} />
              <span className="text-[0.6rem]">{t.label}</span>
            </button>
          );
        })}
      </div>

      <ConfirmDialog
        open={confirm}
        message={`Delete ${customer.name}? This cannot be undone.`}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          deleteCustomer(id);
          setConfirm(false);
          showToast("Customer deleted", "success");
          back();
        }}
      />
    </div>
  );
}
