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

export type RawRecord = Record<string, string>;

export interface CRMData {
  opportunities: Opportunity[];
  leads: RawRecord[];
  accounts: RawRecord[];
  contacts: RawRecord[];
}

let _crmCache: CRMData | null = null;

export function loadCRMData(): CRMData {
  if (_crmCache) return _crmCache;
  const opRaw = readCSV("Opportunites.csv");
  _crmCache = {
    opportunities: opRaw.map((r) => ({
      companyId: r["CompanEXTID"] ?? "",
      amount: parseFloat((r["Amount"] ?? "0").replace(/[$,\s]/g, "")) || 0,
      opportunityName: r["Oppurtunity Name"] || r["Project Name"] || "",
      stage: r["Stage"] ?? "",
      closeDate: r["Close Date"] ?? "",
    })),
    leads: readCSV("Leads.csv"),
    accounts: readCSV("Accounts.csv"),
    contacts: readCSV("Contacts.csv"),
  };
  return _crmCache;
}

export interface DashboardData {
  totalAccounts: number;
  totalContacts: number;
  totalLeads: number;
  allOpportunities: Opportunity[];
  stages: string[];
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

  const allOpportunities: Opportunity[] = opportunities.map((row) => ({
    companyId: row["CompanEXTID"] || "",
    amount: parseFloat((row["Amount"] || "0").replace(/[$,\s]/g, "")) || 0,
    opportunityName: row["Oppurtunity Name"] || row["Project Name"] || "",
    stage: row["Stage"] || "",
    closeDate: row["Close Date"] || "",
  }));

  // Stages in preferred order, including any that aren't in STAGE_ORDER
  const stageSet = new Set(allOpportunities.map((op) => op.stage).filter(Boolean));
  const stages = [
    ...STAGE_ORDER.filter((s) => stageSet.has(s)),
    ...allOpportunities.map((op) => op.stage).filter((s) => s && !STAGE_ORDER.includes(s)),
  ].filter((s, i, arr) => arr.indexOf(s) === i);

  return {
    totalAccounts: accounts.length,
    totalContacts: contacts.length,
    totalLeads: leads.length,
    allOpportunities,
    stages,
  };
}

