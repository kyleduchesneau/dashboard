import type { Opportunity } from "@/lib/parseData";

const stageBadge: Record<string, string> = {
  "Closed Won": "bg-green-100 text-green-700",
  "Closed Lost": "bg-red-100 text-red-700",
  "Finalize/Negotiate": "bg-indigo-100 text-indigo-700",
  Specification: "bg-blue-100 text-blue-700",
  "Estimate/Quote": "bg-yellow-100 text-yellow-700",
  Discovery: "bg-purple-100 text-purple-700",
  Introduction: "bg-slate-100 text-slate-600",
};

export default function OpportunitiesTable({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-base font-semibold text-slate-700 mb-4">
        Recent Opportunities
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-3 text-slate-500 font-medium">
                Opportunity
              </th>
              <th className="text-left py-2 px-3 text-slate-500 font-medium">
                Stage
              </th>
              <th className="text-right py-2 px-3 text-slate-500 font-medium">
                Amount
              </th>
              <th className="text-right py-2 px-3 text-slate-500 font-medium">
                Close Date
              </th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((op, i) => (
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
                <td className="py-2.5 px-3 text-right text-slate-500">
                  {op.closeDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
