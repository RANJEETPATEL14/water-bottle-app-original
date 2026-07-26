import { useState } from "react";
import { useApp } from "../context";
import { ScreenHeader, Avatar } from "./ui";

export function NewGroupScreen() {
  const { customers, groups, addGroup, updateCustomer, back, showToast } = useApp();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function create() {
    if (!name.trim()) {
      showToast("Enter a group name", "error");
      return;
    }
    const group = addGroup({ name: name.trim(), createdBy: "Agency Owner" });
    selected.forEach((id) => updateCustomer(id, { groupId: group.id }));
    showToast(`Group "${group.name}" created`, "success");
    back();
  }

  const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="pb-28">
      <ScreenHeader title="New Group" />
      <div className="p-5">
        <label className="block text-sm font-medium text-sky-600 mb-1">
          Enter Group Name <span className="text-red-500">*</span>
        </label>
        <input
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.target.value)}
          className="w-full border-0 border-b-2 border-slate-200 pb-2 outline-none focus:border-sky-500 text-base"
        />
        <div className="text-right text-xs text-slate-400 mt-1">{name.length}/50</div>

        <div className="flex justify-center my-4">
          <span className="bg-sky-500 text-white px-6 py-2 rounded-full text-sm font-medium">
            Select Customers ({selected.size})
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {sorted.map((c) => {
            const g = groups.find((x) => x.id === c.groupId);
            const checked = selected.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className="w-full flex items-center gap-3 py-3 text-left"
              >
                <Avatar />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 leading-tight">{c.name}</h3>
                  <p className="text-xs text-slate-400">{g?.name ?? "—"}</p>
                  <p className="text-xs text-slate-400">{c.phone}</p>
                </div>
                <span
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    checked ? "bg-sky-500 border-sky-500 text-white" : "border-sky-300"
                  }`}
                >
                  {checked && "✓"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-3 bg-white border-t border-slate-200 z-30">
        <button onClick={create} className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">
          Create Group
        </button>
      </div>
    </div>
  );
}
