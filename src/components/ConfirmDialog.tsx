import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 w-[85%] max-w-[320px] shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 className="text-base font-semibold mb-1">Are you sure?</h3>
          <p className="text-sm text-slate-500">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
