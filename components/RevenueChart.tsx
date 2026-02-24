"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const STAGE_COLORS: Record<string, string> = {
  "Closed Won": "#22c55e",
  "Closed Lost": "#ef4444",
  "Finalize/Negotiate": "#6366f1",
  Specification: "#3b82f6",
  Discovery: "#8b5cf6",
  Introduction: "#64748b",
};

function formatMillions(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export default function RevenueChart({
  data,
  selectedStage,
  onStageClick,
}: {
  data: { stage: string; revenue: number }[];
  selectedStage?: string | null;
  onStageClick: (stage: string | null) => void;
}) {
  const hasFilter = !!selectedStage;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Revenue by Stage
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 0, bottom: 0 }}
          onClick={(e) => {
            const stage = e?.activePayload?.[0]?.payload?.stage;
            if (stage) onStageClick(stage === selectedStage ? null : stage);
          }}
          style={{ cursor: "pointer" }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatMillions}
            tick={{ fontSize: 11, fill: "#64748b" }}
          />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ fontSize: 11, fill: "#64748b" }}
            width={145}
          />
          <Tooltip
            formatter={(value: number) => [
              `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
              "Revenue",
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            cursor={{ fill: "#f8fafc" }}
          />
          <Bar dataKey="revenue" radius={[0, 3, 3, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.stage}
                fill={STAGE_COLORS[entry.stage] ?? "#6366f1"}
                opacity={hasFilter && selectedStage !== entry.stage ? 0.25 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
