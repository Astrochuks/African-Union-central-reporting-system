# ETL Pipeline Documentation

## Overview

The ETL (Extract, Transform, Load) pipeline is the data backbone of the AU Central Reporting System. It automatically pulls real-time development data from the World Bank API for all **55 African Union member states**, transforms it into a standardized format, and loads it into the Supabase PostgreSQL database.

After each successful ETL run, the **Insights Engine** automatically analyzes the newly loaded data and generates findings, alerts, trends, and recommendations.

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   EXTRACT        │ →   │   TRANSFORM      │ →   │   LOAD           │ →   │   ANALYZE        │
│                  │     │                  │     │                  │     │                  │
│ World Bank API   │     │ Clean values     │     │ Upsert into      │     │ Insights Engine  │
│ 55 countries     │     │ Map to indicators│     │ indicator_values  │     │ Auto-generate    │
│ 24 indicators    │     │ Validate data    │     │ gender_metrics    │     │ findings, alerts │
│ 2000-2024        │     │ Handle nulls     │     │ youth_metrics     │     │ trends, recs     │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

## Data Source

### World Bank API

- **Base URL**: `https://api.worldbank.org/v2/`
- **Format**: JSON
- **Coverage**: All 55 AU member states, 2000-2024
- **Rate Limit**: None (public API)
- **Authentication**: None required

### Indicators Mapped to Agenda 2063

| Indicator Code | Name | Agenda 2063 Goal | Unit |
|---------------|------|------------------|------|
| NY.GDP.PCAP.CD | GDP per capita | Goal 1: High standard of living | USD |
| SI.POV.DDAY | Poverty headcount ($2.15/day) | Goal 1 | % |
| SE.ADT.LITR.ZS | Adult literacy rate | Goal 2: Education | % |
| SE.PRM.ENRR | Primary school enrollment | Goal 2 | % |
| SE.SEC.ENRR | Secondary school enrollment | Goal 2 / Goal 18 | % |
| SP.DYN.LE00.IN | Life expectancy | Goal 3: Health | years |
| SH.STA.MMRT | Maternal mortality ratio | Goal 3 | per 100,000 |
| SH.DYN.MORT | Under-5 mortality rate | Goal 3 | per 1,000 |
| NV.IND.MANF.ZS | Manufacturing value added | Goal 4: Economies | % GDP |
| BX.KLT.DINV.WD.GD.ZS | FDI net inflows | Goal 4 | % GDP |
| NV.AGR.TOTL.ZS | Agriculture value added | Goal 5: Agriculture | % GDP |
| EN.ATM.CO2E.PC | CO2 emissions per capita | Goal 7: Climate | metric tons |
| EG.FEC.RNEW.ZS | Renewable energy | Goal 7 | % |
| IT.NET.USER.ZS | Internet users | Goal 10: Infrastructure | % |
| IT.CEL.SETS.P2 | Mobile subscriptions | Goal 10 | per 100 |
| EG.ELC.ACCS.ZS | Electricity access | Goal 10 | % |
| SG.GEN.PARL.ZS | Women in parliament | Goal 17: Gender equality | % |
| SE.ENR.PRIM.FM.ZS | Gender parity (education) | Goal 17 | ratio |
| SL.TLF.CACT.FE.ZS | Female labor force | Goal 17 | % |
| SL.UEM.1524.ZS | Youth unemployment | Goal 18: Youth | % |
| SH.STA.BRTC.ZS | Skilled birth attendance | Goal 3 | % |
| GC.TAX.TOTL.GD.ZS | Tax revenue | Goal 20: Financing | % GDP |
| SP.ADO.TFRT | Adolescent fertility rate | Goal 17 | per 1,000 |
| SH.HIV.INCD.TL.P3 | HIV incidence | Goal 3 | per 1,000 |

### 55 AU Member States (ISO2 Codes)

```
DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW
KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG
TN UG ZM ZW
```

## Pipeline Execution

### Trigger

```bash
# Via API
POST /api/v1/pipeline/trigger

# Request body (optional — defaults to all indicators and countries)
{
  "indicators": ["SG.GEN.PARL.ZS", "SL.UEM.1524.ZS"],
  "countries": ["NG", "ZA", "KE"],
  "years": [2020, 2021, 2022, 2023]
}
```

### Pipeline Steps

1. **Create ETL Run Record**: Inserts a tracking record in `etl_runs` table with status "running"
2. **Build Lookups**: Maps ISO codes to `member_state_id` and indicator codes to `indicator_id`
3. **Fetch Data**: For each indicator, calls World Bank API with all 55 country codes
4. **Transform**: Cleans null values, maps country codes, validates data types
5. **Load**: Upserts into `indicator_values` table (conflict on indicator_id + member_state_id + year)
6. **Update Specialty Tables**: Gender indicators → `gender_metrics`, Youth indicators → `youth_metrics`
7. **Generate Insights**: Triggers the Insights Engine to analyze all new data
8. **Update ETL Run**: Sets status to "completed" with record counts

### Error Handling

- Individual indicator failures don't stop the pipeline
- HTTP timeouts: 120 seconds per World Bank API request
- Pagination: Handles multi-page responses automatically (per_page=10000)
- Null values: Skipped during loading (only non-null values stored)
- Duplicate records: Handled via upsert with unique constraint

### Monitoring

```bash
# Check pipeline status
GET /api/v1/pipeline/status

# Response includes:
# - All ETL run history
# - Records processed/failed per run
# - Total data records in system
```

## Data Flow Diagram

```
World Bank API
    │
    ├── NY.GDP.PCAP.CD (55 countries × 25 years = ~1,375 records)
    ├── SG.GEN.PARL.ZS (55 × 25 = ~1,375 records)  ──→ gender_metrics.women_parliament_pct
    ├── SL.UEM.1524.ZS (55 × 25 = ~1,375 records)  ──→ youth_metrics.youth_unemployment_pct
    ├── ... (21 more indicators)
    │
    ↓
indicator_values table (~15,000+ records)
    │
    ↓
Insights Engine (auto-generates 20-40 insights per run)
    │
    ↓
insights table → Dashboard → Reports
```

## Seed Database

Before the first ETL run, seed the reference data:

```bash
POST /api/v1/pipeline/seed
```

This loads:
- 5 Regions (North, West, Central, East, Southern Africa)
- 7 Aspirations
- 20 Goals (mapped to aspirations)
- 55 Member States (with region assignments)
- 24 Indicator Definitions (with Agenda 2063 goal mappings)
- 1 Data Source record (World Bank API)
