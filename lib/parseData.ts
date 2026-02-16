import fs from "fs";
import path from "path";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = parseCSVLine(line);
      return headers.reduce(
        (obj, header, i) => {
          obj[header] = (values[i] ?? "").trim();
          return obj;
        },
        {} as Record<string, string>
      );
    });
}

function readCSV(filename: string): Record<string, string>[] {
  const filePath = path.join(process.cwd(), "data", filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return parseCSV(content);
}

export interface Opportunity {
  companyId: string;
  amount: number;
  opportunityName: string;
  stage: string;
  closeDate: string;
}

export interface RevenueByStage {
  stage: string;
  revenue: number;
}

export interface LeadStatusCount {
  status: string;
  count: number;
}

export interface DashboardData {
  totalRevenue: number;
  totalAccounts: number;
  totalContacts: number;
  totalLeads: number;
  revenueByStage: RevenueByStage[];
  leadStatusData: LeadStatusCount[];
  recentOpportunities: Opportunity[];
}

const STAGE_ORDER = [
  "Closed Won",
  "Closed Lost",
  "Finalize/Negotiate",
  "Specification",
  "Estimate/Quote",
  "Discovery",
  "Introduction",
];

export function getDashboardData(): DashboardData {
  const accounts = readCSV("Accounts.csv");
  const contacts = readCSV("Contacts.csv");
  const leads = readCSV("Leads.csv");
  const opportunities = readCSV("Opportunites.csv");

  const parsedOpportunities: Opportunity[] = opportunities.map((row) => ({
    companyId: row["CompanEXTID"] || "",
    amount: parseFloat((row["Amount"] || "0").replace(/[$,\s]/g, "")),
    opportunityName: row["Oppurtunity Name"] || row["Project Name"] || "",
    stage: row["Stage"] || "",
    closeDate: row["Close Date"] || "",
  }));

  const totalRevenue = parsedOpportunities.reduce(
    (sum, op) => sum + op.amount,
    0
  );

  const stageMap = new Map<string, number>();
  parsedOpportunities.forEach((op) => {
    stageMap.set(op.stage, (stageMap.get(op.stage) || 0) + op.amount);
  });
  const revenueByStage: RevenueByStage[] = STAGE_ORDER.filter((s) =>
    stageMap.has(s)
  ).map((stage) => ({ stage, revenue: Math.round(stageMap.get(stage)!) }));

  const statusMap = new Map<string, number>();
  leads.forEach((lead) => {
    const raw = (lead["Lead Status"] || "Unknown").trim();
    const normalized = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    statusMap.set(normalized, (statusMap.get(normalized) || 0) + 1);
  });
  const leadStatusData: LeadStatusCount[] = Array.from(
    statusMap.entries()
  ).map(([status, count]) => ({ status, count }));

  return {
    totalRevenue,
    totalAccounts: accounts.length,
    totalContacts: contacts.length,
    totalLeads: leads.length,
    revenueByStage,
    leadStatusData,
    recentOpportunities: parsedOpportunities.slice(0, 10),
  };
}
