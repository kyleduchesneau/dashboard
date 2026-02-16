import { getDashboardData } from "@/lib/parseData";
import KPICard from "@/components/KPICard";
import RevenueChart from "@/components/RevenueChart";
import LeadStatusChart from "@/components/LeadStatusChart";
import OpportunitiesTable from "@/components/OpportunitiesTable";
import ChatWidget from "@/components/ChatWidget";

export default function DashboardPage() {
  const data = getDashboardData();

  const totalRevenueFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(data.totalRevenue);

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard
            title="Total Pipeline Revenue"
            value={totalRevenueFormatted}
            subtitle="All opportunity stages"
            color="green"
          />
          <KPICard
            title="Accounts"
            value={data.totalAccounts.toString()}
            subtitle="Across the US"
            color="blue"
          />
          <KPICard
            title="Contacts"
            value={data.totalContacts.toString()}
            subtitle="Active contacts"
            color="purple"
          />
          <KPICard
            title="Leads"
            value={data.totalLeads.toString()}
            subtitle="In pipeline"
            color="orange"
          />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RevenueChart data={data.revenueByStage} />
          </div>
          <div>
            <LeadStatusChart data={data.leadStatusData} />
          </div>
        </section>

        {/* Opportunities Table */}
        <section>
          <OpportunitiesTable opportunities={data.recentOpportunities} />
        </section>
      </main>
    </div>
  );
}
