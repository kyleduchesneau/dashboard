"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LeadStatusCount } from "@/lib/parseData";

const COLORS: Record<string, string> = {
  New: "#6366f1",
  Working: "#22c55e",
  Qualified: "#f59e0b",
  Unqualified: "#ef4444",
};

const DEFAULT_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-semibold text-slate-700">{payload[0].name}</p>
        <p className="text-slate-600">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

export default function LeadStatusChart({
  data,
}: {
  data: LeadStatusCount[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Lead Status
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="45%"
            outerRadius={100}
            innerRadius={50}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.status}
                fill={COLORS[entry.status] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
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
