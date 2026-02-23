"use client";

import {
  PieChart,
  Pie,
  Cell,
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

const DEFAULT_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b", "#ec4899",
];

function formatMillions(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-slate-700">{payload[0].name}</p>
        <p className="text-slate-600">{formatMillions(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function LeadStatusChart({
  data,
}: {
  data: { stage: string; revenue: number }[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Revenue by Stage
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="stage"
            cx="50%"
            cy="45%"
            outerRadius={100}
            innerRadius={50}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.stage}
                fill={STAGE_COLORS[entry.stage] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-sm text-slate-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
