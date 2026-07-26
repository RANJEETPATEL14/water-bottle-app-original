import { Printer, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { useApp } from "../context";
import { findUser, getCustomerInvoice, getInvoiceRef, money } from "../store";
import { ScreenHeader, Avatar } from "./ui";

export function InvoiceDetail({
  customerId,
  year,
  month,
}: {
  customerId: string;
  year: number;
  month: number;
}) {
  const { customers, deliveries, payments, products, agency, navigate, showToast } = useApp();
  const customer = findUser(customers, customerId);

  if (!customer) {
    return (
      <div>
        <ScreenHeader title="Invoice" />
        <p className="p-8 text-center text-slate-400">Customer not found.</p>
      </div>
    );
  }

  const ref = getInvoiceRef(customers, customerId);
  const invoice = getCustomerInvoice(customer, deliveries, payments, products, year, month, ref);
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const range = `${start.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} - ${end.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;

  function buildText() {
    const lines = invoice.lines
      .map((l) => `${l.name}  ${l.qty} x ${l.rate} = ₹${l.total.toFixed(2)}`)
      .join("\n");
    return (
      `${agency.name}\nInvoice Ref: ${ref}\n${customer!.name} (${customer!.phone})\n${range}\n\n` +
      `${lines}\n\nSub-total: ${money(invoice.subTotal)}\nPast Due: ${money(invoice.pastDue)}\n` +
      `Paid: ${money(invoice.paid)}\nAmount to Pay: ${money(invoice.amountToPay)}`
    );
  }

  async function share() {
    const text = buildText();
    if (navigator.share) {
      try {
        await navigator.share({ title: `Invoice ${ref}`, text });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("Invoice copied to clipboard", "success");
    } catch {
      showToast("Could not share invoice", "error");
    }
  }

  function printPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(agency.name, 14, 18);
    doc.setFontSize(11);
    doc.text(`Invoice Ref: ${ref}`, 14, 26);
    doc.text(`${customer!.name}  (${customer!.phone})`, 14, 33);
    doc.text(range, 14, 39);

    let y = 52;
    doc.text("Item", 14, y);
    doc.text("Qty", 110, y);
    doc.text("Rate", 140, y);
    doc.text("Total", 175, y);
    y += 3;
    doc.line(14, y, 196, y);
    y += 7;
    for (const l of invoice.lines) {
      doc.text(String(l.name), 14, y);
      doc.text(String(l.qty), 110, y);
      doc.text(l.rate.toFixed(2), 140, y);
      doc.text(l.total.toFixed(2), 175, y);
      y += 7;
    }
    y += 3;
    doc.line(14, y, 196, y);
    y += 8;
    doc.text(`Sub-total: ${invoice.subTotal.toFixed(2)}`, 120, y); y += 7;
    doc.text(`Past Due: ${invoice.pastDue.toFixed(2)}`, 120, y); y += 7;
    doc.text(`Paid: ${invoice.paid.toFixed(2)}`, 120, y); y += 7;
    doc.setFontSize(13);
    doc.text(`Amount to Pay: ${invoice.amountToPay.toFixed(2)}`, 120, y);
    doc.save(`Invoice-${ref}-${customer!.name}.pdf`);
    showToast("Invoice PDF downloaded", "success");
  }

  function sendMessage() {
    const text = encodeURIComponent(buildText());
    const phone = customer!.phone.replace(/\D/g, "");
    window.open(phone ? `https://wa.me/${phone}?text=${text}` : `sms:?body=${text}`, "_blank");
  }

  return (
    <div className="pb-24">
      <ScreenHeader
        title=""
        right={
          <button onClick={printPdf} className="p-2 text-white">
            <Printer size={20} />
          </button>
        }
      />
      <div className="bg-sky-500 flex flex-col items-center pb-10 -mt-2">
        <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-white">
          <FileText size={34} />
        </div>
        <p className="text-white font-semibold mt-2">Invoice</p>
      </div>

      <div className="px-4 -mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-md flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-slate-800">{customer.name}</h2>
            <p className="text-sm text-slate-500">{customer.phone}</p>
            <p className="text-sm text-slate-500">{range}</p>
            <p className="text-sm text-slate-500">Invoice Ref: {ref}</p>
          </div>
          <Avatar size={56} />
        </div>

        {/* Item table */}
        <div className="bg-white rounded-2xl mt-4 shadow-sm overflow-hidden">
          <div className="bg-sky-500 text-white grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2 text-sm font-medium">
            <span>Item</span>
            <span className="w-10 text-right">Qty</span>
            <span className="w-14 text-right">Rate</span>
            <span className="w-16 text-right">Total</span>
          </div>
          {invoice.lines.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-5">No deliveries this month.</p>
          ) : (
            invoice.lines.map((l) => (
              <div key={l.productId} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-3 border-b border-slate-100 text-sm">
                <span className="text-slate-700">{l.name}</span>
                <span className="w-10 text-right">{l.qty}</span>
                <span className="w-14 text-right">{l.rate.toFixed(2)}</span>
                <span className="w-16 text-right font-semibold">{l.total.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="bg-slate-50 rounded-2xl mt-4 p-4 space-y-2">
          <Row label="Sub-total" value={invoice.subTotal.toFixed(1)} />
          <Row label="Past Due Amount" value={invoice.pastDue.toFixed(1)} />
          <Row label="Paid" value={invoice.paid.toFixed(1)} />
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span className="font-bold text-slate-800">Amount to Pay</span>
            <span className="font-bold text-slate-900">{invoice.amountToPay.toFixed(1)}</span>
          </div>
        </div>

        <p className="text-sm text-slate-400 mt-4">Remark:</p>
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex border-t border-slate-200 z-30">
        <button onClick={() => navigate({ name: "customerDetail", id: customerId })} className="flex-1 py-4 bg-white text-sky-500 font-semibold border-r border-slate-200">
          Edit
        </button>
        <button onClick={share} className="flex-1 py-4 bg-sky-500 text-white font-semibold border-r border-sky-400">
          Share Invoice
        </button>
        <button onClick={sendMessage} className="flex-1 py-4 bg-sky-500 text-white font-semibold">
          Send Message
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );
}
