import { useState } from "react";
import { TruckIcon, PackageCheck, ClipboardCheck, Boxes } from "lucide-react";
import { useApp } from "../context";
import { ScreenHeader, Field, inputClass } from "./ui";
import { Modal } from "./Modal";

type Mode = null | "in" | "out" | "list";

export function InventoryScreen() {
  const { products, updateProduct, showToast } = useApp();
  const [mode, setMode] = useState<Mode>(null);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState(0);

  function apply(direction: "in" | "out") {
    const p = products.find((x) => x.id === productId);
    if (!p || qty <= 0) {
      showToast("Enter a valid quantity", "error");
      return;
    }
    const next = direction === "in" ? p.stockBalance + qty : Math.max(0, p.stockBalance - qty);
    updateProduct(p.id, { stockBalance: next });
    showToast(`${direction === "in" ? "Loaded in" : "Loaded out"} ${qty} × ${p.name}`, "success");
    setMode(null);
    setQty(0);
  }

  const tiles = [
    { icon: TruckIcon, label: "Load In", onClick: () => setMode("in"), flip: false },
    { icon: TruckIcon, label: "Load Out", onClick: () => setMode("out"), flip: true },
    { icon: ClipboardCheck, label: "Inventory Product Details", onClick: () => setMode("list") },
    { icon: Boxes, label: "Inventory List", onClick: () => setMode("list") },
  ];

  return (
    <div className="pb-8">
      <ScreenHeader title="Inventory" />
      <div className="p-4 grid grid-cols-2 gap-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.label}
              onClick={t.onClick}
              className="bg-white rounded-2xl aspect-square shadow-sm flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <Icon size={44} className={`${t.flip ? "text-red-500 -scale-x-100" : "text-teal-500"}`} />
              <span className="text-sm text-slate-600 text-center px-2">{t.label}</span>
            </button>
          );
        })}
      </div>

      <Modal open={mode === "in" || mode === "out"} onClose={() => setMode(null)} title={mode === "in" ? "Load In" : "Load Out"}>
        <div className="space-y-5">
          <Field label="Product">
            <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock: {p.stockBalance})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity">
            <input className={inputClass} type="number" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 0)} />
          </Field>
          <button
            onClick={() => apply(mode === "in" ? "in" : "out")}
            className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold"
          >
            {mode === "in" ? "Load In" : "Load Out"}
          </button>
        </div>
      </Modal>

      <Modal open={mode === "list"} onClose={() => setMode(null)} title="Inventory List">
        <div className="divide-y divide-slate-100">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <PackageCheck size={20} className="text-sky-500" />
                <div>
                  <p className="font-semibold text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.capacity}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sky-500">{p.stockBalance}</p>
                <p className="text-[0.65rem] text-slate-400">in stock</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
