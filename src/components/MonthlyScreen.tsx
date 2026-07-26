import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { useApp } from "../context";
import { findUser, findProduct, getDeliveriesByUser } from "../store";
import { ScreenHeader, Avatar, EmptyState } from "./ui";
import { CustomerPicker } from "./CustomerPicker";

export function MonthlyScreen({ customerId }: { customerId?: string }) {
  const { customers, products, deliveries, agency, showToast } = useApp();
  const [selectedId, setSelectedId] = useState<string | undefined>(customerId);
  const [picker, setPicker] = useState(false);
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const customer = selectedId ? findUser(customers, selectedId) : undefined;

  const monthLabel = new Date(ym.year, ym.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function stepMonth(delta: number) {
    setYm((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const rows = useMemo(() => {
    if (!customer) return [];
    return getDeliveriesByUser(deliveries, customer.id)
      .filter((d) => {
        const dd = new Date(d.date);
        return dd.getFullYear() === ym.year && dd.getMonth() === ym.month;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [customer, deliveries, ym]);

  // Per-product totals for the month
  const totals = useMemo(() => {
    const map = new Map<string, { delivered: number; received: number }>();
    for (const p of products) map.set(p.id, { delivered: 0, received: 0 });
    for (const d of rows) {
      for (const item of d.items ?? []) {
        const cur = map.get(item.productId) ?? { delivered: 0, received: 0 };
        cur.delivered += item.delivered;
        cur.received += item.received;
        map.set(item.productId, cur);
      }
    }
    return map;
  }, [rows, products]);

  function exportPdf() {
    if (!customer) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(agency.name, 14, 18);
    doc.setFontSize(11);
    doc.text(`Monthly Statement — ${monthLabel}`, 14, 26);
    doc.text(`Customer: ${customer.name}`, 14, 34);
    doc.text(`Mobile: ${customer.phone}`, 14, 40);

    let y = 52;
    doc.setFontSize(11);
    doc.text("Product", 14, y);
    doc.text("Delivered", 90, y);
    doc.text("Received", 140, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 7;
    totals.forEach((v, pid) => {
      const p = findProduct(products, pid);
      if (!p) return;
      doc.text(p.name, 14, y);
      doc.text(String(v.delivered), 90, y);
      doc.text(String(v.received), 140, y);
      y += 7;
    });

    y += 4;
    doc.line(14, y, 196, y);
    y += 8;
    doc.text("Date-wise deliveries", 14, y);
    y += 7;
    rows.forEach((d) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const label = new Date(d.date).toLocaleDateString("en-GB");
      doc.text(`${label}  ·  ${d.shift}  ·  ${d.bottles} jar(s)  ·  Rs.${d.amount.toFixed(0)}`, 14, y);
      y += 7;
    });

    doc.save(`${customer.name}-${monthLabel}.pdf`);
    showToast("PDF downloaded", "success");
  }

  return (
    <div className="pb-8">
      <ScreenHeader
        title="Monthly Details"
        right={
          customer ? (
            <button onClick={exportPdf} className="p-2 flex items-center gap-1 text-white">
              <FileDown size={20} />
              <span className="text-xs font-semibold">PDF</span>
            </button>
          ) : undefined
        }
      />

      <div className="p-4 space-y-4">
        <button onClick={() => setPicker(true)} className="w-full text-left bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs text-sky-500 font-medium">Customer Name *</p>
          <h3 className="font-semibold text-slate-800">{customer ? customer.name : "Select customer"}</h3>
        </button>

        <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2">
          <button onClick={() => stepMonth(-1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center font-semibold text-sky-500">{monthLabel}</div>
          <button onClick={() => stepMonth(1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center">
            <ChevronRight size={18} />
          </button>
        </div>

        {!customer ? (
          <EmptyState message="Select a customer to view their monthly card." />
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800">{customer.name}</h3>
                  <p className="text-sm text-slate-400">{customer.phone}</p>
                </div>
                <Avatar size={52} />
              </div>

              <table className="w-full mt-4 text-sm">
                <thead>
                  <tr className="bg-sky-500 text-white">
                    <th className="text-left px-3 py-2 rounded-l-lg font-medium">Product</th>
                    <th className="px-2 py-2 font-medium">Total Delivered</th>
                    <th className="px-2 py-2 rounded-r-lg font-medium">Total Received</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const t = totals.get(p.id) ?? { delivered: 0, received: 0 };
                    return (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="px-3 py-2 text-slate-700">{p.name}</td>
                        <td className="px-2 py-2 text-center">{t.delivered}</td>
                        <td className="px-2 py-2 text-center">{t.received}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-sky-500 text-white grid grid-cols-5 text-xs font-medium">
                <span className="px-2 py-2">Date</span>
                <span className="px-1 py-2 text-center">Shift</span>
                <span className="px-1 py-2 text-center">Dlvd</span>
                <span className="px-1 py-2 text-center">Rcvd</span>
                <span className="px-1 py-2 text-center">Amount</span>
              </div>
              {rows.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-6">No transactions this month.</p>
              ) : (
                rows.map((d) => {
                  const rcvd = (d.items ?? []).reduce((s, i) => s + i.received, 0);
                  return (
                    <div key={d.id} className="grid grid-cols-5 text-sm border-b border-slate-100">
                      <span className="px-2 py-2 text-slate-600">
                        {new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                      <span className="px-1 py-2 text-center capitalize text-slate-500 text-xs">{d.shift}</span>
                      <span className="px-1 py-2 text-center">{d.bottles}</span>
                      <span className="px-1 py-2 text-center">{rcvd}</span>
                      <span className="px-1 py-2 text-center text-slate-700">₹{d.amount.toFixed(0)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      <CustomerPicker open={picker} onClose={() => setPicker(false)} onPick={setSelectedId} />
    </div>
  );
}
