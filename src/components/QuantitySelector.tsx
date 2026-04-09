import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 100,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-lg hover:bg-sky-50 hover:border-sky-500 active:scale-95 transition-all"
      >
        <Minus size={18} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = parseInt(e.target.value) || min;
          onChange(Math.max(min, Math.min(max, v)));
        }}
        min={min}
        max={max}
        className="w-20 text-center font-semibold p-2 border border-slate-200 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-lg hover:bg-sky-50 hover:border-sky-500 active:scale-95 transition-all"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
