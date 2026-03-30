"use client";

export default function DashboardHeader() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brandDeal flex items-center justify-center text-white font-bold text-sm">
          IC
        </div>
        <h1 className="text-lg font-semibold">Command Center</h1>
      </div>
      <p className="text-sm text-gray-400">{greeting}</p>
    </header>
  );
}
