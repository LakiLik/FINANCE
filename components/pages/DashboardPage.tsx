export default function DashboardPage() {
  return (
    <div className="p-8 flex-1 overflow-hidden grid grid-cols-12 gap-6">
      <div className="col-span-12 bg-slate-900/40 border border-slate-800 p-5 rounded-xl flex flex-col justify-center items-center h-64 shadow-2xl">
        <span className="text-3xl font-bold text-slate-500 uppercase tracking-widest">Riepilogo</span>
        <span className="text-xs text-emerald-400 mt-2 font-mono font-bold">In Sviluppo...</span>
      </div>
    </div>
  );
}
