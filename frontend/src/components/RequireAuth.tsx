"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/** Sends signed-out visitors to the login page and brings them back afterwards. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, authReady } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [authReady, isAuthenticated, pathname, router]);

  if (!authReady || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-foreground/40">Loading...</div>
      </div>
    );
  }
  return <>{children}</>;
}
