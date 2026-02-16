interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  color: "green" | "blue" | "purple" | "orange";
}

const colorMap = {
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
};

export default function KPICard({
  title,
  value,
  subtitle,
  color,
}: KPICardProps) {
  const c = colorMap[color];
  return (
    <div
      className={`rounded-xl border ${c.border} ${c.bg} p-5 flex flex-col gap-1`}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <span className="text-sm font-medium text-slate-500">{title}</span>
      </div>
      <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
