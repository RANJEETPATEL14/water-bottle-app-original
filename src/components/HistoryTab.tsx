import { useState, useMemo, useCallback } from "react";
import { Share2 } from "lucide-react";
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

  const shareBill = useCallback(async () => {
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
    for (const [date, items] of Object.entries(billGrouped)) {
      for (const d of items) {
        const user = findUser(users, d.userId);
        const price = d.price || (user?.price ?? 20);
        const amount = Number(d.bottles) * price;
        const displayDate = new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        billRows += `<tr>
          <td>${displayDate}</td>
          ${!filterUser ? `<td>${user?.name ?? "One-time"}</td>` : ""}
          <td style="text-align:center;">${d.bottles}</td>
          <td style="text-align:right;">₹${price}</td>
          <td style="text-align:right;">₹${amount}</td>
        </tr>`;
      }
    }

    const container = document.createElement("div");
    container.style.cssText = "position:absolute;left:-9999px;top:0;width:595px;background:white;";
    container.innerHTML = `
      <div style="font-family:Arial,sans-serif;padding:20px;">
        <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #0ea5e9;padding-bottom:15px;">
          <h1 style="color:#0ea5e9;font-size:24px;margin:0 0 5px 0;">Water Supply</h1>
          <h2 style="font-size:18px;color:#333;margin:0 0 5px 0;">${billTitle}</h2>
          <p style="color:#666;font-size:14px;margin:0;">${monthName}</p>
        </div>
        ${selectedUser ? `<div style="background:#f8fafc;padding:15px;border-radius:8px;margin-bottom:20px;">
          <p style="margin:5px 0;"><strong>Customer:</strong> ${selectedUser.name}</p>
          <p style="margin:5px 0;"><strong>Phone:</strong> ${selectedUser.phone}</p>
          ${selectedUser.address ? `<p style="margin:5px 0;"><strong>Address:</strong> ${selectedUser.address}</p>` : ""}
          <p style="margin:5px 0;"><strong>Rate:</strong> ₹${selectedUser.price ?? 20} per bottle</p>
        </div>` : ""}
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead><tr>
            <th style="background:#0ea5e9;color:white;padding:10px 8px;text-align:left;font-size:14px;">Date</th>
            ${!filterUser ? '<th style="background:#0ea5e9;color:white;padding:10px 8px;text-align:left;font-size:14px;">Customer</th>' : ""}
            <th style="background:#0ea5e9;color:white;padding:10px 8px;text-align:center;font-size:14px;">Bottles</th>
            <th style="background:#0ea5e9;color:white;padding:10px 8px;text-align:right;font-size:14px;">Rate</th>
            <th style="background:#0ea5e9;color:white;padding:10px 8px;text-align:right;font-size:14px;">Amount</th>
          </tr></thead>
          <tbody>
            ${billRows}
            <tr style="background:#0ea5e9!important;color:white;font-weight:bold;">
              <td colspan="${filterUser ? 2 : 3}" style="padding:12px 8px;font-size:15px;text-align:right;border:none;">TOTAL:</td>
              <td style="padding:12px 8px;font-size:15px;text-align:center;border:none;color:white;">${totalBottles}</td>
              <td style="padding:12px 8px;font-size:15px;text-align:right;border:none;color:white;">₹${totalAmount}</td>
            </tr>
          </tbody>
        </table>
        <div style="text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;color:#666;font-size:12px;">
          <p>Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
          <p style="margin-top:5px;">Thank you for your business!</p>
        </div>
      </div>`;
    document.body.appendChild(container);
    showToast("Generating PDF...", "success");

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(container);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
      if (navigator.share && navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({ files: [pdfFile], title: billTitle, text: `Water Supply Bill - ${monthName}` });
        showToast("Bill shared successfully!", "success");
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        showToast("PDF downloaded!", "success");
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      if (container.parentNode) document.body.removeChild(container);
      showToast("Error generating PDF", "error");
    }
  }, [filterMonth, filterUser, filtered, users, totalBottles, totalAmount, showToast]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Delivery History</h2>
        <button
          onClick={shareBill}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white text-xs font-medium hover:-translate-y-0.5 hover:shadow-lg transition-all"
        >
          <Share2 size={14} /> Share Bill
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-base bg-white">
          <option value="">All Users</option>
          {sorted.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="flex-1 p-2.5 border border-slate-200 rounded-lg text-base bg-white" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-8 text-slate-500 text-sm">No delivery history for selected filters</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-sky-500 to-sky-600 text-white">
                <th className="p-3 text-left text-xs font-semibold">Date</th>
                <th className="p-3 text-left text-xs font-semibold">Customer</th>
                <th className="p-3 text-center text-xs font-semibold">Bottles</th>
                <th className="p-3 text-right text-xs font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([dateKey, items]) => {
                const dayTotal = items.reduce((s, d) => s + Number(d.bottles), 0);
                const dayAmount = items.reduce((s, d) => {
                  const price = d.price || (findUser(users, d.userId)?.price ?? 20);
                  return s + Number(d.bottles) * price;
                }, 0);
                return items.map((d, idx) => {
                  const user = findUser(users, d.userId);
                  const price = d.price || (user?.price ?? 20);
                  const amount = Number(d.bottles) * price;
                  return (
                    <tr key={d.id} className="border-b border-slate-100">
                      <td className="p-2.5 text-sm font-semibold text-sky-500 whitespace-nowrap">
                        {idx === 0 ? formatDisplayDate(dateKey) : ""}
                      </td>
                      <td className="p-2.5 text-sm font-medium">{user?.name ?? "Unknown"}</td>
                      <td className="p-2.5 text-sm text-center font-semibold">{d.bottles}</td>
                      <td className="p-2.5 text-sm text-right font-semibold text-emerald-500">₹{amount}</td>
                    </tr>
                  );
                }).concat(
                  <tr key={`total-${dateKey}`} className="bg-slate-50 border-t-2 border-sky-500">
                    <td colSpan={2} className="p-2.5 text-sm font-bold text-right">Day Total:</td>
                    <td className="p-2.5 text-sm text-center font-bold">{dayTotal}</td>
                    <td className="p-2.5 text-sm text-right font-bold text-emerald-500">₹{dayAmount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Total Bottles:</span>
          <strong className="text-xl text-sky-500">{totalBottles}</strong>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Total Amount:</span>
          <strong className="text-xl text-emerald-500">₹{totalAmount}</strong>
        </div>
      </div>
    </div>
  );
}
