import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { formatDate, formatDisplayDate } from "../store";
import { ScreenHeader, SearchBar, Fab, Field, inputClass, EmptyState } from "./ui";
import { Modal } from "./Modal";

export function EventsScreen() {
  const { events, addEvent, deleteEvent, showToast } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isAgent, setIsAgent] = useState(true);
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [endDate, setEndDate] = useState(formatDate(new Date()));
  const [sameAddress, setSameAddress] = useState(false);
  const [eventAddress, setEventAddress] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => !q || e.eventName.toLowerCase().includes(q) || e.customerName.toLowerCase().includes(q))
      .sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
  }, [events, query]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !eventName.trim()) {
      showToast("Customer name and event name are required", "error");
      return;
    }
    addEvent({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      isAgent,
      eventName: eventName.trim(),
      startDate,
      endDate,
      eventAddress: (sameAddress ? customerAddress : eventAddress).trim(),
    });
    showToast("Event created", "success");
    setOpen(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setEventName("");
    setEventAddress("");
    setSameAddress(false);
  }

  return (
    <div className="pb-24">
      <ScreenHeader title="Event" />
      <div className="p-4 space-y-3">
        <SearchBar value={query} onChange={setQuery} />
        {list.length === 0 ? (
          <EmptyState message="No events yet. Create one to schedule bulk / catered deliveries." />
        ) : (
          list.map((ev) => (
            <div key={ev.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                  <CalendarDays size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{ev.eventName}</h3>
                  <p className="text-xs text-slate-400">{ev.customerName}{ev.customerPhone ? ` · ${ev.customerPhone}` : ""}</p>
                  <p className="text-xs text-sky-500 mt-0.5">
                    {formatDisplayDate(ev.startDate)} → {formatDisplayDate(ev.endDate)}
                  </p>
                  {ev.eventAddress && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {ev.eventAddress}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { deleteEvent(ev.id); showToast("Event deleted", "success"); }}
                  className="text-slate-300 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Fab onClick={() => setOpen(true)} />

      <Modal open={open} onClose={() => setOpen(false)} title="Create Event">
        <form onSubmit={submit} className="space-y-5">
          <p className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">Customer Details</p>
          <Field label="Name" required>
            <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </Field>
          <Field label="Mobile No.">
            <input className={inputClass} inputMode="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </Field>
          <Field label="Address">
            <input className={inputClass} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
          </Field>
          <label className="flex items-center justify-between">
            <span className="text-slate-700">Agent</span>
            <button
              type="button"
              onClick={() => setIsAgent((v) => !v)}
              className={`w-12 h-6 rounded-full relative transition-colors ${isAgent ? "bg-sky-500" : "bg-slate-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isAgent ? "left-6" : "left-0.5"}`} />
            </button>
          </label>

          <p className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">Event Details</p>
          <Field label="Event Name" required>
            <input className={inputClass} maxLength={50} value={eventName} onChange={(e) => setEventName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date" required>
              <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End date" required>
              <input className={inputClass} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>Set event address same as customer address</span>
            <input type="checkbox" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} className="w-5 h-5 accent-sky-500" />
          </label>
          {!sameAddress && (
            <Field label="Address">
              <input className={inputClass} value={eventAddress} onChange={(e) => setEventAddress(e.target.value)} />
            </Field>
          )}
          <button type="submit" className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">
            Create Event
          </button>
        </form>
      </Modal>
    </div>
  );
}
