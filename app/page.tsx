import { getDashboardData } from "@/lib/parseData";
import DashboardClient from "@/components/DashboardClient";
import ChatWidget from "@/components/ChatWidget";

export default function DashboardPage() {
  const data = getDashboardData();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sales Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            CRM overview &mdash; {data.totalAccounts} accounts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-mono">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <ChatWidget />
        </div>
      </header>

      <DashboardClient data={data} />
    </div>
  );
}
