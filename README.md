# Sales Dashboard

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
