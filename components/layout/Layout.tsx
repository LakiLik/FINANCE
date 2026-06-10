import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Receipt, RefreshCw, Fuel, Package, FileText, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Entrate e Uscite", path: "/transactions", icon: Receipt },
  { name: "Abbonamenti", path: "/subscriptions", icon: RefreshCw },
  { name: "Carburante", path: "/fuel", icon: Fuel },
  { name: "Magazzino", path: "/inventory", icon: Package },
  { name: "Fatture", path: "/invoices", icon: FileText },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-900">FI</div>
            <h1 className="text-lg font-semibold tracking-tight">FinStack Pro</h1>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer gap-3",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-800"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-slate-400">Supabase Real-time Active</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-400 rounded-md hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            Esci
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/20 backdrop-blur-md flex-shrink-0">
          <h1 className="font-semibold text-slate-200">{navItems.find((p) => p.path === location.pathname)?.name || "Manager"}</h1>
          <button onClick={handleLogout} className="text-slate-400 hover:text-slate-200">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Header - PC Simulation */}
        <header className="hidden md:flex h-16 border-b border-slate-800 items-center justify-between px-8 bg-slate-900/20 backdrop-blur-md flex-shrink-0">
           <div className="flex flex-col">
             <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Benvenuto</span>
             <span className="text-sm font-medium text-slate-200">Admin Console (Partita IVA: IT01234567890)</span>
           </div>
           <div className="flex items-center gap-6">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">LU</div>
           </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          <div className="max-w-7xl w-full mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md pb-safe">
        <ul className="flex justify-around items-center h-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path} className="flex-1 h-full">
                <Link
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                    isActive
                      ? "text-emerald-400"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive && "fill-current/20")} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium truncate px-1 max-w-full">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
