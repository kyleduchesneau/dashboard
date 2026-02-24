"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

function formatMillions(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export default function CumulativeLineChart({
  data,
  selectedMonth,
  onMonthClick,
}: {
  data: { month: string; pipeline: number; closedWon: number }[];
  selectedMonth?: string | null;
  onMonthClick: (month: string | null) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-700">Cumulative Deal Value</h2>
        <span className="text-xs text-slate-400">Excludes Closed Lost</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 56, left: 8, bottom: 0 }}
          onClick={(e) => {
            const month = e?.activePayload?.[0]?.payload?.month;
            if (month) onMonthClick(month === selectedMonth ? null : month);
          }}
          style={{ cursor: "pointer" }}
        >
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
          />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-slate-600">{value}</span>
            )}
          />
          {selectedMonth && (
            <ReferenceLine
              x={selectedMonth}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth={2}
            />
          )}
          <Line
            type="monotone"
            dataKey="pipeline"
            name="Active Pipeline"
            stroke="#6366f1"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload, index } = props;
              const isSelected = payload.month === selectedMonth;
              const isLast = index === data.length - 1;
              return (
                <g key={`dot-pipeline-${payload.month}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6 : 3}
                    fill={isSelected ? "#4f46e5" : "#6366f1"}
                    stroke="white"
                    strokeWidth={2}
                  />
                  {isLast && payload.pipeline > 0 && (
                    <text x={cx + 9} y={cy} dy={4} fill="#64748b" fontSize={11} textAnchor="start">
                      {formatMillions(payload.pipeline)}
                    </text>
                  )}
                </g>
              );
            }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="closedWon"
            name="Closed Won"
            stroke="#22c55e"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload, index } = props;
              const isSelected = payload.month === selectedMonth;
              const isLast = index === data.length - 1;
              return (
                <g key={`dot-won-${payload.month}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 6 : 3}
                    fill={isSelected ? "#16a34a" : "#22c55e"}
                    stroke="white"
                    strokeWidth={2}
                  />
                  {isLast && payload.closedWon > 0 && (
                    <text x={cx + 9} y={cy} dy={4} fill="#64748b" fontSize={11} textAnchor="start">
                      {formatMillions(payload.closedWon)}
                    </text>
                  )}
                </g>
              );
            }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
