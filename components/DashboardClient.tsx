"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import KPICard from "./KPICard";
import RevenueChart from "./RevenueChart";
import CumulativeLineChart from "./CumulativeLineChart";
import LeadStatusChart from "./LeadStatusChart";
import OpportunitiesTable from "./OpportunitiesTable";
import type { DashboardData } from "@/lib/parseData";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STAGE_ORDER = [
  "Introduction",
  "Discovery",
  "Specification",
  "Finalize/Negotiate",
  "Closed Won",
  "Closed Lost",
];

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
  const [clickedStage, setClickedStage] = useState<string | null>(null);
  const [clickedMonth, setClickedMonth] = useState<string | null>(null);
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

  // Base filter: dropdown stage selection
  const filteredOpps = useMemo(
    () => data.allOpportunities.filter((op) => selectedStages.has(op.stage)),
    [data.allOpportunities, selectedStages]
  );

  // Stage chart data: filtered by clicked month (so bar & donut update on month click)
  const stageChartOpps = useMemo(() => {
    if (!clickedMonth) return filteredOpps;
    return filteredOpps.filter((op) => parseMonthKey(op.closeDate)?.label === clickedMonth);
  }, [filteredOpps, clickedMonth]);

  const stageData = useMemo(() => {
    const map = new Map<string, number>();
    stageChartOpps.forEach((op) => {
      map.set(op.stage, (map.get(op.stage) || 0) + op.amount);
    });
    const ordered = STAGE_ORDER.filter((s) => map.has(s)).map((stage) => ({
      stage,
      revenue: Math.round(map.get(stage)!),
    }));
    // append any stages not in STAGE_ORDER
    const extra = Array.from(map.entries())
      .filter(([s]) => !STAGE_ORDER.includes(s))
      .map(([stage, revenue]) => ({ stage, revenue: Math.round(revenue) }));
    return [...ordered, ...extra];
  }, [stageChartOpps]);

  // Cumulative line data: filtered by clicked stage (so line updates on stage click)
  const lineChartOpps = useMemo(() => {
    if (!clickedStage) return filteredOpps;
    return filteredOpps.filter((op) => op.stage === clickedStage);
  }, [filteredOpps, clickedStage]);

  const cumulativeData = useMemo(() => {
    const monthTotals = new Map<string, { sort: number; amount: number }>();
    lineChartOpps.forEach((op) => {
      const parsed = parseMonthKey(op.closeDate);
      if (!parsed) return;
      const { label, sort } = parsed;
      if (!monthTotals.has(label)) monthTotals.set(label, { sort, amount: 0 });
      monthTotals.get(label)!.amount += op.amount;
    });
    const sorted = Array.from(monthTotals.entries()).sort(
      ([, a], [, b]) => a.sort - b.sort
    );
    let cumulative = 0;
    return sorted.map(([label, { amount }]) => {
      cumulative += amount;
      return { month: label, cumulative: Math.round(cumulative) };
    });
  }, [lineChartOpps]);

  // Table / KPI: both filters applied
  const tableOpps = useMemo(() => {
    let opps = filteredOpps;
    if (clickedStage) opps = opps.filter((op) => op.stage === clickedStage);
    if (clickedMonth)
      opps = opps.filter((op) => parseMonthKey(op.closeDate)?.label === clickedMonth);
    return opps;
  }, [filteredOpps, clickedStage, clickedMonth]);

  const filteredRevenue = useMemo(
    () => tableOpps.reduce((sum, op) => sum + op.amount, 0),
    [tableOpps]
  );

  const isDropdownFiltered = selectedStages.size !== data.stages.length;
  const isChartFiltered = !!clickedStage || !!clickedMonth;
  const isFiltered = isDropdownFiltered || isChartFiltered;

  const filteredRevenueFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(filteredRevenue);

  const kpiSubtitle = clickedStage
    ? `Stage: ${clickedStage}`
    : clickedMonth
    ? `Month: ${clickedMonth}`
    : isDropdownFiltered
    ? `${selectedStages.size} stage${selectedStages.size !== 1 ? "s" : ""} selected`
    : "All opportunity stages";

  function toggleStage(stage: string, checked: boolean) {
    const next = new Set(selectedStages);
    checked ? next.add(stage) : next.delete(stage);
    setSelectedStages(next);
    // clear chart filters when dropdown changes
    setClickedStage(null);
    setClickedMonth(null);
  }

  function handleStageClick(stage: string | null) {
    setClickedStage(stage);
    if (stage) setClickedMonth(null);
  }

  function handleMonthClick(month: string | null) {
    setClickedMonth(month);
    if (month) setClickedStage(null);
  }

  function clearChartFilter() {
    setClickedStage(null);
    setClickedMonth(null);
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
            <span className="text-xs rounded-full px-1.5 py-0.5 font-medium bg-blue-600 text-blue-100">
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
                  onClick={() => {
                    setSelectedStages(new Set(data.stages));
                    clearChartFilter();
                  }}
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
            onClick={() => {
              setSelectedStages(new Set(data.stages));
              clearChartFilter();
            }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Reset filter
          </button>
        )}

        {isChartFiltered && (
          <span className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {clickedStage ?? clickedMonth}
            <button
              onClick={clearChartFilter}
              className="ml-0.5 hover:text-indigo-800"
              aria-label="Clear chart filter"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title={isFiltered ? "Filtered Pipeline Revenue" : "Total Pipeline Revenue"}
          value={filteredRevenueFormatted}
          subtitle={kpiSubtitle}
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

      {/* Charts — equal thirds */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <RevenueChart
            data={stageData}
            selectedStage={clickedStage}
            onStageClick={handleStageClick}
          />
        </div>
        <div>
          <CumulativeLineChart
            data={cumulativeData}
            selectedMonth={clickedMonth}
            onMonthClick={handleMonthClick}
          />
        </div>
        <div>
          <LeadStatusChart
            data={stageData}
            selectedStage={clickedStage}
            onStageClick={handleStageClick}
          />
        </div>
      </section>

      {/* Opportunities Table */}
      <section>
        <OpportunitiesTable opportunities={tableOpps} />
      </section>
    </main>
  );
}
