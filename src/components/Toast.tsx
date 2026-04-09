import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] px-6 py-3.5 rounded-xl text-sm text-white text-center max-w-[calc(100%-2rem)] animate-slide-up ${
        type === "success" ? "bg-emerald-500" : "bg-red-500"
      }`}
    >
      {message}
    </div>
  );
}
