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

export function getAIContext(): string {
  const accounts = readCSV("Accounts.csv");
  const contacts = readCSV("Contacts.csv");
  const leads = readCSV("Leads.csv");
  const opportunities = readCSV("Opportunites.csv");

  // Pre-compute aggregates using the same logic as the dashboard charts
  const parsedOpportunities = opportunities.map((r) => ({
    name: r["Oppurtunity Name"] || r["Project Name"] || "",
    stage: r["Stage"] || "",
    amount: parseFloat((r["Amount"] || "0").replace(/[$,\s]/g, "")),
    closeDate: r["Close Date"] || "",
  }));

  const stageMap = new Map<string, number>();
  parsedOpportunities.forEach((op) => {
    stageMap.set(op.stage, (stageMap.get(op.stage) || 0) + op.amount);
  });
  const stageSummaryLines = Array.from(stageMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([stage, total]) => `  ${stage}: $${Math.round(total).toLocaleString()}`)
    .join("\n");

  const statusMap = new Map<string, number>();
  leads.forEach((r) => {
    const s = (r["Lead Status"] || "Unknown").trim();
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
  });
  const leadSummaryLines = Array.from(statusMap.entries())
    .map(([status, count]) => `  ${status}: ${count}`)
    .join("\n");

  const oppLines = parsedOpportunities
    .map((op) => `${op.name} | ${op.stage} | $${Math.round(op.amount).toLocaleString()} | closes ${op.closeDate}`)
    .join("\n");

  const leadLines = leads
    .map((r) => `${r["First Name"]} ${r["Last Name"]}, ${r["Company"]}, ${r["Lead Status"]}`)
    .join("\n");

  const accountLines = accounts
    .map((r) => `${r["Company Name"]}, ${r["City"]}, ${r["State"]}`)
    .join("\n");

  const contactLines = contacts
    .map((r) => `${r["first_name"]} ${r["last_name"]} <${r["email"]}>`)
    .join("\n");

  return `You are a data assistant for a CRM sales dashboard. Answer questions concisely using only the data below. If something isn't in the data, say so.

IMPORTANT: For any aggregate questions (totals, counts, averages), use the PRE-COMPUTED SUMMARIES below — do not manually sum individual rows, as rounding in the display values will produce incorrect results.

PRE-COMPUTED SUMMARIES:
Revenue by stage (exact totals):
${stageSummaryLines}

Lead count by status:
${leadSummaryLines}

Total accounts: ${accounts.length}
Total contacts: ${contacts.length}
Total leads: ${leads.length}
Total opportunities: ${parsedOpportunities.length}

RAW DATA (for lookups and specific record questions):

OPPORTUNITIES (name | stage | amount | close date):
${oppLines}

LEADS (name, company, status):
${leadLines}

ACCOUNTS (company, city, state):
${accountLines}

CONTACTS (name, email):
${contactLines}`;
}
