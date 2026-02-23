"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const STAGE_COLORS: Record<string, string> = {
  "Closed Won": "#22c55e",
  "Closed Lost": "#ef4444",
  "Finalize/Negotiate": "#6366f1",
  Specification: "#3b82f6",
  "Estimate/Quote": "#f59e0b",
  Discovery: "#8b5cf6",
  Introduction: "#64748b",
};

const FALLBACK_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b", "#ec4899",
];

function formatMillions(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export default function RevenueChart({
  data,
  stages,
}: {
  data: Record<string, number | string>[];
  stages: string[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Revenue Over Time
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#64748b" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatMillions}
            tick={{ fontSize: 11, fill: "#64748b" }}
            width={60}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
              name,
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            cursor={{ fill: "#f8fafc" }}
          />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-slate-600">{value}</span>
            )}
          />
          {stages.map((stage, i) => (
            <Bar
              key={stage}
              dataKey={stage}
              stackId="stack"
              fill={STAGE_COLORS[stage] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              radius={i === stages.length - 1 ? [3, 3, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
