import { useMemo, useState } from "react";
import { Droplet, Trash2 } from "lucide-react";
import { useApp } from "../context";
import { getProductStats } from "../store";
import type { Product } from "../types";
import { ScreenHeader, SearchBar, Fab, Field, inputClass, EmptyState } from "./ui";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";

export function ProductsScreen() {
  const { products, deliveries, addProduct, updateProduct, deleteProduct, showToast } = useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [stockFor, setStockFor] = useState<Product | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [capacity, setCapacity] = useState("20 L");
  const [rate, setRate] = useState(20);
  const [stockAmt, setStockAmt] = useState(0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [products, query]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addProduct({ name: name.trim(), supplier: supplier.trim(), capacity: capacity.trim(), rate, balanceJar: 0, stockBalance: 0 });
    showToast("Product added", "success");
    setOpen(false);
    setName("");
    setSupplier("");
    setCapacity("20 L");
    setRate(20);
  }

  function saveStock() {
    if (!stockFor) return;
    updateProduct(stockFor.id, { stockBalance: stockFor.stockBalance + stockAmt });
    showToast(`Added ${stockAmt} to ${stockFor.name} stock`, "success");
    setStockFor(null);
    setStockAmt(0);
  }

  return (
    <div className="pb-24">
      <ScreenHeader title="Products" />
      <div className="p-4 space-y-3">
        <SearchBar value={query} onChange={setQuery} />
        {list.length === 0 ? (
          <EmptyState message="No products yet. Add your first jar type." />
        ) : (
          list.map((p) => {
            const stats = getProductStats(p, deliveries);
            return (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-full border-2 border-sky-200 flex items-center justify-center text-sky-400 shrink-0">
                    <Droplet size={26} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800">{p.name}</h3>
                    <p className="text-xs text-slate-400">{p.supplier}</p>
                    <p className="text-xs font-semibold text-sky-500 mt-0.5">Capacity:- {p.capacity}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-sky-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {p.rate.toFixed(1)}/-
                    </span>
                    <button onClick={() => setConfirmId(p.id)} className="text-slate-300 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center divide-x divide-slate-100 border-t border-slate-100 mt-3 pt-3">
                  <Metric value={stats.balanceJar} label="Balance Jar" />
                  <Metric value={stats.customerCount} label="Customer Count" />
                  <Metric value={p.stockBalance} label="Stock Balance" />
                  <div className="px-2">
                    <button
                      onClick={() => { setStockFor(p); setStockAmt(0); }}
                      className="w-full bg-sky-500 text-white text-sm font-medium py-2 rounded-lg"
                    >
                      Stock
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Fab onClick={() => setOpen(true)} />

      <Modal open={open} onClose={() => setOpen(false)} title="New Product">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Product Name" required>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Supplier / Brand">
            <input className={inputClass} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Capacity">
              <input className={inputClass} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </Field>
            <Field label="Rate (₹)">
              <input
                className={inputClass}
                type="number"
                value={rate}
                onChange={(e) => setRate(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </Field>
          </div>
          <button type="submit" className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">
            Add Product
          </button>
        </form>
      </Modal>

      <Modal open={!!stockFor} onClose={() => setStockFor(null)} title={`Add Stock — ${stockFor?.name ?? ""}`}>
        <div className="space-y-5">
          <Field label="Jars to add to stock">
            <input
              className={inputClass}
              type="number"
              value={stockAmt}
              onChange={(e) => setStockAmt(parseInt(e.target.value) || 0)}
            />
          </Field>
          <button onClick={saveStock} className="w-full py-3.5 rounded-xl bg-sky-500 text-white font-semibold">
            Update Stock
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmId}
        message="Delete this product?"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) deleteProduct(confirmId);
          setConfirmId(null);
          showToast("Product deleted", "success");
        }}
      />
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center px-1">
      <div className="font-bold text-sky-500">{value}</div>
      <div className="text-[0.6rem] text-slate-400 leading-tight">{label}</div>
    </div>
  );
}
