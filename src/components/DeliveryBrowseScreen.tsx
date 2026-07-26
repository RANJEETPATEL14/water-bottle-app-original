import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronRight as Chev, QrCode, Search } from "lucide-react";
import { useApp } from "../context";
import {
  findGroup,
  getDeliveriesByDate,
  formatDate,
  formatDisplayDate,
} from "../store";
import type { Shift } from "../types";
import { SHIFT_OPTIONS, Avatar } from "./ui";
import { CustomerPicker } from "./CustomerPicker";

type Tab = "single" | "bulk" | "monthly" | "past";
type Status = "all" | "delivered" | "pending";

const TABS: { value: Tab; label: string }[] = [
  { value: "single", label: "Single Delivery" },
  { value: "bulk", label: "Bulk Delivery" },
  { value: "monthly", label: "Monthly Card" },
  { value: "past", label: "Past Deliveries" },
];

export function DeliveryBrowseScreen() {
  const { customers, groups, deliveries, navigate, back } = useApp();
  const [tab, setTab] = useState<Tab>("single");
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState<string>("all");
  const [status, setStatus] = useState<Status>("all");
  const [date, setDate] = useState(formatDate(new Date()));
  const [shift, setShift] = useState<Shift>("morning");
  const [picker, setPicker] = useState(false);

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(formatDate(d));
  }

  const deliveredIds = useMemo(
    () => new Set(getDeliveriesByDate(deliveries, date).map((d) => String(d.userId))),
    [deliveries, date],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((c) => (groupId === "all" ? true : String(c.groupId) === groupId))
      .filter((c) => {
        if (status === "delivered") return deliveredIds.has(String(c.id));
        if (status === "pending") return !deliveredIds.has(String(c.id));
        return true;
      })
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, groupId, status, deliveredIds, query]);

  function openCustomer(id: string) {
    if (tab === "monthly") navigate({ name: "monthly", customerId: id });
    else navigate({ name: "delivery", customerId: id });
  }

  return (
    <div className="pb-6">
      {/* Blue header with search + tabs */}
      <header className="bg-sky-500 text-white px-4 pt-4 pb-0">
        <div className="flex items-center gap-3">
          <button onClick={back} className="w-9 h-9 rounded-full border border-white/70 flex items-center justify-center">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-sky-400/60 rounded-full px-4 py-2">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/80 text-white"
            />
          </div>
        </div>
        <div className="flex mt-3 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                if (t.value === "past") return navigate({ name: "deliveries" });
                setTab(t.value);
              }}
              className={`flex-1 min-w-fit px-3 pb-2 text-xs font-medium whitespace-nowrap border-b-2 ${
                tab === t.value ? "border-white text-white" : "border-transparent text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-3">
        {/* Group + Delivery By */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <p className="text-xs text-sky-500 font-medium mb-1">Group Name</p>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full text-sm text-slate-800 outline-none bg-transparent"
            >
              <option value="all">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setPicker(true)}
            className="bg-white rounded-2xl p-3 shadow-sm text-left flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-sky-500 font-medium mb-1">Delivery By *</p>
              <p className="text-sm text-slate-400">Select</p>
            </div>
            <Chev size={18} className="text-slate-300" />
          </button>
        </div>

        {/* Customer select shortcut */}
        <button onClick={() => setPicker(true)} className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <span className="text-sky-500 font-medium">Customer Name *</span>
          <Chev size={18} className="text-slate-300" />
        </button>

        {/* Delivery status */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <p className="text-xs text-sky-500 font-medium mb-2">Delivery Status</p>
          <div className="flex gap-2">
            {([
              { value: "all", label: "All" },
              { value: "delivered", label: "Delivered" },
              { value: "pending", label: "Not Delivered" },
            ] as { value: Status; label: string }[]).map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                  status === s.value ? "bg-sky-500 text-white border-sky-500" : "bg-white text-sky-500 border-sky-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date + shift */}
        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center font-semibold text-sky-500 text-sm">{formatDisplayDate(date)}</div>
          <button onClick={() => shiftDate(1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronRight size={18} />
          </button>
          <select
            value={shift}
            onChange={(e) => setShift(e.target.value as Shift)}
            className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-sky-500 font-medium"
          >
            {SHIFT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* QR scan card */}
        <button
          onClick={() => setPicker(true)}
          className="w-full bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center gap-3"
        >
          <QrCode size={120} className="text-sky-500" strokeWidth={1.2} />
          <span className="text-sky-500 font-medium">Tap to scan.</span>
        </button>

        {/* Customer list */}
        <div className="space-y-2">
          {list.map((c) => {
            const done = deliveredIds.has(String(c.id));
            const group = findGroup(groups, c.groupId);
            return (
              <button
                key={c.id}
                onClick={() => openCustomer(c.id)}
                className="w-full bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 text-left"
              >
                <Avatar size={40} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate leading-tight">{c.name}</h3>
                  <p className="text-xs text-slate-400">{group?.name ?? "—"}</p>
                </div>
                <span
                  className={`text-[0.65rem] font-semibold px-2 py-0.5 rounded-full ${
                    done ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {done ? "Delivered" : "Pending"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <CustomerPicker open={picker} onClose={() => setPicker(false)} onPick={openCustomer} />
    </div>
  );
}
