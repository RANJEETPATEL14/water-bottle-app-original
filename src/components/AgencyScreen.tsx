import { useState } from "react";
import { Store, Landmark, QrCode, PenLine, Settings, MapPin } from "lucide-react";
import { useApp } from "../context";
import type { Agency } from "../types";
import { ScreenHeader, Field, inputClass } from "./ui";
import { Modal } from "./Modal";

type Section = null | "profile" | "bank" | "upi";

export function AgencyScreen() {
  const { agency, saveAgency, showToast } = useApp();
  const [tab, setTab] = useState<"agency" | "user">("agency");
  const [section, setSection] = useState<Section>(null);
  const [draft, setDraft] = useState<Agency>(agency);

  function openSection(s: Section) {
    setDraft(agency);
    setSection(s);
  }
  function save() {
    saveAgency(draft);
    showToast("Saved", "success");
    setSection(null);
  }
  const set = (patch: Partial<Agency>) => setDraft((d) => ({ ...d, ...patch }));

  const items = [
    { icon: Store, title: "Agency Profile", sub: "Agency Profile Details", action: () => openSection("profile") },
    { icon: Landmark, title: "Bank Details", sub: "Bank Basic Details", action: () => openSection("bank") },
    { icon: QrCode, title: "UPI Details", sub: "Upi Basic Details", action: () => openSection("upi") },
    { icon: PenLine, title: "Agency Additional Detail", sub: "Add agency additional details", action: () => openSection("profile") },
    { icon: Settings, title: "Agency Settings", sub: "Manage agency settings", action: () => showToast("Settings saved locally", "success") },
    { icon: MapPin, title: "Agency Location", sub: "Update Agency Location", action: () => openSection("profile") },
  ];

  return (
    <div className="pb-8">
      <ScreenHeader title="" />
      <div className="bg-sky-500 flex flex-col items-center pb-4 -mt-2">
        <div className="w-20 h-20 rounded-full border-4 border-white bg-white flex items-center justify-center text-3xl">
          🏪
        </div>
        <p className="text-white font-semibold mt-2">Agency</p>
        <div className="flex w-full mt-3">
          {(["agency", "user"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 pb-2 text-sm font-medium border-b-2 ${
                tab === t ? "border-white text-white" : "border-transparent text-white/70"
              }`}
            >
              {t === "agency" ? "Agency Profile" : "User Profile"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-t-3xl -mt-3 px-4 pt-2">
        {tab === "agency" ? (
          items.map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.title}
                onClick={it.action}
                className="w-full flex items-center gap-4 py-4 border-b border-slate-100 text-left"
              >
                <Icon size={24} className="text-sky-500 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{it.title}</h3>
                  <p className="text-xs text-slate-400">{it.sub}</p>
                </div>
                <span className="text-slate-300">›</span>
              </button>
            );
          })
        ) : (
          <div className="py-6 space-y-1">
            <p className="text-slate-800 font-semibold">{agency.ownerName}</p>
            <p className="text-sm text-slate-400">{agency.ownerPhone || "No phone set"}</p>
            <p className="text-sm text-slate-400">{agency.email || "No email set"}</p>
            <button
              onClick={() => openSection("profile")}
              className="mt-4 px-5 py-2 rounded-xl bg-sky-500 text-white text-sm font-medium"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      <Modal open={section === "profile"} onClose={() => setSection(null)} title="Agency Profile">
        <div className="space-y-5">
          <Field label="Agency Name"><input className={inputClass} value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Owner Name"><input className={inputClass} value={draft.ownerName} onChange={(e) => set({ ownerName: e.target.value })} /></Field>
          <Field label="Owner Phone"><input className={inputClass} value={draft.ownerPhone} onChange={(e) => set({ ownerPhone: e.target.value })} /></Field>
          <Field label="Address"><input className={inputClass} value={draft.address} onChange={(e) => set({ address: e.target.value })} /></Field>
          <Field label="Email"><input className={inputClass} value={draft.email} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="GST"><input className={inputClass} value={draft.gst} onChange={(e) => set({ gst: e.target.value })} /></Field>
          <button onClick={save} className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">Save</button>
        </div>
      </Modal>

      <Modal open={section === "bank"} onClose={() => setSection(null)} title="Bank Details">
        <div className="space-y-5">
          <Field label="Bank Name"><input className={inputClass} value={draft.bankName} onChange={(e) => set({ bankName: e.target.value })} /></Field>
          <Field label="Account Number"><input className={inputClass} value={draft.accountNumber} onChange={(e) => set({ accountNumber: e.target.value })} /></Field>
          <Field label="IFSC"><input className={inputClass} value={draft.ifsc} onChange={(e) => set({ ifsc: e.target.value })} /></Field>
          <button onClick={save} className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">Save</button>
        </div>
      </Modal>

      <Modal open={section === "upi"} onClose={() => setSection(null)} title="UPI Details">
        <div className="space-y-5">
          <Field label="UPI ID"><input className={inputClass} value={draft.upiId} onChange={(e) => set({ upiId: e.target.value })} placeholder="name@bank" /></Field>
          <button onClick={save} className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">Save</button>
        </div>
      </Modal>
    </div>
  );
}
