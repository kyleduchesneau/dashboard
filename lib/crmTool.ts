import Anthropic from "@anthropic-ai/sdk";
import { loadCRMData } from "./parseData";

// ─── Tool schema ─────────────────────────────────────────────────────────────

export const CRM_TOOL: Anthropic.Tool = {
  name: "query_crm",
  description:
    "Query the CRM database. Always use this tool to answer data questions — never guess or estimate. " +
    "You may call it multiple times in sequence to build up an answer.",
  input_schema: {
    type: "object" as const,
    properties: {
      entity: {
        type: "string",
        enum: ["opportunities", "leads", "accounts", "contacts"],
        description: "Which dataset to query.",
      },
      operation: {
        type: "string",
        enum: ["list", "count", "sum", "avg", "min", "max", "percentile", "distribution"],
        description:
          "list: return matching records. count: count them. " +
          "sum/avg/min/max: aggregate a numeric field. " +
          "percentile: Nth percentile of a numeric field (requires percentile_value). " +
          "distribution: group by a field and count records (requires group_by).",
      },
      field: {
        type: "string",
        description:
          "Field to aggregate. Required for sum/avg/min/max/percentile. " +
          "Opportunities: 'amount' or 'closeDate'. " +
          "Leads: 'Lead Status', 'Company', 'First Name', 'Last Name'. " +
          "Accounts: 'Company Name', 'City', 'State'. " +
          "Contacts: 'first_name', 'last_name', 'email'.",
      },
      filters: {
        type: "array",
        description: "Optional filter conditions, ANDed together.",
        items: {
          type: "object",
          properties: {
            field: { type: "string", description: "Field name to filter on." },
            op: {
              type: "string",
              enum: ["eq", "neq", "gte", "lte", "contains", "not_contains"],
              description:
                "eq/neq: equality (case-insensitive for strings). " +
                "gte/lte: numeric or date comparison. " +
                "contains/not_contains: substring match.",
            },
            value: { type: "string", description: "Value to compare against." },
          },
          required: ["field", "op", "value"],
        },
      },
      group_by: {
        type: "string",
        description: "Required for distribution. Field whose distinct values form the groups.",
      },
      percentile_value: {
        type: "number",
        description: "Required for percentile. A number between 0 and 100.",
      },
      limit: {
        type: "integer",
        description: "For list only. Max records to return. Default 20, max 100.",
      },
    },
    required: ["entity", "operation"],
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterCondition {
  field: string;
  op: "eq" | "neq" | "gte" | "lte" | "contains" | "not_contains";
  value: string;
}

export interface QueryInput {
  entity: "opportunities" | "leads" | "accounts" | "contacts";
  operation: "list" | "count" | "sum" | "avg" | "min" | "max" | "percentile" | "distribution";
  field?: string;
  filters?: FilterCondition[];
  group_by?: string;
  percentile_value?: number;
  limit?: number;
}

export type QueryResult =
  | { operation: "count"; result: number }
  | { operation: "sum" | "avg" | "min" | "max"; result: number | null; field: string }
  | { operation: "percentile"; result: number | null; field: string; percentile: number }
  | { operation: "distribution"; result: { value: string; count: number }[] }
  | { operation: "list"; result: unknown[]; total_matched: number }
  | { error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NUMERIC_FIELDS = new Set(["amount"]);
const DATE_FIELDS = new Set(["closeDate", "Close Date"]);

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[$,\s]/g, "")) || 0;
}

function parseDate(raw: string): number {
  const parts = raw.split("/");
  if (parts.length !== 3) return NaN;
  const [m, d, y] = parts.map(Number);
  if (isNaN(m) || isNaN(d) || isNaN(y)) return NaN;
  const year = y < 100 ? 2000 + y : y;
  return new Date(year, m - 1, d).getTime();
}

function toNumber(row: Record<string, unknown>, field: string): number {
  const val = row[field];
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val.replace(/[$,\s]/g, ""));
  return NaN;
}

