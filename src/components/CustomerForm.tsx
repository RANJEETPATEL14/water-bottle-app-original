import { useState } from "react";
import { Contact } from "lucide-react";
import { useApp } from "../context";
import { findUser, DEFAULT_GROUP_ID } from "../store";
import { pickContact, contactsSupported } from "../contacts";
import type { Frequency, Shift } from "../types";
import { ScreenHeader, Field, inputClass, Segmented, SHIFT_OPTIONS, Avatar } from "./ui";

export function CustomerForm({ id }: { id?: string }) {
  const { customers, groups, addCustomer, updateCustomer, back, showToast } = useApp();
  const existing = id ? findUser(customers, id) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [sameBilling, setSameBilling] = useState(!existing?.billingPhone);
  const [billingPhone, setBillingPhone] = useState(existing?.billingPhone ?? "");
  const [groupId, setGroupId] = useState(existing?.groupId ?? groups[0]?.id ?? DEFAULT_GROUP_ID);
  const [address, setAddress] = useState(existing?.address ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [gst, setGst] = useState(existing?.gst ?? "");
  const [shift, setShift] = useState<Shift>(existing?.shift ?? "morning");
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency ?? "daily");
  const [defaultBottles, setDefaultBottles] = useState(existing?.defaultBottles ?? 1);
  const [price, setPrice] = useState(existing?.price ?? 20);
  const [openingDue, setOpeningDue] = useState(existing?.openingDue ?? 0);
  const [securityDeposit, setSecurityDeposit] = useState(existing?.securityDeposit ?? 0);

  async function importContact() {
    if (!contactsSupported()) {
      showToast("Contact picker isn't supported on this device/browser", "error");
      return;
    }
    const c = await pickContact();
    if (!c) return;
    if (c.name) setName(c.name);
    if (c.tel) setPhone(c.tel.replace(/\s+/g, ""));
    showToast("Contact imported", "success");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Customer name is required", "error");
      return;
    }
    const data = {
      name: name.trim(),
      phone: phone.trim(),
      billingPhone: sameBilling ? undefined : billingPhone.trim(),
      groupId,
      address: address.trim(),
      email: email.trim(),
      gst: gst.trim(),
      shift,
      frequency,
      defaultBottles,
      price,
      openingDue,
      securityDeposit,
      active: existing?.active ?? true,
    };
    if (existing) {
      updateCustomer(existing.id, data);
      showToast("Customer updated", "success");
    } else {
      addCustomer(data);
      showToast("Customer created", "success");
    }
    back();
  }

  return (
    <div className="pb-8">
      <ScreenHeader title={existing ? "Edit Customer" : "Create Customer"} />
      <div className="bg-sky-500 flex justify-center pb-6">
        <div className="bg-white rounded-full p-1">
          <Avatar size={80} />
        </div>
      </div>

      <form onSubmit={submit} className="bg-white -mt-4 rounded-t-3xl p-5 space-y-5">
        <Field label="Full Name" required>
          <div className="flex items-center gap-2">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            <button
              type="button"
              onClick={importContact}
              aria-label="Pick from contacts"
              className="shrink-0 w-10 h-10 rounded-lg bg-sky-500 text-white flex items-center justify-center active:scale-95"
            >
              <Contact size={20} />
            </button>
          </div>
        </Field>
        <Field label="Mobile No">
          <input
            className={inputClass}
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>

        <label className="flex items-center justify-between gap-3 text-sm text-sky-600">
          <span>Set billing mobile number same as mobile number</span>
          <input
            type="checkbox"
            checked={sameBilling}
            onChange={(e) => setSameBilling(e.target.checked)}
            className="w-5 h-5 accent-sky-500"
          />
        </label>
        {!sameBilling && (
          <Field label="Billing Mobile No">
            <input
              className={inputClass}
              inputMode="tel"
              value={billingPhone}
              onChange={(e) => setBillingPhone(e.target.value)}
            />
          </Field>
        )}

        <Field label="Customer group" required>
          <select
            className={inputClass}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Address">
          <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="GST number">
          <input className={inputClass} value={gst} onChange={(e) => setGst(e.target.value)} />
        </Field>

        <Field label="Select Shift">
          <Segmented options={SHIFT_OPTIONS} value={shift} onChange={setShift} />
        </Field>
        <Field label="Delivery Frequency">
          <Segmented
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
            ]}
            value={frequency}
            onChange={(v) => setFrequency(v as Frequency)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Default Jars">
            <input
              className={inputClass}
              type="number"
              value={defaultBottles}
              onChange={(e) => setDefaultBottles(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </Field>
          <Field label="Rate (₹)">
            <input
              className={inputClass}
              type="number"
              value={price}
              onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </Field>
          <Field label="Opening Amount (₹)">
            <input
              className={inputClass}
              type="number"
              value={openingDue}
              onChange={(e) => setOpeningDue(parseInt(e.target.value) || 0)}
            />
          </Field>
          <Field label="Security Deposit (₹)">
            <input
              className={inputClass}
              type="number"
              value={securityDeposit}
              onChange={(e) => setSecurityDeposit(parseInt(e.target.value) || 0)}
            />
          </Field>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold mt-2"
        >
          {existing ? "Update Customer" : "Create Customer"}
        </button>
      </form>
    </div>
  );
}
