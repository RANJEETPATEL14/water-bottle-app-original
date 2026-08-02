import { useMemo, useState } from "react";
import { Umbrella, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { getGroupDues, DEFAULT_GROUP_ID } from "../store";
import { ScreenHeader, SearchBar, Fab, DuesRow, EmptyState } from "./ui";
import { ConfirmDialog } from "./ConfirmDialog";

export function GroupsScreen() {
  const { groups, customers, deliveries, returns, payments, navigate, deleteGroup, showToast } = useApp();
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((g) => !q || g.name.toLowerCase().includes(q));
  }, [groups, query]);

  return (
    <div className="pb-24">
      <ScreenHeader title="Groups" />
      <div className="p-4 space-y-3">
        <SearchBar value={query} onChange={setQuery} />
        {list.length === 0 ? (
          <EmptyState message="No groups found." />
        ) : (
          list.map((g) => {
            const dues = getGroupDues(g, customers, deliveries, returns, payments);
            return (
              <div key={g.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => navigate({ name: "groupDetail", id: g.id })}
                    className="flex items-start gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                      <Umbrella size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 leading-tight">{g.name}</h3>
                      <p className="text-xs text-slate-400">Created By: {g.createdBy}</p>
                    </div>
                    <div className="text-center pl-2">
                      <div className="font-bold text-slate-800">{dues.customerCount}</div>
                      <div className="text-[0.65rem] text-slate-400">Customers</div>
                    </div>
                  </button>
                  {g.id !== DEFAULT_GROUP_ID && (
                    <button onClick={() => setConfirmId(g.id)} className="text-slate-300 hover:text-red-500 pl-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => navigate({ name: "groupDetail", id: g.id })}
                  className="block w-full border-t border-slate-100 mt-3"
                >
                  <DuesRow dues={dues} variant="group" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <Fab onClick={() => navigate({ name: "newGroup" })} />

      <ConfirmDialog
        open={!!confirmId}
        message="Delete this group? Customers stay but lose this grouping."
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) deleteGroup(confirmId);
          setConfirmId(null);
          showToast("Group deleted", "success");
        }}
      />
    </div>
  );
}
