"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import KPICard from "./KPICard";
import RevenueChart from "./RevenueChart";
import LeadStatusChart from "./LeadStatusChart";
import OpportunitiesTable from "./OpportunitiesTable";
import type { DashboardData } from "@/lib/parseData";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseMonthKey(dateStr: string): { label: string; sort: number } | null {
  const parts = dateStr.split("/");
  if (parts.length < 3) return null;
  const month = parseInt(parts[0]) - 1;
  const year = parseInt(parts[2]);
  if (isNaN(month) || isNaN(year) || month < 0 || month > 11) return null;
  const fullYear = year < 100 ? 2000 + year : year;
  return {
    label: `${MONTH_NAMES[month]} '${String(fullYear).slice(2)}`,
    sort: fullYear * 100 + month,
  };
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [selectedStages, setSelectedStages] = useState<Set<string>>(
    () => new Set(data.stages)
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredOpps = useMemo(
    () => data.allOpportunities.filter((op) => selectedStages.has(op.stage)),
    [data.allOpportunities, selectedStages]
  );

  const filteredRevenue = useMemo(
    () => filteredOpps.reduce((sum, op) => sum + op.amount, 0),
    [filteredOpps]
  );

  const revenueByStage = useMemo(() => {
    const map = new Map<string, number>();
    filteredOpps.forEach((op) => {
      map.set(op.stage, (map.get(op.stage) || 0) + op.amount);
    });
    return data.stages
      .filter((s) => map.has(s))
      .map((stage) => ({ stage, revenue: Math.round(map.get(stage)!) }));
  }, [filteredOpps, data.stages]);

  const lineChartData = useMemo(() => {
    const monthMap = new Map<string, Record<string, number | string>>();
    const sortMap = new Map<string, number>();
    filteredOpps.forEach((op) => {
      const parsed = parseMonthKey(op.closeDate);
      if (!parsed) return;
      const { label, sort } = parsed;
      if (!monthMap.has(label)) {
        monthMap.set(label, { month: label });
        sortMap.set(label, sort);
      }
      const entry = monthMap.get(label)!;
      entry[op.stage] = ((entry[op.stage] as number) || 0) + op.amount;
    });
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => sortMap.get(a)! - sortMap.get(b)!)
      .map(([, entry]) => entry);
  }, [filteredOpps]);

  const activeStages = useMemo(() => {
    const revenueMap = new Map(revenueByStage.map((r) => [r.stage, r.revenue]));
    return data.stages
      .filter((s) => selectedStages.has(s))
      .sort((a, b) => (revenueMap.get(b) ?? 0) - (revenueMap.get(a) ?? 0));
  }, [data.stages, selectedStages, revenueByStage]);
  const isFiltered = selectedStages.size !== data.stages.length;

  const filteredRevenueFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(filteredRevenue);

  function toggleStage(stage: string, checked: boolean) {
    const next = new Set(selectedStages);
    checked ? next.add(stage) : next.delete(stage);
    setSelectedStages(next);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Stage filter */}
      <div className="flex items-center gap-3">
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors bg-blue-700 border-blue-600 text-white hover:bg-blue-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" />
            </svg>
            <span>Stages</span>
            <span
              className="text-xs rounded-full px-1.5 py-0.5 font-medium bg-blue-600 text-blue-100"
            >
              {selectedStages.size} / {data.stages.length}
            </span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute top-10 left-0 z-40 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-3">
              <div className="flex justify-between mb-2 pb-2 border-b border-slate-100">
                <button
                  onClick={() => setSelectedStages(new Set(data.stages))}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Select all
                </button>
                <button
                  onClick={() => setSelectedStages(new Set())}
                  className="text-xs text-slate-400 hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-0.5">
                {data.stages.map((stage) => (
                  <label
                    key={stage}
                    className="flex items-center gap-2 cursor-pointer py-1.5 px-1 rounded hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStages.has(stage)}
                      onChange={(e) => toggleStage(stage, e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">{stage}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={() => setSelectedStages(new Set(data.stages))}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title={isFiltered ? "Filtered Pipeline Revenue" : "Total Pipeline Revenue"}
          value={filteredRevenueFormatted}
          subtitle={
            isFiltered
              ? `${activeStages.length} stage${activeStages.length !== 1 ? "s" : ""} selected`
              : "All opportunity stages"
          }
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
          <RevenueChart data={lineChartData} stages={activeStages} />
        </div>
        <div>
          <LeadStatusChart data={revenueByStage} />
        </div>
      </section>

      {/* Opportunities Table */}
      <section>
        <OpportunitiesTable opportunities={filteredOpps} />
      </section>
    </main>
  );
}
