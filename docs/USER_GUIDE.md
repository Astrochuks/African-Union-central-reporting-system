# User Guide

## Getting Started

### 1. Access the Dashboard

Open `frontend/index.html` in your browser, or navigate to the deployed URL. The dashboard loads automatically with the latest continental data.

### 2. System Setup (First Time)

If the database is empty, follow these steps:

1. **Seed the Database**: Go to **Data Pipeline** → Click **Seed Database**
   - This loads: 7 aspirations, 20 goals, 55 member states, 24 indicator definitions

2. **Run the ETL Pipeline**: Click **Run Full ETL**
   - Fetches real data from the World Bank API for all 55 AU countries
   - This takes 3-5 minutes depending on API response times

3. **Generate Insights**: Go to **Insights Engine** → Click **Regenerate All Insights**
   - The engine analyzes all loaded data and generates findings, alerts, and recommendations

### 3. Navigate the Dashboard

The sidebar provides access to all platform sections:

| Section | What You'll Find |
|---------|-----------------|
| **Dashboard** | Continental KPIs, latest insights, pipeline status |
| **Agenda 2063 Goals** | All 20 goals with progress tracking and detail views |
| **Gender & Youth** | WGYD analytics — women in parliament, youth unemployment, trends |
| **Insights Engine** | Auto-generated findings, alerts, recommendations with filters |
| **Member States** | 55 country profiles, regional filtering, scorecards |
| **Data Pipeline** | ETL controls, run history, data source status |
| **Reports** | Generate executive summaries, gender briefs, Excel exports |

## Dashboard Overview

The main dashboard shows:

- **KPI Cards**: Continental averages for key indicators vs Agenda 2063 targets
  - GDP per capita (target: $12,000)
  - Life expectancy (target: 75 years)
  - Women in parliament (target: 50%)
  - Youth unemployment (target: <6%)
  - Internet penetration (target: 100%)
  - Electricity access (target: 100%)

- **Latest Insights**: The most recent auto-generated findings and alerts

- **Pipeline Status**: Whether data is up to date

## Working with Insights

The Insights Engine generates 6 types of intelligence:

- **Findings**: Key facts ("Only 12 countries have >30% women in parliament")
- **Alerts**: Deteriorating indicators requiring action (shown in red)
- **Trends**: Multi-year patterns (improving or declining)
- **Recommendations**: Suggested interventions based on data
- **Comparisons**: Regional benchmarking
- **Milestones**: Progress toward Agenda 2063 targets

### Filtering Insights

Use the filter buttons to view specific types:
- Click "Alerts" to see critical issues
- Click "Recommendations" to see action items
- Click "Milestones" to see progress updates

## Generating Reports

Navigate to **Reports** and choose:

1. **Executive Summary**: Continental overview with key findings (Pyramid Principle — answer first)
2. **Gender Brief**: Focused on gender equality metrics for WGYD
3. **Country Profile**: Per-country Agenda 2063 scorecard
4. **Excel Export**: Download all data as a multi-sheet Excel file

## Uploading Data

To add supplementary data:

1. Go to **Data Pipeline**
2. Prepare an Excel or CSV file with columns: `country_iso`, `indicator_code`, `year`, `value`
3. Use the upload API: `POST /api/v1/upload/excel`

## API Access

For programmatic access, the full REST API is available at `/docs` (Swagger UI) when the server is running. All endpoints return JSON and require no authentication in the current configuration.

## Troubleshooting

| Issue | Solution |
|-------|---------|
| Dashboard shows no data | Run ETL Pipeline first (Data Pipeline → Run Full ETL) |
| No insights displayed | Generate insights (Insights Engine → Regenerate All Insights) |
| API connection error | Ensure the backend server is running on the configured port |
| Slow ETL run | World Bank API can be slow; the pipeline handles timeouts gracefully |
