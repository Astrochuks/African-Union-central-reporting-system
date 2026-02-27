# Insights Engine Documentation

## Overview

The Insights Engine is the analytical brain of the AU Central Reporting System. Unlike traditional dashboards that only display data, this engine **automatically analyzes data and generates actionable intelligence** as first-class database objects.

After every ETL run, the engine runs **10 specialized generators** that produce findings, alerts, trends, recommendations, comparisons, and milestones — each stored in the `insights` table and surfaced across dashboards, notifications, and executive reports.

**Key principle**: The system tells the data story automatically. Decision-makers don't need to interpret charts — the insights are generated for them.

## Insight Types

| Type | Purpose | Example |
|------|---------|---------|
| **Finding** | Factual observation from data analysis | "Only 12 of 55 AU member states have >30% women in national parliament" |
| **Alert** | Deteriorating indicator requiring attention | "Youth unemployment in North Africa rose 8% year-over-year — 3x the continental average" |
| **Trend** | Multi-year directional pattern | "Gender parity in primary education improving across East Africa — 5-year positive trajectory" |
| **Recommendation** | Data-driven action item | "Prioritize youth employment interventions in Sahel region (5 countries below 2063 target)" |
| **Comparison** | Regional or country benchmarking | "Southern Africa leads in secondary enrollment (68%); Central Africa lags (34%)" |
| **Milestone** | Progress toward Agenda 2063 targets | "Goal 17 (Gender Equality) reached 62% of 2063 target — on track" |

## Severity Levels

| Severity | Color | Meaning |
|----------|-------|---------|
| **Positive** | Green (#009A44) | Good progress, on track |
| **Neutral** | Blue (#2196F3) | Informational, no action needed |
| **Warning** | Gold (#C8A415) | Needs attention, risk of falling behind |
| **Critical** | Red (#D32F2F) | Off track, immediate intervention needed |

## Insight Generators

### 1. Gender Findings Generator
- Analyzes `SG.GEN.PARL.ZS` (women in parliament)
- Counts countries above/below thresholds
- Identifies top and bottom performers
- Generates: findings, comparisons

### 2. Youth Alerts Generator
- Analyzes `SL.UEM.1524.ZS` (youth unemployment)
- Flags countries with >30% youth unemployment
- Detects year-over-year deterioration (>10% increase)
- Generates: alerts (critical severity)

### 3. Health Findings Generator
- Analyzes life expectancy and maternal mortality
- Flags countries below 60-year life expectancy
- Identifies critical maternal mortality (>500 per 100,000)
- Generates: findings, alerts

### 4. Education Findings Generator
- Analyzes adult literacy rates
- Identifies countries below 50% literacy
- Calculates continental averages vs targets
- Generates: findings

### 5. Economic Findings Generator
- Analyzes GDP per capita
- Identifies countries below $1,000/capita
- Tracks progress toward $12,000 Agenda 2063 target
- Generates: findings

### 6. Infrastructure Findings Generator
- Analyzes internet penetration and electricity access
- Flags countries below 20% internet or 50% electricity
- Generates: findings, alerts

### 7. Regional Comparisons Generator
- Compares 5 AU regions on GDP, life expectancy, internet
- Identifies leading and lagging regions
- Generates: comparisons

### 8. Milestone Insights Generator
- Calculates progress toward Agenda 2063 targets for each indicator
- Handles inverted indicators (mortality, unemployment — lower is better)
- Categories: on track (>75%), progressing (60-75%), needs acceleration (30-60%), off track (<30%)
- Generates: milestones

### 9. Trend Insights Generator
- Calculates year-over-year changes
- Identifies continental-level positive or negative trends
- Threshold: >60% of countries improving = positive trend
- Generates: trends

### 10. Recommendations Generator
- Identifies regions with concentrated challenges
- Maps findings to actionable interventions
- Links to specific Agenda 2063 goals
- Generates: recommendations

## Data Structure

```sql
CREATE TABLE insights (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,           -- finding, alert, trend, recommendation, comparison, milestone
    severity TEXT NOT NULL,       -- positive, neutral, warning, critical
    title TEXT NOT NULL,          -- Short headline
    description TEXT NOT NULL,    -- Detailed description with data
    evidence JSONB,              -- Supporting data: {indicator, value, countries, change_pct}
    goal_id INTEGER,             -- Related Agenda 2063 goal
    indicator_id INTEGER,        -- Related indicator
    member_state_id INTEGER,     -- Related country (if country-specific)
    region_id INTEGER,           -- Related region (if region-specific)
    generated_at TIMESTAMPTZ,    -- When generated
    etl_run_id INTEGER,          -- Which ETL run triggered this
    is_active BOOLEAN,           -- Current insight (older deactivated)
    included_in_report BOOLEAN   -- Whether included in a generated report
);
```

## API Endpoints

```bash
# Get all active insights (paginated)
GET /api/v1/insights?type=alert&severity=critical&limit=50

# Get the most recent insights
GET /api/v1/insights/latest?limit=10

# Get critical alerts only
GET /api/v1/insights/critical

# Get insights for a specific Agenda 2063 goal
GET /api/v1/insights/by-goal/17

# Get insight statistics
GET /api/v1/insights/summary

# Trigger insight regeneration
POST /api/v1/insights/generate
```

## How Insights Flow Through the System

```
ETL Run Completes
    │
    ↓
Insights Engine Triggered
    │
    ├── Deactivate old insights (is_active = false)
    │
    ├── Run 10 generators in sequence
    │   ├── Gender findings
    │   ├── Youth alerts
    │   ├── Health findings
    │   ├── Education findings
    │   ├── Economic findings
    │   ├── Infrastructure findings
    │   ├── Regional comparisons
    │   ├── Milestone progress
    │   ├── Trend detection
    │   └── Recommendations
    │
    ├── Insert new insights (is_active = true)
    │
    ↓
Insights appear in:
    ├── Dashboard → "Latest Insights" card
    ├── Insights Engine page → Full feed with filters
    ├── Goal detail pages → Goal-specific insights
    ├── Country profiles → Country-specific insights
    └── Executive Reports → Auto-compiled into sections
```

## Evidence Field (JSONB)

Each insight includes machine-readable evidence:

```json
{
  "indicator": "SG.GEN.PARL.ZS",
  "countries_above_30": 12,
  "countries_below_15": 8,
  "continental_avg": 24.3,
  "total_countries": 48,
  "target": 50,
  "top_3": [
    {"country": "Rwanda", "value": 61.3},
    {"country": "South Africa", "value": 46.4},
    {"country": "Senegal", "value": 44.2}
  ]
}
```

This enables programmatic consumption of insights — not just display, but integration into automated workflows, alerts, and downstream analysis.
