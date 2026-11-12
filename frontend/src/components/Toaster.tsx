"use client";

import { useStore } from "@/lib/store";

export default function Toaster() {
  const { toasts } = useStore();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-slide-up ${
            toast.kind === "error" ? "bg-red-600" : "bg-foreground"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
