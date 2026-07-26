import { useMemo, useState } from "react";
import { Phone, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { ScreenHeader, SearchBar, Fab, Field, inputClass, EmptyState, Avatar } from "./ui";
import { Modal } from "./Modal";

const ROLES = ["Delivery Boy", "Manager", "Accountant", "Supervisor", "Other"];

export function EmployeesScreen() {
  const { employees, addEmployee, deleteEmployee, showToast } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(ROLES[0]!);
  const [otpChannel, setOtpChannel] = useState<"sms" | "whatsapp">("sms");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees
      .filter((e) => !q || e.name.toLowerCase().includes(q) || e.phone.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, query]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Employee name is required", "error");
      return;
    }
    addEmployee({ name: name.trim(), phone: phone.trim(), role, otpChannel });
    showToast("Employee added", "success");
    setOpen(false);
    setName("");
    setPhone("");
    setRole(ROLES[0]!);
    setOtpChannel("sms");
  }

  return (
    <div className="pb-24">
      <ScreenHeader title="Employees" />
      <div className="p-4 space-y-3">
        <SearchBar value={query} onChange={setQuery} />
        {list.length === 0 ? (
          <EmptyState message="No employees yet. Add your delivery staff and managers." />
        ) : (
          list.map((emp) => (
            <div key={emp.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <Avatar />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{emp.name}</h3>
                <p className="text-xs text-slate-400">{emp.role}</p>
                {emp.phone && <p className="text-xs text-slate-400">{emp.phone}</p>}
              </div>
              {emp.phone && (
                <a href={`tel:${emp.phone}`} className="text-sky-500">
                  <Phone size={20} />
                </a>
              )}
              <button
                onClick={() => { deleteEmployee(emp.id); showToast("Employee removed", "success"); }}
                className="text-slate-300 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <Fab onClick={() => setOpen(true)} />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Employee">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Full Name" required>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Mobile No" required>
            <input className={inputClass} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Employee Role" required>
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <div>
            <p className="text-xs text-slate-500 mb-2">
              Choose how the employee should receive the verification OTP after you save.
            </p>
            <div className="flex rounded-full border border-sky-300 overflow-hidden">
              {(["sms", "whatsapp"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setOtpChannel(c)}
                  className={`flex-1 py-2.5 text-sm font-semibold ${
                    otpChannel === c ? "bg-sky-500 text-white" : "bg-white text-sky-500"
                  }`}
                >
                  {c === "sms" ? "SMS" : "Whatsapp"}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">
            Add Employee
          </button>
        </form>
      </Modal>
    </div>
  );
}