function matchesFilter(row: Record<string, unknown>, f: FilterCondition): boolean {
  const raw = String(row[f.field] ?? "");
  const { op, value } = f;

  if (NUMERIC_FIELDS.has(f.field)) {
    const numVal = parseAmount(raw);
    const numCmp = parseFloat(value.replace(/[$,\s]/g, ""));
    if (isNaN(numCmp)) return false;
    if (op === "eq")  return numVal === numCmp;
    if (op === "neq") return numVal !== numCmp;
    if (op === "gte") return numVal >= numCmp;
    if (op === "lte") return numVal <= numCmp;
  }

  if (DATE_FIELDS.has(f.field)) {
    const dVal = parseDate(raw);
    const dCmp = parseDate(value);
    if (isNaN(dVal) || isNaN(dCmp)) return false;
    if (op === "eq")  return dVal === dCmp;
    if (op === "neq") return dVal !== dCmp;
    if (op === "gte") return dVal >= dCmp;
    if (op === "lte") return dVal <= dCmp;
  }

  // String operations (case-insensitive)
  const lRaw = raw.toLowerCase();
  const lCmp = value.toLowerCase();
  if (op === "eq")           return lRaw === lCmp;
  if (op === "neq")          return lRaw !== lCmp;
  if (op === "contains")     return lRaw.includes(lCmp);
  if (op === "not_contains") return !lRaw.includes(lCmp);
  if (op === "gte")          return lRaw >= lCmp;
  if (op === "lte")          return lRaw <= lCmp;

  return false;
}

function applyFilters(
  rows: Record<string, unknown>[],
  filters?: FilterCondition[]
): Record<string, unknown>[] {
  if (!filters || filters.length === 0) return rows;
  return rows.filter((row) => filters.every((f) => matchesFilter(row, f)));
}

// ─── Main executor ────────────────────────────────────────────────────────────

export function executeQuery(input: QueryInput): QueryResult {
  const data = loadCRMData();

  let rows: Record<string, unknown>[];
  if (input.entity === "opportunities") {
    rows = data.opportunities as unknown as Record<string, unknown>[];
  } else if (input.entity === "leads") {
    rows = data.leads as Record<string, unknown>[];
  } else if (input.entity === "accounts") {
    rows = data.accounts as Record<string, unknown>[];
  } else {
    rows = data.contacts as Record<string, unknown>[];
  }

  const filtered = applyFilters(rows, input.filters);

  switch (input.operation) {
    case "count":
      return { operation: "count", result: filtered.length };

    case "sum":
    case "avg":
    case "min":
    case "max": {
      const { field, operation } = input;
      if (!field) return { error: `'field' is required for operation '${operation}'` };
      const nums = filtered.map((r) => toNumber(r, field)).filter((n) => !isNaN(n));
      if (nums.length === 0) return { operation, result: null, field };
      let result: number;
      if (operation === "sum") result = nums.reduce((a, b) => a + b, 0);
      else if (operation === "min") result = Math.min(...nums);
      else if (operation === "max") result = Math.max(...nums);
      else result = nums.reduce((a, b) => a + b, 0) / nums.length;
      return { operation, result: Math.round(result * 100) / 100, field };
    }

    case "percentile": {
      const { field } = input;
      if (!field) return { error: "'field' is required for percentile" };
      const p = input.percentile_value;
      if (p === undefined || p < 0 || p > 100) {
        return { error: "'percentile_value' must be between 0 and 100" };
      }
      const nums = filtered
        .map((r) => toNumber(r, field))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);
      if (nums.length === 0) return { operation: "percentile", result: null, field, percentile: p };
      const idx = Math.max(0, Math.ceil((p / 100) * nums.length) - 1);
      return { operation: "percentile", result: Math.round(nums[idx] * 100) / 100, field, percentile: p };
    }

    case "distribution": {
      const groupField = input.group_by;
      if (!groupField) return { error: "'group_by' is required for distribution" };
      const counts = new Map<string, number>();
      for (const row of filtered) {
        const key = String(row[groupField] ?? "").trim() || "(empty)";
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const result = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
      return { operation: "distribution", result };
    }

    case "list": {
      const limit = Math.min(input.limit ?? 20, 100);
      return {
        operation: "list",
        result: filtered.slice(0, limit),
        total_matched: filtered.length,
      };
    }

    default:
      return { error: `Unknown operation: ${input.operation}` };
  }
}
