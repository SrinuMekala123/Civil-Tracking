"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalendarPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/meetings");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-slate-500 text-sm animate-pulse">Redirecting to Meetings & Calendar Hub...</p>
    </div>
  );
}
