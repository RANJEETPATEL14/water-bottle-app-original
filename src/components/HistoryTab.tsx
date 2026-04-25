import { useState, useMemo, useCallback } from "react";
import { Share2, Download } from "lucide-react";
import type { User, Delivery } from "../types";
import { formatDisplayDate, findUser } from "../store";

interface HistoryTabProps {
  users: User[];
  deliveries: Delivery[];
  showToast: (msg: string, type: "success" | "error") => void;
}

export function HistoryTab({ users, deliveries, showToast }: HistoryTabProps) {
  const [filterUser, setFilterUser] = useState("");
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = useMemo(() => {
    let result = deliveries;
    if (filterUser) result = result.filter((d) => String(d.userId) === filterUser);
    if (filterMonth) {
      const [y, m] = filterMonth.split("-").map(Number);
      result = result.filter((d) => {
        const date = new Date(d.date);
        return date.getFullYear() === y && date.getMonth() === (m ?? 0) - 1;
      });
    }
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [deliveries, filterUser, filterMonth]);

  const totalBottles = filtered.reduce((s, d) => s + Number(d.bottles), 0);
  const totalAmount = filtered.reduce((s, d) => {
    const price = d.price || (findUser(users, d.userId)?.price ?? 20);
    return s + Number(d.bottles) * price;
  }, 0);

  const grouped = useMemo(() => {
    const map: Record<string, Delivery[]> = {};
    for (const d of filtered) {
      if (!map[d.date]) map[d.date] = [];
      map[d.date]!.push(d);
    }
    return map;
  }, [filtered]);

  const generatePdf = useCallback(async () => {
    if (!filterMonth) {
      showToast("Please select a month first", "error");
      return;
    }
    if (filtered.length === 0) {
      showToast("No deliveries found", "error");
      return;
    }

    const [year, month] = filterMonth.split("-").map(Number);
    const monthName = new Date(year!, (month ?? 1) - 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const selectedUser = filterUser ? findUser(users, filterUser) : null;
    const billTitle = selectedUser ? `Bill for ${selectedUser.name}` : "Monthly Bill - All Customers";
    const fileName = selectedUser
      ? `Bill_${selectedUser.name.replace(/\s+/g, "_")}_${monthName.replace(/\s+/g, "_")}.pdf`
      : `Bill_All_Customers_${monthName.replace(/\s+/g, "_")}.pdf`;

    const sortedForBill = [...filtered].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const billGrouped: Record<string, Delivery[]> = {};
    for (const d of sortedForBill) {
      if (!billGrouped[d.date]) billGrouped[d.date] = [];
      billGrouped[d.date]!.push(d);
    }

    let billRows = "";
    let rowIdx = 0;
    for (const [date, items] of Object.entries(billGrouped)) {
      for (const d of items) {
        const user = findUser(users, d.userId);
        const price = d.price || (user?.price ?? 20);
        const amount = Number(d.bottles) * price;
        const displayDate = new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        const bgColor = rowIdx % 2 === 0 ? "#ffffff" : "#f8fafc";
        billRows += `<tr style="background:${bgColor};">
          <td style="padding:10px 12px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9;">${displayDate}</td>
          ${!filterUser ? `<td style="padding:10px 12px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9;">${user?.name ?? "One-time"}</td>` : ""}
          <td style="padding:10px 12px;font-size:13px;color:#334155;text-align:center;border-bottom:1px solid #f1f5f9;">${d.bottles}</td>
          <td style="padding:10px 12px;font-size:13px;color:#334155;text-align:right;border-bottom:1px solid #f1f5f9;">₹${price}</td>
          <td style="padding:10px 12px;font-size:13px;color:#1e293b;text-align:right;font-weight:600;border-bottom:1px solid #f1f5f9;">₹${amount}</td>
        </tr>`;
        rowIdx++;
      }
    }

    const invoiceNo = `INV-${filterMonth!.replace("-", "")}-${Date.now().toString().slice(-4)}`;
    const generatedDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

    const container = document.createElement("div");
    container.style.cssText = "position:absolute;left:-9999px;top:0;width:595px;background:white;";
    container.innerHTML = `
      <div style="font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#1e293b;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #0ea5e9;">
          <div>
            <h1 style="font-size:28px;font-weight:800;margin:0;color:#0ea5e9;letter-spacing:-0.5px;">💧 Water Supply</h1>
            <p style="color:#64748b;font-size:13px;margin:4px 0 0 0;">Quality water delivery service</p>
          </div>
          <div style="text-align:right;">
            <p style="font-size:22px;font-weight:700;color:#1e293b;margin:0;">INVOICE</p>
            <p style="color:#64748b;font-size:12px;margin:4px 0 0 0;">${invoiceNo}</p>
            <p style="color:#64748b;font-size:12px;margin:2px 0 0 0;">${generatedDate}</p>
          </div>
        </div>

        <!-- Bill Info -->
        <div style="display:flex;justify-content:space-between;margin-bottom:24px;">
          <div style="flex:1;">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin:0 0 6px 0;font-weight:600;">Bill To</p>
            ${selectedUser ? `
              <p style="font-size:16px;font-weight:700;margin:0 0 4px 0;">${selectedUser.name}</p>
              <p style="color:#64748b;font-size:13px;margin:2px 0;">${selectedUser.phone}</p>
              ${selectedUser.address ? `<p style="color:#64748b;font-size:13px;margin:2px 0;">${selectedUser.address}</p>` : ""}
            ` : `<p style="font-size:16px;font-weight:700;margin:0;">All Customers</p>`}
          </div>
          <div style="text-align:right;">
            <p style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin:0 0 6px 0;font-weight:600;">Period</p>
            <p style="font-size:16px;font-weight:700;margin:0;">${monthName}</p>
            ${selectedUser ? `<p style="color:#64748b;font-size:13px;margin:4px 0 0 0;">Rate: ₹${selectedUser.price ?? 20}/bottle</p>` : ""}
          </div>
        </div>

        <!-- Table -->
        <table style="width:100%;border-collapse:separate;border-spacing:0;margin-bottom:24px;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
          <thead><tr>
            <th style="background:#f1f5f9;padding:12px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Date</th>
            ${!filterUser ? '<th style="background:#f1f5f9;padding:12px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Customer</th>' : ""}
            <th style="background:#f1f5f9;padding:12px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Qty</th>
            <th style="background:#f1f5f9;padding:12px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Rate</th>
            <th style="background:#f1f5f9;padding:12px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600;border-bottom:2px solid #e2e8f0;">Amount</th>
          </tr></thead>
          <tbody>
            ${billRows}
          </tbody>
        </table>

        <!-- Summary -->
        <div style="display:flex;justify-content:flex-end;">
          <div style="width:220px;">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;">
              <span style="color:#64748b;font-size:14px;">Total Bottles</span>
              <span style="font-weight:600;font-size:14px;">${totalBottles}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:12px 0;margin-top:4px;background:#0ea5e9;border-radius:8px;padding:12px 16px;">
              <span style="color:white;font-size:15px;font-weight:600;">Total Due</span>
              <span style="color:white;font-size:18px;font-weight:800;">₹${totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align:center;margin-top:36px;padding-top:16px;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:11px;margin:0;">Thank you for your business!</p>
        </div>
      </div>`;
    document.body.appendChild(container);
    showToast("Generating PDF...", "success");

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(container, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(container);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.75), "JPEG", 0, 0, imgWidth, imgHeight);
      const pdfBlob = pdf.output("blob");
      return { pdfBlob, fileName, billTitle, monthName };
    } catch (err) {
      console.error("PDF generation error:", err);
      if (container.parentNode) document.body.removeChild(container);
      showToast("Error generating PDF", "error");
      return null;
    }
  }, [filterMonth, filterUser, filtered, users, totalBottles, totalAmount, showToast]);

  const downloadBill = useCallback(async () => {
    const result = await generatePdf();
    if (!result) return;
    const url = URL.createObjectURL(result.pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
    showToast("PDF downloaded!", "success");
  }, [generatePdf, showToast]);

  const shareBill = useCallback(async () => {
    const result = await generatePdf();
    if (!result) return;
    const pdfFile = new File([result.pdfBlob], result.fileName, { type: "application/pdf" });
    if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
      await navigator.share({ files: [pdfFile], title: result.billTitle, text: `Water Supply Bill - ${result.monthName}` });
      showToast("Bill shared successfully!", "success");
    } else {
      const url = URL.createObjectURL(result.pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);
      showToast("PDF downloaded!", "success");
    }
  }, [generatePdf, showToast]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Delivery History</h2>
        <div className="flex gap-2">
          <button
            onClick={downloadBill}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white text-xs font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            <Download size={14} /> Download
          </button>
          <button
            onClick={shareBill}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white text-xs font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Bottles</p>
          <p className="text-2xl font-bold text-sky-500 mt-1">{totalBottles}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Total Amount</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">₹{totalAmount.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="flex-1 p-2.5 border border-slate-200 rounded-xl text-base bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100">
          <option value="">All Users</option>
          {sorted.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="flex-1 p-2.5 border border-slate-200 rounded-xl text-base bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-slate-400 text-sm">No deliveries found for selected filters</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateKey, items]) => {
            const dayTotal = items.reduce((s, d) => s + Number(d.bottles), 0);
            const dayAmount = items.reduce((s, d) => {
              const price = d.price || (findUser(users, d.userId)?.price ?? 20);
              return s + Number(d.bottles) * price;
            }, 0);
            return (
              <div key={dateKey} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <span className="text-sm font-semibold text-slate-700">{formatDisplayDate(dateKey)}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{dayTotal} bottles</span>
                    <span className="text-sm font-bold text-emerald-500">₹{dayAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map((d) => {
                    const user = findUser(users, d.userId);
                    const price = d.price || (user?.price ?? 20);
                    const amount = Number(d.bottles) * price;
                    return (
                      <div key={d.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{user?.name ?? "Unknown"}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{d.bottles} × ₹{price}</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-500">₹{amount.toLocaleString("en-IN")}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
