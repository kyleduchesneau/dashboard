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
  "Estimate/Quote": "#f59e0b",
  Specification: "#3b82f6",
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
            style={{ cursor: "pointer" }}
            labelLine={false}
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              value,
              percent,
            }: {
              cx: number;
              cy: number;
              midAngle: number;
              innerRadius: number;
              outerRadius: number;
              value: number;
              percent: number;
            }) => {
              if (percent < 0.06) return null;
              const RADIAN = Math.PI / 180;
              const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text
                  x={x}
                  y={y}
                  fill="white"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight={600}
                >
                  {formatMillions(value)}
                </text>
              );
            }}
            onClick={(entry) => {
              const stage = entry?.stage as string | undefined;
              if (stage) onStageClick(stage === selectedStage ? null : stage);
            }}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.stage}
                fill={STAGE_COLORS[entry.stage] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                opacity={hasFilter && selectedStage !== entry.stage ? 0.25 : 1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-slate-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
