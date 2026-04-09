import { useState, type FormEvent } from "react";
import { login } from "../auth";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const success = await login(pin);
    if (success) {
      setError(false);
      onLogin();
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[320px] shadow-2xl text-center">
        <div className="text-5xl mb-2">💧</div>
        <h2 className="text-sky-700 text-xl font-bold mb-1">
          Water Bottle Supplier
        </h2>
        <p className="text-slate-500 text-sm mb-6">Enter PIN to continue</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={20}
            placeholder="Enter PIN"
            autoComplete="off"
            className="w-full p-4 text-2xl text-center border-2 border-slate-200 rounded-xl tracking-[0.5rem] mb-4 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="w-full p-4 bg-gradient-to-br from-sky-500 to-sky-700 text-white rounded-xl font-semibold text-base hover:-translate-y-0.5 hover:shadow-lg transition-all active:translate-y-0"
          >
            Unlock
          </button>
        </form>
        {error && (
          <p className="text-red-500 text-sm mt-4">
            Invalid PIN. Please try again.
          </p>
        )}
      </div>
    </div>
  );
}
