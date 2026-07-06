"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAppStore } from "@/store/dashboard-store";
import { ToastContainer } from "@/components/ui/toast-container";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950/50">
      <ToastContainer />
      
      {/* Desktop Persistent Sidebar Wrapper */}
      <div 
        className={cn(
          "hidden md:block h-full transition-all duration-300 ease-in-out flex-shrink-0",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
