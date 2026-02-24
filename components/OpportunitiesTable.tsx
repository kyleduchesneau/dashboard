"use client";

import { useState, useMemo, useEffect } from "react";
import type { Opportunity } from "@/lib/parseData";

const PAGE_SIZE = 25;

type SortKey = "amount" | "closeDate";
type SortDir = "asc" | "desc";

const stageBadge: Record<string, string> = {
  "Closed Won": "bg-green-100 text-green-700",
  "Closed Lost": "bg-red-100 text-red-700",
  "Finalize/Negotiate": "bg-indigo-100 text-indigo-700",
  Specification: "bg-blue-100 text-blue-700",
  "Estimate/Quote": "bg-yellow-100 text-yellow-700",
  Discovery: "bg-purple-100 text-purple-700",
  Introduction: "bg-slate-100 text-slate-600",
};

function parseDateNum(dateStr: string): number {
  const [m, d, y] = dateStr.split("/").map(Number);
  const fullYear = y < 100 ? 2000 + y : y;
  return fullYear * 10000 + m * 100 + (d || 0);
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`inline-flex flex-col ml-1 leading-none ${active ? "text-indigo-600" : "text-slate-300"}`}>
      <svg
        viewBox="0 0 10 6"
        className={`w-2.5 h-1.5 ${active && dir === "asc" ? "text-indigo-600" : "text-slate-300"}`}
        fill="currentColor"
      >
        <path d="M5 0l5 6H0z" />
      </svg>
      <svg
        viewBox="0 0 10 6"
        className={`w-2.5 h-1.5 ${active && dir === "desc" ? "text-indigo-600" : "text-slate-300"}`}
        fill="currentColor"
      >
        <path d="M5 6L0 0h10z" />
      </svg>
    </span>
  );
}

function PageControls({
  currentPage,
  totalPages,
  from,
  to,
  total,
  onPrev,
  onNext,
  onPage,
}: {
  currentPage: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
}) {
  const pages: (number | "…")[] = [];
  const range = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = Array.from(range).sort((a, b) => a - b);
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) pages.push("…");
    pages.push(p);
  });

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <p className="text-xs text-slate-400">
        Showing {total === 0 ? 0 : from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`w-7 h-7 text-xs rounded-lg border transition-colors ${
                p === currentPage
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={onNext}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function OpportunitiesTable({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => { setCurrentPage(1); }, [opportunities]);
  useEffect(() => { setCurrentPage(1); }, [search]);
  useEffect(() => { setCurrentPage(1); }, [sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? opportunities.filter(
          (op) =>
            op.opportunityName.toLowerCase().includes(q) ||
            op.stage.toLowerCase().includes(q) ||
            op.closeDate.toLowerCase().includes(q)
        )
      : opportunities;

    if (!sortKey) return base;

    return [...base].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "amount") return (a.amount - b.amount) * mul;
      return (parseDateNum(a.closeDate) - parseDateNum(b.closeDate)) * mul;
    });
  }, [opportunities, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);
  const pageRows = filtered.slice(from - 1, to);

  const pageControlProps = {
    currentPage: safePage,
    totalPages,
    from,
    to,
    total: filtered.length,
    onPrev: () => setCurrentPage((p) => Math.max(1, p - 1)),
    onNext: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    onPage: setCurrentPage,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-base font-semibold text-slate-700">Opportunities</h2>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search opportunities…"
          className="text-sm text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-200 px-3 py-1.5 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 w-56"
        />
      </div>

      {/* Top page controls */}
      <PageControls {...pageControlProps} />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-3 text-slate-500 font-medium">Opportunity</th>
              <th className="text-left py-2 px-3 text-slate-500 font-medium">Stage</th>
              <th className="text-right py-2 px-3 text-slate-500 font-medium">
                <button
                  onClick={() => handleSort("amount")}
                  className="inline-flex items-center gap-0.5 hover:text-slate-700 transition-colors"
                >
                  Amount
                  <SortIcon active={sortKey === "amount"} dir={sortDir} />
                </button>
              </th>
              <th className="text-right py-2 px-3 text-slate-500 font-medium">
                <button
                  onClick={() => handleSort("closeDate")}
                  className="inline-flex items-center gap-0.5 hover:text-slate-700 transition-colors"
                >
                  Close Date
                  <SortIcon active={sortKey === "closeDate"} dir={sortDir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                  No opportunities match your search.
                </td>
              </tr>
            ) : (
              pageRows.map((op, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5 px-3 font-medium text-slate-700 max-w-xs truncate">
                    {op.opportunityName}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        stageBadge[op.stage] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {op.stage}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                    ${op.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">{op.closeDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom page controls */}
      <PageControls {...pageControlProps} />
    </div>
  );
}
