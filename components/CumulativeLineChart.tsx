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
  data: { month: string; cumulative: number }[];
  selectedMonth?: string | null;
  onMonthClick: (month: string | null) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Cumulative Deal Value
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
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
            formatter={(value: number) => [
              `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
              "Cumulative",
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          {selectedMonth && (
            <ReferenceLine
              x={selectedMonth}
              stroke="#6366f1"
              strokeDasharray="4 4"
              strokeWidth={2}
            />
          )}
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#6366f1"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const isSelected = payload.month === selectedMonth;
              return (
                <circle
                  key={`dot-${payload.month}`}
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6 : 3}
                  fill={isSelected ? "#4f46e5" : "#6366f1"}
                  stroke="white"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
