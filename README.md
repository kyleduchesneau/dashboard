# Sales Dashboard

**Live demo:** https://dashboard-test-liard-ten.vercel.app/

A CRM sales dashboard built with Next.js, Tailwind CSS, and Recharts. Reads dummy data from local CSV files and renders key metrics, charts, and a recent opportunities table.

## Data

Four CSV files live in `data/` and are parsed server-side at request time:

| File | Contents |
|---|---|
| `Accounts.csv` | 100 companies with city/state |
| `Contacts.csv` | 100 contacts linked to accounts |
| `Leads.csv` | 100 leads with New/Working status |
| `Opportunites.csv` | 100 sales opportunities with stage and amount |

## Dashboard

- **KPI cards** — total pipeline revenue, accounts, contacts, and leads
- **Revenue by Stage** — bar chart grouped by sales stage (Closed Won → Introduction)
- **Lead Status** — donut chart showing New vs. Working leads
- **Recent Opportunities** — table of the first 10 opportunities with stage badge and amount

## Ask Your Data

The Ask Your Data feature lets you query your CRM in plain English using an AI-powered chat widget in the dashboard header.

**How it works:**

Click **Ask Your Data** to open the chat panel

Type any question about your CRM — e.g. "What is the 80th percentile deal size for Closed Won opportunities?" or "How many leads have Working status?"

The question is sent to a Next.js API route that uses **Claude** (via the Anthropic API) with **tool use / function calling**

Rather than guessing, Claude calls a query_crm tool that executes the computation server-side in TypeScript against the raw CSV data with exact arithmetic — supporting operations like `count`, `sum`, `avg`, `min`, `max`, `percentile`, and `distribution`, with filters for equality, numeric ranges, and string matching

Claude can call the tool multiple times in sequence (up to 8 rounds) to answer multi-step questions

The final plain-language answer is streamed back into the chat

**Why this approach scales:** No CRM data is embedded in the prompt. Claude only receives a minimal role description and tool schema. As datasets grow, query performance stays constant and context usage stays small — Claude fetches exactly what it needs.

## Tech Stack

- [Next.js 15](https://nextjs.org/) — App Router, server components
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling
- [Recharts](https://recharts.org/) — composable chart library

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

```bash
vercel --prod
```
