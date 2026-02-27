# AU Central Reporting System -- API Reference

**Version:** 1.0.0
**Base URL:** `https://<host>/api/v1`
**Local Development:** `http://localhost:8000/api/v1`
**Interactive Docs:** `/docs` (Swagger UI) | `/redoc` (ReDoc)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Responses](#error-responses)
4. [Enumerations](#enumerations)
5. [Health](#1-health)
6. [Dashboard](#2-dashboard)
7. [Agenda 2063 Goals](#3-agenda-2063-goals)
8. [Indicators](#4-indicators)
9. [Member States](#5-member-states)
10. [Gender Analytics](#6-gender-analytics)
11. [Youth Analytics](#7-youth-analytics)
12. [Insights Engine](#8-insights-engine)
13. [ETL Pipeline](#9-etl-pipeline)
14. [Data Upload](#10-data-upload)
15. [Reports](#11-reports)
16. [Data Quality](#12-data-quality)

---

## Overview

The AU Central Reporting System API is a FastAPI REST service that provides data intelligence for the African Union. It tracks Agenda 2063 progress across all 55 member states, with automated insights generation, gender and youth analytics, and executive reporting capabilities.

**Key characteristics:**

- All responses are JSON unless otherwise noted (Excel export returns binary).
- Timestamps use ISO 8601 format in UTC.
- Pagination is available on list endpoints via `limit` and `offset` query parameters.
- The ETL pipeline pulls real data from the World Bank API for 24 development indicators.

---

## Authentication

The API is currently **open** (no authentication required). The system is designed for integration with **Supabase Row-Level Security (RLS)** for production deployment. When RLS is enabled, requests will require a valid Supabase JWT token in the `Authorization` header:

```
Authorization: Bearer <supabase_jwt_token>
```

---

## Error Responses

All endpoints return errors in a consistent JSON format:

```json
{
  "error": "Description of what went wrong"
}
```

Standard HTTP status codes are used:

| Status Code | Meaning |
|---|---|
| `200` | Success |
| `404` | Resource not found (returned as 200 with `{"error": "..."}` in body) |
| `422` | Validation error (invalid parameters) |
| `500` | Internal server error |

**Validation Error (422) format:**

```json
{
  "detail": [
    {
      "loc": ["query", "parameter_name"],
      "msg": "description of the validation error",
      "type": "error_type"
    }
  ]
}
```

---

## Enumerations

The following string enumerations are used across the API:

**InsightType**

| Value | Description |
|---|---|
| `finding` | Data-driven observation |
| `alert` | Condition requiring attention |
| `trend` | Directional change over time |
| `recommendation` | Suggested action |
| `comparison` | Cross-country or cross-region analysis |
| `milestone` | Progress toward an Agenda 2063 target |

**InsightSeverity**

| Value | Description |
|---|---|
| `positive` | Favorable outcome or trend |
| `neutral` | Informational, no action needed |
| `warning` | Requires monitoring |
| `critical` | Requires immediate attention |

**ETLStatus**

| Value | Description |
|---|---|
| `running` | Pipeline currently executing |
| `completed` | Pipeline finished successfully |
| `failed` | Pipeline encountered a fatal error |

**ReportType**

| Value | Description |
|---|---|
| `executive_summary` | Comprehensive Agenda 2063 overview |
| `gender_brief` | Gender equality focused brief |
| `youth_brief` | Youth development focused brief |
| `country_profile` | Single country deep dive |
| `goal_progress` | Single goal progress report |

**DataQuality**

| Value | Description |
|---|---|
| `verified` | Value confirmed from official source |
| `estimated` | Value is an estimate |
| `missing` | Value is unavailable |

**Region**

| Value |
|---|
| `North Africa` |
| `West Africa` |
| `Central Africa` |
| `East Africa` |
| `Southern Africa` |

---

## 1. Health

### `GET /health`

Check API and database connectivity status.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `status` | string | Always `"healthy"` if the API is responding |
| `timestamp` | string | ISO 8601 UTC timestamp |
| `environment` | string | Current environment (e.g., `"development"`, `"production"`) |
| `version` | string | API version (e.g., `"1.0.0"`) |
| `database` | string | Database connection status (`"connected"`, `"disconnected"`, or error message) |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/health
```

**Example Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-02-27T14:30:00.000000+00:00",
  "environment": "development",
  "version": "1.0.0",
  "database": "connected"
}
```

---

## 2. Dashboard

### `GET /dashboard/summary`

Get the main dashboard summary with KPIs, latest ETL run status, and recent auto-generated insights.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `total_member_states` | integer | Number of AU member states (55) |
| `total_goals` | integer | Number of Agenda 2063 goals (20) |
| `total_indicators` | integer | Number of tracked indicators |
| `total_data_points` | integer | Total indicator value records in the database |
| `avg_goal_progress` | float or null | Average progress across all 20 goals (0-100) |
| `latest_etl_run` | object or null | Most recent ETL run record (see ETL Run object) |
| `recent_insights` | array | Latest 10 active insights |
| `kpis` | array | Key performance indicators with labels, values, and targets |

**KPI object:**

| Field | Type | Description |
|---|---|---|
| `label` | string | Human-readable KPI name (e.g., `"Avg GDP per Capita"`) |
| `value` | string | Formatted current value (e.g., `"$2,145"`) |
| `target` | string | Agenda 2063 target (e.g., `"$12,000"`) |
| `unit` | string | Unit of measurement |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/dashboard/summary
```

**Example Response:**

```json
{
  "total_member_states": 55,
  "total_goals": 20,
  "total_indicators": 24,
  "total_data_points": 18750,
  "avg_goal_progress": 42.3,
  "latest_etl_run": {
    "id": 5,
    "data_source_id": 1,
    "started_at": "2026-02-27T12:00:00+00:00",
    "completed_at": "2026-02-27T12:05:32+00:00",
    "records_processed": 15230,
    "records_failed": 0,
    "insights_generated": 28,
    "status": "completed"
  },
  "recent_insights": [
    {
      "id": 142,
      "type": "alert",
      "severity": "critical",
      "title": "12 AU countries have youth unemployment above 30%",
      "description": "Critical youth employment crisis...",
      "generated_at": "2026-02-27T12:05:32+00:00",
      "is_active": true
    }
  ],
  "kpis": [
    {"label": "Avg GDP per Capita", "value": "$2,145", "target": "$12,000", "unit": "USD"},
    {"label": "Avg Life Expectancy", "value": "63.2 years", "target": "75 years", "unit": "years"},
    {"label": "Women in Parliament", "value": "24.1%", "target": "50%", "unit": "%"},
    {"label": "Youth Unemployment", "value": "22.8%", "target": "<6%", "unit": "%"},
    {"label": "Internet Penetration", "value": "33.5%", "target": "100%", "unit": "%"},
    {"label": "Electricity Access", "value": "56.2%", "target": "100%", "unit": "%"}
  ]
}
```

---

## 3. Agenda 2063 Goals

### `GET /goals`

List all 20 Agenda 2063 goals with their parent aspiration and current progress.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `goals` | array | Array of goal objects |
| `total` | integer | Total number of goals |

**Goal object:**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Goal database ID |
| `number` | integer | Goal number (1-20) |
| `name` | string | Goal name |
| `description` | string or null | Goal description |
| `target_2063` | string or null | Target for the year 2063 |
| `aspiration_id` | integer | Parent aspiration ID |
| `current_progress` | float or null | Progress percentage (0-100) |
| `aspirations` | object | Parent aspiration with `number` and `name` |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/goals
```

**Example Response:**

```json
{
  "goals": [
    {
      "id": 1,
      "number": 1,
      "name": "A high standard of living, quality of life and well-being for all citizens",
      "description": "Achieve inclusive growth and sustainable development...",
      "target_2063": "GDP per capita of $12,000+",
      "aspiration_id": 1,
      "current_progress": 35.2,
      "aspirations": {
        "number": 1,
        "name": "A Prosperous Africa"
      }
    }
  ],
  "total": 20
}
```

---

### `GET /goals/{goal_id}`

Get a specific goal with all its associated indicators.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `goal_id` | integer | Yes | Goal database ID |

**Response:**

| Field | Type | Description |
|---|---|---|
| `goal` | object | Full goal object with aspiration details |
| `indicators` | array | All indicators mapped to this goal |

**Indicator object:**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Indicator database ID |
| `goal_id` | integer | Parent goal ID |
| `name` | string | Indicator name |
| `code` | string or null | World Bank indicator code (e.g., `"NY.GDP.PCAP.CD"`) |
| `unit` | string or null | Unit of measurement (e.g., `"%"`, `"USD"`, `"years"`) |
| `source` | string or null | Data source (e.g., `"World Bank"`) |
| `baseline_value` | float or null | Baseline value |
| `baseline_year` | integer or null | Baseline year |
| `target_value` | float or null | 2063 target value |
| `target_year` | integer | Target year (default: 2063) |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/goals/1
```

**Example Response:**

```json
{
  "goal": {
    "id": 1,
    "number": 1,
    "name": "A high standard of living, quality of life and well-being for all citizens",
    "aspiration_id": 1,
    "current_progress": 35.2,
    "aspirations": {
      "number": 1,
      "name": "A Prosperous Africa"
    }
  },
  "indicators": [
    {
      "id": 1,
      "goal_id": 1,
      "name": "GDP per capita (current US$)",
      "code": "NY.GDP.PCAP.CD",
      "unit": "USD",
      "source": "World Bank",
      "baseline_value": 1500.0,
      "baseline_year": 2013,
      "target_value": 12000.0,
      "target_year": 2063
    },
    {
      "id": 2,
      "goal_id": 1,
      "name": "Poverty headcount ratio ($2.15/day)",
      "code": "SI.POV.DDAY",
      "unit": "%",
      "source": "World Bank",
      "baseline_value": 42.0,
      "baseline_year": 2013,
      "target_value": 0.0,
      "target_year": 2063
    }
  ]
}
```

---

### `GET /goals/{goal_id}/progress`

Get time-series progress data for a goal. Returns continental averages per year for each indicator under this goal.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `goal_id` | integer | Yes | Goal database ID |

**Response:**

| Field | Type | Description |
|---|---|---|
| `goal` | object | Goal details |
| `progress` | array | Array of indicator progress objects |

**Indicator progress object:**

| Field | Type | Description |
|---|---|---|
| `indicator` | string | Indicator name |
| `code` | string or null | World Bank indicator code |
| `target` | float or null | Target value |
| `time_series` | array | Year-by-year continental averages |

**Time series entry:**

| Field | Type | Description |
|---|---|---|
| `year` | integer | Year |
| `avg_value` | float | Continental average for that year |
| `countries` | integer | Number of countries with data |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/goals/1/progress
```

**Example Response:**

```json
{
  "goal": {
    "id": 1,
    "number": 1,
    "name": "A high standard of living, quality of life and well-being for all citizens"
  },
  "progress": [
    {
      "indicator": "GDP per capita (current US$)",
      "code": "NY.GDP.PCAP.CD",
      "target": 12000.0,
      "time_series": [
        {"year": 2018, "avg_value": 1823.45, "countries": 52},
        {"year": 2019, "avg_value": 1891.12, "countries": 53},
        {"year": 2020, "avg_value": 1756.33, "countries": 51},
        {"year": 2021, "avg_value": 1902.78, "countries": 52},
        {"year": 2022, "avg_value": 2045.60, "countries": 54}
      ]
    }
  ]
}
```

---

### `GET /goals/{goal_id}/by-region`

Get goal progress broken down by AU region (North, West, Central, East, Southern Africa).

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `goal_id` | integer | Yes | Goal database ID |

**Response:**

| Field | Type | Description |
|---|---|---|
| `goal_id` | integer | Goal database ID |
| `regions` | object | Map of region name to `{average, countries}` |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/goals/1/by-region
```

**Example Response:**

```json
{
  "goal_id": 1,
  "regions": {
    "North Africa": {"average": 3845.22, "countries": 18},
    "Southern Africa": {"average": 3210.50, "countries": 22},
    "West Africa": {"average": 1456.78, "countries": 30},
    "East Africa": {"average": 1123.90, "countries": 25},
    "Central Africa": {"average": 1089.44, "countries": 15}
  }
}
```

---

### `GET /goals/{goal_id}/insights`

Get all active auto-generated insights for a specific goal.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `goal_id` | integer | Yes | Goal database ID |

**Response:**

| Field | Type | Description |
|---|---|---|
| `insights` | array | Array of insight objects (see [Insight object](#insight-object)) |
| `total` | integer | Total number of insights for this goal |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/goals/3/insights
```

**Example Response:**

```json
{
  "insights": [
    {
      "id": 45,
      "type": "finding",
      "severity": "warning",
      "title": "Continental average life expectancy: 63.2 years (target: 75)",
      "description": "Across 48 AU member states, the average life expectancy is 63.2 years. 12 countries remain below 60 years. The Agenda 2063 target is 75 years.",
      "evidence": {
        "indicator": "SP.DYN.LE00.IN",
        "continental_avg": 63.2,
        "countries_below_60": 12,
        "target": 75
      },
      "goal_id": 3,
      "indicator_id": null,
      "member_state_id": null,
      "generated_at": "2026-02-27T12:05:32+00:00",
      "etl_run_id": 5,
      "is_active": true,
      "included_in_report": false
    }
  ],
  "total": 3
}
```

---

## 4. Indicators

### `GET /indicators`

List all indicator definitions, optionally filtered by goal.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `goal_id` | integer | No | null | Filter indicators by goal ID |

**Response:**

| Field | Type | Description |
|---|---|---|
| `indicators` | array | Array of indicator objects with parent goal info |
| `total` | integer | Number of indicators returned |

**Indicator object (with goal join):**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Indicator database ID |
| `goal_id` | integer | Parent goal ID |
| `name` | string | Indicator name |
| `code` | string or null | World Bank code |
| `unit` | string or null | Unit of measurement |
| `source` | string or null | Data source |
| `baseline_value` | float or null | Baseline value |
| `baseline_year` | integer or null | Baseline year |
| `target_value` | float or null | Target value |
| `target_year` | integer | Target year |
| `goals` | object | `{number, name}` of parent goal |

**Example Request:**

```bash
curl "http://localhost:8000/api/v1/indicators?goal_id=1"
```

**Example Response:**

```json
{
  "indicators": [
    {
      "id": 1,
      "goal_id": 1,
      "name": "GDP per capita (current US$)",
      "code": "NY.GDP.PCAP.CD",
      "unit": "USD",
      "source": "World Bank",
      "baseline_value": 1500.0,
      "baseline_year": 2013,
      "target_value": 12000.0,
      "target_year": 2063,
      "goals": {"number": 1, "name": "A high standard of living, quality of life and well-being for all citizens"}
    }
  ],
  "total": 2
}
```

---

### `GET /indicators/{indicator_id}/values`

Get time-series data points for an indicator, optionally filtered by country.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `indicator_id` | integer | Yes | Indicator database ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `country` | string | No | null | ISO 3166-1 alpha-2 code to filter by country (e.g., `NG`, `ZA`) |

**Response:**

| Field | Type | Description |
|---|---|---|
| `indicator_id` | integer | Indicator database ID |
| `indicator_name` | string | Indicator name |
| `unit` | string or null | Unit of measurement |
| `country` | string or null | Country filter applied (if any) |
| `values` | array | Array of value objects |

**Value object:**

| Field | Type | Description |
|---|---|---|
| `year` | integer | Year of observation |
| `value` | float or null | Measured value |
| `country` | string or null | Country name |

**Example Request:**

```bash
curl "http://localhost:8000/api/v1/indicators/1/values?country=NG"
```

**Example Response:**

```json
{
  "indicator_id": 1,
  "indicator_name": "GDP per capita (current US$)",
  "unit": "USD",
  "country": "NG",
  "values": [
    {"year": 2018, "value": 2028.18, "country": "Nigeria"},
    {"year": 2019, "value": 2229.86, "country": "Nigeria"},
    {"year": 2020, "value": 2097.09, "country": "Nigeria"},
    {"year": 2021, "value": 2065.75, "country": "Nigeria"},
    {"year": 2022, "value": 2184.38, "country": "Nigeria"}
  ]
}
```

---

### `GET /indicators/{indicator_id}/ranking`

Rank all countries by an indicator value. Returns the latest available value per country unless a specific year is given.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `indicator_id` | integer | Yes | Indicator database ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `year` | integer | No | null | Filter by specific year. If omitted, uses latest value per country. |
| `limit` | integer | No | 55 | Maximum number of results (max: 55) |

**Response:**

| Field | Type | Description |
|---|---|---|
| `ranking` | array | Array of ranked country objects |

**Ranked country object:**

| Field | Type | Description |
|---|---|---|
| `rank` | integer | Ranking position (1 = highest value) |
| `country_name` | string | Country name |
| `iso_code` | string | ISO 3166-1 alpha-2 code |
| `value` | float | Indicator value |
| `year` | integer | Year of the data point |
| `region` | string or null | AU region name |

**Example Request:**

```bash
curl "http://localhost:8000/api/v1/indicators/1/ranking?limit=5"
```

**Example Response:**

```json
{
  "ranking": [
    {"rank": 1, "country_name": "Seychelles", "iso_code": "SC", "value": 14653.21, "year": 2022, "region": "East Africa"},
    {"rank": 2, "country_name": "Mauritius", "iso_code": "MU", "value": 10216.78, "year": 2022, "region": "East Africa"},
    {"rank": 3, "country_name": "Libya", "iso_code": "LY", "value": 6357.45, "year": 2022, "region": "North Africa"},
    {"rank": 4, "country_name": "Botswana", "iso_code": "BW", "value": 6348.90, "year": 2022, "region": "Southern Africa"},
    {"rank": 5, "country_name": "South Africa", "iso_code": "ZA", "value": 6139.12, "year": 2022, "region": "Southern Africa"}
  ]
}
```

---

### `GET /indicators/{indicator_id}/trend`

Get continental trend analysis for an indicator. Returns year-by-year aggregate statistics and overall trend direction.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `indicator_id` | integer | Yes | Indicator database ID |

**Response:**

| Field | Type | Description |
|---|---|---|
| `indicator` | object | Full indicator details |
| `trend` | array | Year-by-year statistics |
| `direction` | string | Overall trend direction: `"improving"`, `"declining"`, `"stable"`, or `"insufficient_data"` |

**Trend entry:**

| Field | Type | Description |
|---|---|---|
| `year` | integer | Year |
| `avg` | float | Continental average |
| `min` | float | Minimum country value |
| `max` | float | Maximum country value |
| `countries` | integer | Number of countries with data |

Direction is determined by comparing the most recent year's average to the average from 3 years prior. A change greater than +5% is `"improving"`, less than -5% is `"declining"`, and anything in between is `"stable"`.

**Example Request:**

```bash
curl http://localhost:8000/api/v1/indicators/1/trend
```

**Example Response:**

```json
{
  "indicator": {
    "id": 1,
    "goal_id": 1,
    "name": "GDP per capita (current US$)",
    "code": "NY.GDP.PCAP.CD",
    "unit": "USD",
    "source": "World Bank",
    "target_value": 12000.0
  },
  "trend": [
    {"year": 2019, "avg": 1891.12, "min": 221.45, "max": 14320.00, "countries": 53},
    {"year": 2020, "avg": 1756.33, "min": 198.12, "max": 13890.00, "countries": 51},
    {"year": 2021, "avg": 1902.78, "min": 215.33, "max": 14100.00, "countries": 52},
    {"year": 2022, "avg": 2045.60, "min": 230.88, "max": 14653.21, "countries": 54}
  ],
  "direction": "improving"
}
```

---

## 5. Member States

### `GET /countries`

List all 55 AU member states, optionally filtered by region.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `region` | string | No | null | Filter by region name (e.g., `"North Africa"`, `"West Africa"`) |

**Response:**

| Field | Type | Description |
|---|---|---|
| `countries` | array | Array of member state objects |
| `total` | integer | Number of countries returned |

**Member state object:**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Database ID |
| `name` | string | Country name |
| `iso_code` | string | ISO 3166-1 alpha-2 code |
| `iso3_code` | string or null | ISO 3166-1 alpha-3 code |
| `region_id` | integer or null | Region database ID |
| `population` | integer or null | Population |
| `gdp_per_capita` | float or null | GDP per capita (USD) |
| `au_membership_year` | integer or null | Year of AU/OAU membership |
| `regions` | object | `{name}` of the region |

**Example Request:**

```bash
curl "http://localhost:8000/api/v1/countries?region=East Africa"
```

**Example Response:**

```json
{
  "countries": [
    {
      "id": 12,
      "name": "Kenya",
      "iso_code": "KE",
      "iso3_code": "KEN",
      "region_id": 4,
      "population": null,
      "gdp_per_capita": null,
      "au_membership_year": 1963,
      "regions": {"name": "East Africa"}
    },
    {
      "id": 28,
      "name": "Rwanda",
      "iso_code": "RW",
      "iso3_code": "RWA",
      "region_id": 4,
      "population": null,
      "gdp_per_capita": null,
      "au_membership_year": 1963,
      "regions": {"name": "East Africa"}
    }
  ],
  "total": 14
}
```

---

### `GET /countries/{iso_code}/profile`

Get a comprehensive country profile including latest indicator values, gender metrics, and youth metrics.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `iso_code` | string | Yes | ISO 3166-1 alpha-2 code (e.g., `NG`, `ZA`, `KE`). Case-insensitive. |

**Response:**

| Field | Type | Description |
|---|---|---|
| `country` | object | Full member state object with region |
| `key_indicators` | array | Latest values for all indicators |
| `gender_metrics` | object or null | Latest gender metric record |
| `youth_metrics` | object or null | Latest youth metric record |

**Key indicator entry:**

| Field | Type | Description |
|---|---|---|
| `indicator` | string | Indicator name |
| `code` | string | World Bank indicator code |
| `value` | float | Latest measured value |
| `year` | integer | Year of the data point |
| `unit` | string or null | Unit of measurement |
| `goal` | string or null | Parent Agenda 2063 goal name |

**Gender metrics object:**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Record ID |
| `member_state_id` | integer | Country ID |
| `year` | integer | Year |
| `women_parliament_pct` | float or null | Women in national parliament (%) |
| `gender_parity_education` | float or null | Gender parity index in primary education |
| `women_labor_force_pct` | float or null | Female labor force participation (%) |
| `maternal_mortality_ratio` | float or null | Maternal mortality per 100,000 live births |
| `adolescent_fertility_rate` | float or null | Births per 1,000 women ages 15-19 |

**Youth metrics object:**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Record ID |
| `member_state_id` | integer | Country ID |
| `year` | integer | Year |
| `youth_unemployment_pct` | float or null | Youth unemployment rate (%) |
| `youth_literacy_pct` | float or null | Youth literacy rate (%) |
| `youth_neet_pct` | float or null | Youth not in education, employment, or training (%) |
| `secondary_enrollment_pct` | float or null | Secondary school enrollment (%) |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/countries/NG/profile
```

**Example Response:**

```json
{
  "country": {
    "id": 39,
    "name": "Nigeria",
    "iso_code": "NG",
    "iso3_code": "NGA",
    "region_id": 2,
    "au_membership_year": 1963,
    "regions": {"name": "West Africa"}
  },
  "key_indicators": [
    {"indicator": "GDP per capita (current US$)", "code": "NY.GDP.PCAP.CD", "value": 2184.38, "year": 2022, "unit": "USD", "goal": "A high standard of living..."},
    {"indicator": "Life expectancy at birth", "code": "SP.DYN.LE00.IN", "value": 52.7, "year": 2022, "unit": "years", "goal": "Healthy and well-nourished citizens"},
    {"indicator": "Women in parliament (%)", "code": "SG.GEN.PARL.ZS", "value": 3.6, "year": 2023, "unit": "%", "goal": "Full gender equality..."}
  ],
  "gender_metrics": {
    "id": 102,
    "member_state_id": 39,
    "year": 2023,
    "women_parliament_pct": 3.6,
    "gender_parity_education": 0.94,
    "women_labor_force_pct": 48.2,
    "maternal_mortality_ratio": 1047.0,
    "adolescent_fertility_rate": 100.8
  },
  "youth_metrics": {
    "id": 88,
    "member_state_id": 39,
    "year": 2022,
    "youth_unemployment_pct": 14.2,
    "youth_literacy_pct": null,
    "youth_neet_pct": null,
    "secondary_enrollment_pct": 42.5
  }
}
```

---

### `GET /countries/{iso_code}/scorecard`

Get an Agenda 2063 scorecard for a country, showing progress across all 20 goals with indicator-level detail.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `iso_code` | string | Yes | ISO 3166-1 alpha-2 code. Case-insensitive. |

**Response:**

| Field | Type | Description |
|---|---|---|
| `country` | object | Member state object with region |
| `scorecard` | array | Array of goal score objects (one per goal) |
| `insights` | array | Country-specific insights |

**Goal score object:**

| Field | Type | Description |
|---|---|---|
| `goal_number` | integer | Goal number (1-20) |
| `goal_name` | string | Goal name |
| `aspiration` | string or null | Parent aspiration name |
| `indicators` | array | Available indicator values for this goal |
| `data_completeness` | string | Fraction of indicators with data (e.g., `"2/3"`) |

**Scorecard indicator entry:**

| Field | Type | Description |
|---|---|---|
| `indicator` | string | Indicator name |
| `value` | float | Measured value |
| `year` | integer | Year of measurement |
| `unit` | string or null | Unit |
| `target` | float or null | Agenda 2063 target value |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/countries/RW/scorecard
```

**Example Response:**

```json
{
  "country": {
    "id": 40,
    "name": "Rwanda",
    "iso_code": "RW",
    "regions": {"name": "East Africa"}
  },
  "scorecard": [
    {
      "goal_number": 1,
      "goal_name": "A high standard of living, quality of life and well-being for all citizens",
      "aspiration": "A Prosperous Africa",
      "indicators": [
        {"indicator": "GDP per capita (current US$)", "value": 822.34, "year": 2022, "unit": "USD", "target": 12000.0},
        {"indicator": "Poverty headcount ratio ($2.15/day)", "value": 52.3, "year": 2022, "unit": "%", "target": 0.0}
      ],
      "data_completeness": "2/2"
    },
    {
      "goal_number": 17,
      "goal_name": "Full gender equality in all spheres of life",
      "aspiration": "An Africa whose development is people-driven...",
      "indicators": [
        {"indicator": "Women in parliament (%)", "value": 61.3, "year": 2023, "unit": "%", "target": 50.0}
      ],
      "data_completeness": "1/3"
    }
  ],
  "insights": [
    {
      "type": "finding",
      "severity": "positive",
      "title": "Rwanda leads AU in women's parliamentary representation at 61.3%",
      "description": "Rwanda exceeds the Agenda 2063 target of 50%..."
    }
  ]
}
```

---

### `GET /countries/compare`

Compare multiple countries side by side on key indicators.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `countries` | string | Yes | -- | Comma-separated ISO 3166-1 alpha-2 codes (e.g., `NG,ZA,KE`) |
| `indicator_code` | string | No | null | Filter to a specific World Bank indicator code |

**Response:**

| Field | Type | Description |
|---|---|---|
| `comparison` | array | Array of country comparison objects |

**Country comparison object:**

| Field | Type | Description |
|---|---|---|
| `country` | string | Country name |
| `iso_code` | string | ISO code |
| `region` | string or null | Region name |
| `indicators` | array | Latest indicator values for this country |

**Comparison indicator entry:**

| Field | Type | Description |
|---|---|---|
| `indicator` | string | Indicator name |
| `code` | string | World Bank indicator code |
| `value` | float | Latest measured value |
| `year` | integer | Year of measurement |
| `unit` | string or null | Unit of measurement |

**Example Request:**

```bash
curl "http://localhost:8000/api/v1/countries/compare?countries=NG,ZA,KE&indicator_code=NY.GDP.PCAP.CD"
```

**Example Response:**

```json
{
  "comparison": [
    {
      "country": "Nigeria",
      "iso_code": "NG",
      "region": "West Africa",
      "indicators": [
        {"indicator": "GDP per capita (current US$)", "code": "NY.GDP.PCAP.CD", "value": 2184.38, "year": 2022, "unit": "USD"}
      ]
    },
    {
      "country": "South Africa",
      "iso_code": "ZA",
      "region": "Southern Africa",
      "indicators": [
        {"indicator": "GDP per capita (current US$)", "code": "NY.GDP.PCAP.CD", "value": 6139.12, "year": 2022, "unit": "USD"}
      ]
    },
    {
      "country": "Kenya",
      "iso_code": "KE",
      "region": "East Africa",
      "indicators": [
        {"indicator": "GDP per capita (current US$)", "code": "NY.GDP.PCAP.CD", "value": 2099.33, "year": 2022, "unit": "USD"}
      ]
    }
  ]
}
```

---

## 6. Gender Analytics

### `GET /gender/overview`

Get continental-level gender summary metrics across all AU member states.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `continental_avg_women_parliament` | float or null | Average % of women in parliament |
| `continental_avg_labor_force` | float or null | Average female labor force participation (%) |
| `continental_avg_parity_index` | float or null | Average gender parity index in primary education |
| `countries_above_30pct_parliament` | integer | Number of countries with >30% women in parliament |
| `total_countries_with_data` | integer | Number of countries with any gender data |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/gender/overview
```

**Example Response:**

```json
{
  "continental_avg_women_parliament": 24.12,
  "continental_avg_labor_force": 55.83,
  "continental_avg_parity_index": 0.945,
  "countries_above_30pct_parliament": 14,
  "total_countries_with_data": 48
}
```

---

### `GET /gender/by-country`

Get the latest gender metrics for each AU member state.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `data` | array | Array of gender metric records (latest per country) |
| `total` | integer | Number of countries with data |

Each record in `data` contains all fields from the [gender metrics object](#gender-metrics-object) plus a nested `member_states` object with `name`, `iso_code`, and `regions.name`.

**Example Request:**

```bash
curl http://localhost:8000/api/v1/gender/by-country
```

**Example Response:**

```json
{
  "data": [
    {
      "id": 210,
      "member_state_id": 40,
      "year": 2023,
      "women_parliament_pct": 61.3,
      "gender_parity_education": 1.02,
      "women_labor_force_pct": 83.9,
      "maternal_mortality_ratio": 248.0,
      "adolescent_fertility_rate": 37.2,
      "member_states": {
        "name": "Rwanda",
        "iso_code": "RW",
        "regions": {"name": "East Africa"}
      }
    }
  ],
  "total": 48
}
```

---

### `GET /gender/trends`

Get multi-year trend data for key gender metrics (continental averages per year).

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `trends` | array | Year-by-year continental gender averages |

**Trend entry:**

| Field | Type | Description |
|---|---|---|
| `year` | integer | Year |
| `avg_women_parliament` | float or null | Continental average % women in parliament |
| `avg_labor_force` | float or null | Continental average female labor force participation |
| `avg_parity_index` | float or null | Continental average gender parity index |
| `countries_reporting` | integer | Maximum count of countries reporting any metric |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/gender/trends
```

**Example Response:**

```json
{
  "trends": [
    {"year": 2018, "avg_women_parliament": 22.5, "avg_labor_force": 54.8, "avg_parity_index": 0.932, "countries_reporting": 45},
    {"year": 2019, "avg_women_parliament": 23.1, "avg_labor_force": 55.0, "avg_parity_index": 0.938, "countries_reporting": 46},
    {"year": 2020, "avg_women_parliament": 23.8, "avg_labor_force": 55.2, "avg_parity_index": 0.941, "countries_reporting": 44},
    {"year": 2021, "avg_women_parliament": 24.0, "avg_labor_force": 55.6, "avg_parity_index": 0.943, "countries_reporting": 47},
    {"year": 2022, "avg_women_parliament": 24.1, "avg_labor_force": 55.8, "avg_parity_index": 0.945, "countries_reporting": 48}
  ]
}
```

---

### `GET /gender/parity-index`

Rank countries by gender parity index in primary education. Rankings are sorted by proximity to perfect parity (1.0), with the closest to 1.0 ranked first.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `ranking` | array | Array of ranked country objects |

**Parity ranking entry:**

| Field | Type | Description |
|---|---|---|
| `rank` | integer | Ranking position (1 = closest to parity) |
| `country` | string | Country name |
| `iso_code` | string | ISO code |
| `parity_index` | float | Gender parity index value |
| `year` | integer | Year of measurement |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/gender/parity-index
```

**Example Response:**

```json
{
  "ranking": [
    {"rank": 1, "country": "Rwanda", "iso_code": "RW", "parity_index": 1.02, "year": 2022},
    {"rank": 2, "country": "Tanzania", "iso_code": "TZ", "parity_index": 1.03, "year": 2022},
    {"rank": 3, "country": "Mauritius", "iso_code": "MU", "parity_index": 0.97, "year": 2022},
    {"rank": 4, "country": "South Africa", "iso_code": "ZA", "parity_index": 0.96, "year": 2022}
  ]
}
```

---

## 7. Youth Analytics

### `GET /youth/overview`

Get continental-level youth summary metrics.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `continental_avg_unemployment` | float or null | Average youth unemployment rate (%) |
| `continental_avg_enrollment` | float or null | Average secondary school enrollment (%) |
| `countries_high_unemployment` | integer | Number of countries with youth unemployment above 25% |
| `total_countries_with_data` | integer | Number of countries with any youth data |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/youth/overview
```

**Example Response:**

```json
{
  "continental_avg_unemployment": 22.84,
  "continental_avg_enrollment": 49.12,
  "countries_high_unemployment": 15,
  "total_countries_with_data": 42
}
```

---

### `GET /youth/by-country`

Get the latest youth metrics for each AU member state.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `data` | array | Array of youth metric records (latest per country) |
| `total` | integer | Number of countries with data |

Each record contains all fields from the [youth metrics object](#youth-metrics-object) plus a nested `member_states` object with `name`, `iso_code`, and `regions.name`.

**Example Request:**

```bash
curl http://localhost:8000/api/v1/youth/by-country
```

**Example Response:**

```json
{
  "data": [
    {
      "id": 88,
      "member_state_id": 39,
      "year": 2022,
      "youth_unemployment_pct": 14.2,
      "youth_literacy_pct": null,
      "youth_neet_pct": null,
      "secondary_enrollment_pct": 42.5,
      "member_states": {
        "name": "Nigeria",
        "iso_code": "NG",
        "regions": {"name": "West Africa"}
      }
    }
  ],
  "total": 42
}
```

---

### `GET /youth/employment`

Detailed youth employment/unemployment analysis. Returns countries ranked from highest to lowest unemployment rate.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `ranking` | array | Countries ranked by youth unemployment (highest first) |
| `continental_avg` | float or null | Continental average youth unemployment rate |
| `target` | integer | Agenda 2063 target (6%) |

**Employment ranking entry:**

| Field | Type | Description |
|---|---|---|
| `rank` | integer | Ranking position (1 = highest unemployment) |
| `country` | string | Country name |
| `iso_code` | string | ISO code |
| `region` | string or null | Region name |
| `unemployment_pct` | float | Youth unemployment rate (%) |
| `year` | integer | Year of measurement |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/youth/employment
```

**Example Response:**

```json
{
  "ranking": [
    {"rank": 1, "country": "South Africa", "iso_code": "ZA", "region": "Southern Africa", "unemployment_pct": 62.1, "year": 2022},
    {"rank": 2, "country": "Eswatini", "iso_code": "SZ", "region": "Southern Africa", "unemployment_pct": 58.2, "year": 2021},
    {"rank": 3, "country": "Libya", "iso_code": "LY", "region": "North Africa", "unemployment_pct": 49.8, "year": 2021}
  ],
  "continental_avg": 22.84,
  "target": 6
}
```

---

### `GET /youth/trends`

Get multi-year trend data for key youth metrics (continental averages per year).

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `trends` | array | Year-by-year continental youth averages |

**Trend entry:**

| Field | Type | Description |
|---|---|---|
| `year` | integer | Year |
| `avg_unemployment` | float or null | Continental average youth unemployment (%) |
| `avg_enrollment` | float or null | Continental average secondary enrollment (%) |
| `countries_reporting` | integer | Maximum count of countries reporting any metric |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/youth/trends
```

**Example Response:**

```json
{
  "trends": [
    {"year": 2018, "avg_unemployment": 21.5, "avg_enrollment": 46.2, "countries_reporting": 38},
    {"year": 2019, "avg_unemployment": 21.8, "avg_enrollment": 47.0, "countries_reporting": 40},
    {"year": 2020, "avg_unemployment": 23.5, "avg_enrollment": 46.5, "countries_reporting": 37},
    {"year": 2021, "avg_unemployment": 23.1, "avg_enrollment": 48.2, "countries_reporting": 41},
    {"year": 2022, "avg_unemployment": 22.8, "avg_enrollment": 49.1, "countries_reporting": 42}
  ]
}
```

---

## 8. Insights Engine

The Insights Engine automatically analyzes loaded data and generates first-class database objects representing findings, alerts, trends, recommendations, comparisons, and milestones.

### Insight Object

All insight endpoints return objects with this structure:

| Field | Type | Description |
|---|---|---|
| `id` | integer | Insight database ID |
| `type` | string | One of: `finding`, `alert`, `trend`, `recommendation`, `comparison`, `milestone` |
| `severity` | string | One of: `positive`, `neutral`, `warning`, `critical` |
| `title` | string | Short human-readable summary |
| `description` | string | Detailed description with evidence |
| `evidence` | object or null | Structured evidence (indicator codes, values, thresholds) |
| `goal_id` | integer or null | Related Agenda 2063 goal ID |
| `indicator_id` | integer or null | Related indicator ID |
| `member_state_id` | integer or null | Related country ID |
| `generated_at` | string | ISO 8601 UTC timestamp |
| `etl_run_id` | integer or null | ETL run that triggered this insight |
| `is_active` | boolean | Whether the insight is current |
| `included_in_report` | boolean | Whether it has been included in a generated report |

---

### `GET /insights`

Get all active insights with optional filtering and pagination.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `type` | string | No | null | Filter by insight type (e.g., `finding`, `alert`, `trend`) |
| `severity` | string | No | null | Filter by severity (e.g., `critical`, `warning`) |
| `limit` | integer | No | 50 | Number of results to return (max: 200) |
| `offset` | integer | No | 0 | Number of results to skip |

**Response:**

| Field | Type | Description |
|---|---|---|
| `insights` | array | Array of insight objects |
| `total` | integer | Number of insights returned in this page |
| `offset` | integer | Current offset value |

**Example Request:**

```bash
curl "http://localhost:8000/api/v1/insights?type=alert&severity=critical&limit=10"
```

**Example Response:**

```json
{
  "insights": [
    {
      "id": 142,
      "type": "alert",
      "severity": "critical",
      "title": "12 AU countries have youth unemployment above 30%",
      "description": "Critical youth employment crisis: 12 member states report youth unemployment rates exceeding 30%. Highest: South Africa (62.1%), Eswatini (58.2%), Libya (49.8%), Mozambique (42.1%), Gabon (38.5%). The Agenda 2063 target is below 6%.",
      "evidence": {
        "indicator": "SL.UEM.1524.ZS",
        "countries_above_30": 12,
        "target": 6,
        "highest": [
          {"country": "South Africa", "value": 62.1},
          {"country": "Eswatini", "value": 58.2}
        ]
      },
      "goal_id": 18,
      "indicator_id": null,
      "member_state_id": null,
      "generated_at": "2026-02-27T12:05:32+00:00",
      "etl_run_id": 5,
      "is_active": true,
      "included_in_report": false
    }
  ],
  "total": 3,
  "offset": 0
}
```

---

### `GET /insights/latest`

Get the most recently generated insights.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `limit` | integer | No | 10 | Number of insights to return (max: 50) |

**Response:**

| Field | Type | Description |
|---|---|---|
| `insights` | array | Array of insight objects, sorted newest first |

**Example Request:**

```bash
curl "http://localhost:8000/api/v1/insights/latest?limit=5"
```

---

### `GET /insights/critical`

Get all active insights with `critical` severity.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `insights` | array | Array of critical insight objects |
| `total` | integer | Number of critical insights |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/insights/critical
```

---

### `GET /insights/by-goal/{goal_id}`

Get all active insights related to a specific Agenda 2063 goal.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `goal_id` | integer | Yes | Goal database ID |

**Response:**

| Field | Type | Description |
|---|---|---|
| `insights` | array | Array of insight objects for the specified goal |
| `total` | integer | Number of insights for this goal |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/insights/by-goal/17
```

---

### `GET /insights/summary`

Get aggregate statistics about active insights, broken down by type and severity.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `total_active` | integer | Total number of active insights |
| `by_type` | object | Count per insight type |
| `by_severity` | object | Count per severity level |
| `latest_generated` | string or null | ISO 8601 timestamp of the most recent insight |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/insights/summary
```

**Example Response:**

```json
{
  "total_active": 28,
  "by_type": {
    "finding": 8,
    "alert": 5,
    "trend": 4,
    "recommendation": 3,
    "comparison": 5,
    "milestone": 3
  },
  "by_severity": {
    "critical": 3,
    "warning": 10,
    "neutral": 9,
    "positive": 6
  },
  "latest_generated": "2026-02-27T12:05:32+00:00"
}
```

---

### `POST /insights/generate`

Trigger the Insights Engine to regenerate all insights from the current data. This deactivates all existing insights and creates new ones based on the latest indicator values.

The engine runs 10 generators:
1. Gender findings (women in parliament, labor force)
2. Youth alerts (unemployment thresholds)
3. Health findings (life expectancy, maternal mortality)
4. Education findings (literacy rates)
5. Economic findings (GDP per capita)
6. Infrastructure findings (internet, electricity)
7. Regional comparisons (cross-region analysis)
8. Milestone insights (progress toward 2063 targets)
9. Trend insights (year-over-year continental trends)
10. Recommendations (actionable policy suggestions)

**Request Body:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `total_insights` | integer | Total number of insights generated |
| `by_type` | object | Breakdown of generated insights by type |

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/v1/insights/generate
```

**Example Response:**

```json
{
  "total_insights": 28,
  "by_type": {
    "finding": 8,
    "alert": 5,
    "trend": 4,
    "recommendation": 3,
    "comparison": 5,
    "milestone": 3
  }
}
```

---

## 9. ETL Pipeline

### `POST /pipeline/trigger`

Trigger a full ETL run: Extract data from the World Bank API, Transform and validate, Load into Supabase, then auto-generate insights. The pipeline runs in the background.

**Request Body (optional):**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `indicators` | array of strings | No | All 24 indicators | Specific World Bank indicator codes to fetch |
| `countries` | array of strings | No | All 55 AU states | Specific ISO 3166-1 alpha-2 country codes |
| `years` | array of integers | No | 2000-2024 | Specific years to fetch |

**Response:**

| Field | Type | Description |
|---|---|---|
| `message` | string | Confirmation message |
| `status` | string | Always `"started"` |

**Example Request (full run):**

```bash
curl -X POST http://localhost:8000/api/v1/pipeline/trigger
```

**Example Request (targeted run):**

```bash
curl -X POST http://localhost:8000/api/v1/pipeline/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "indicators": ["NY.GDP.PCAP.CD", "SG.GEN.PARL.ZS"],
    "countries": ["NG", "ZA", "KE"]
  }'
```

**Example Response:**

```json
{
  "message": "ETL pipeline triggered. Check /pipeline/status for progress.",
  "status": "started"
}
```

---

### `POST /pipeline/seed`

Seed the database with reference data: regions, aspirations, goals, all 55 member states, and indicator definitions. This should be called once before the first ETL run.

**Request Body:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `status` | string | `"seeded"` |
| `regions` | integer | Number of regions seeded (5) |
| `aspirations` | integer | Number of aspirations seeded (7) |
| `goals` | integer | Number of goals seeded (20) |
| `member_states` | integer | Number of member states seeded (55) |
| `indicators` | integer | Number of indicator definitions seeded |

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/v1/pipeline/seed
```

**Example Response:**

```json
{
  "status": "seeded",
  "regions": 5,
  "aspirations": 7,
  "goals": 20,
  "member_states": 55,
  "indicators": 24
}
```

---

### `GET /pipeline/status`

Get ETL pipeline run history and overall data statistics.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `runs` | array | Last 20 ETL run records (newest first) |
| `total_runs` | integer | Number of runs returned |
| `total_data_records` | integer | Total indicator value rows in the database |

**ETL Run object:**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Run database ID |
| `data_source_id` | integer or null | Data source ID (1 = World Bank) |
| `started_at` | string | ISO 8601 start timestamp |
| `completed_at` | string or null | ISO 8601 completion timestamp |
| `records_processed` | integer | Number of records successfully loaded |
| `records_failed` | integer | Number of failed records |
| `insights_generated` | integer | Number of insights generated post-ETL |
| `status` | string | `"running"`, `"completed"`, or `"failed"` |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/pipeline/status
```

**Example Response:**

```json
{
  "runs": [
    {
      "id": 5,
      "data_source_id": 1,
      "started_at": "2026-02-27T12:00:00+00:00",
      "completed_at": "2026-02-27T12:05:32+00:00",
      "records_processed": 15230,
      "records_failed": 0,
      "insights_generated": 28,
      "status": "completed"
    },
    {
      "id": 4,
      "data_source_id": 1,
      "started_at": "2026-02-26T08:00:00+00:00",
      "completed_at": "2026-02-26T08:04:15+00:00",
      "records_processed": 14980,
      "records_failed": 2,
      "insights_generated": 26,
      "status": "completed"
    }
  ],
  "total_runs": 5,
  "total_data_records": 18750
}
```

---

### `GET /pipeline/sources`

Get the list of configured data sources.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `sources` | array | Array of data source objects |

**Data source object:**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Source database ID |
| `name` | string | Source name (e.g., `"World Bank"`) |
| `api_url` | string or null | API base URL |
| `source_type` | string or null | Source type (e.g., `"api"`) |
| `last_refresh` | string or null | ISO 8601 timestamp of last data pull |
| `record_count` | integer or null | Number of records from this source |
| `status` | string | Source status (e.g., `"active"`) |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/pipeline/sources
```

**Example Response:**

```json
{
  "sources": [
    {
      "id": 1,
      "name": "World Bank",
      "api_url": "https://api.worldbank.org/v2",
      "source_type": "api",
      "last_refresh": "2026-02-27T12:05:32+00:00",
      "record_count": 18750,
      "status": "active"
    }
  ]
}
```

---

## 10. Data Upload

### `POST /upload/excel`

Upload supplementary data from Excel (.xlsx) or CSV (.csv) files. Data is validated against existing member states and indicators, then upserted into the database.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | Yes | Excel (.xlsx) or CSV (.csv) file |

**Required file columns:**

| Column | Type | Description |
|---|---|---|
| `country_iso` | string | ISO 3166-1 alpha-2 country code (e.g., `NG`) |
| `indicator_code` | string | World Bank indicator code (e.g., `SG.GEN.PARL.ZS`) |
| `year` | integer | Year of observation |
| `value` | float | Measured value |

**Response:**

| Field | Type | Description |
|---|---|---|
| `status` | string | `"completed"` or `"error"` |
| `filename` | string | Name of the uploaded file |
| `records_processed` | integer | Number of records successfully upserted |
| `records_failed` | integer | Number of records that failed |
| `errors` | array of strings | First 20 error messages |

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/v1/upload/excel \
  -F "file=@supplementary_data.xlsx"
```

**Example Response (success):**

```json
{
  "status": "completed",
  "filename": "supplementary_data.xlsx",
  "records_processed": 150,
  "records_failed": 3,
  "errors": [
    "Unknown country: XX",
    "Unknown indicator: CUSTOM.IND.01",
    "Unknown country: YY"
  ]
}
```

**Example Response (missing columns):**

```json
{
  "status": "error",
  "filename": "bad_data.csv",
  "records_processed": 0,
  "records_failed": 0,
  "errors": [
    "Missing required columns. Expected: {'country_iso', 'indicator_code', 'year', 'value'}. Got: {'country', 'metric', 'year', 'amount'}"
  ]
}
```

---

### `GET /upload/template`

Get the expected upload template format and validation rules.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `required_columns` | array of strings | Column names required in the upload file |
| `example_row` | object | Example data row |
| `supported_formats` | array of strings | Accepted file formats |
| `valid_country_codes` | string | Description of valid country codes |
| `valid_indicators` | string | How to find valid indicator codes |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/upload/template
```

**Example Response:**

```json
{
  "required_columns": ["country_iso", "indicator_code", "year", "value"],
  "example_row": {
    "country_iso": "NG",
    "indicator_code": "SG.GEN.PARL.ZS",
    "year": 2023,
    "value": 3.6
  },
  "supported_formats": [".xlsx", ".csv"],
  "valid_country_codes": "Use ISO 3166-1 alpha-2 codes (e.g., NG, ZA, KE, EG)",
  "valid_indicators": "See /api/v1/indicators for available codes"
}
```

---

## 11. Reports

### `POST /reports/generate`

Generate a structured report. The report is built from current data and active insights, saved to the database, and returned in the response.

**Request Body:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `report_type` | string | Yes | -- | One of: `executive_summary`, `gender_brief`, `country_profile` |
| `title` | string | No | Auto-generated | Custom report title |
| `parameters` | object | No | null | Report-specific parameters |

**Parameters by report type:**

| Report Type | Parameters |
|---|---|
| `executive_summary` | None required |
| `gender_brief` | None required |
| `country_profile` | `{"iso_code": "NG"}` (defaults to `"NG"` if omitted) |

**Response (executive_summary):**

| Field | Type | Description |
|---|---|---|
| `id` | integer or null | Saved report database ID |
| `title` | string | Report title (e.g., `"AU Agenda 2063 Executive Summary -- February 2026"`) |
| `generated_at` | string | ISO 8601 timestamp |
| `sections` | array | Structured report sections |
| `insight_ids` | array of integers | IDs of all insights included |
| `summary_stats` | object | Summary of insight counts |

**Report section object:**

| Field | Type | Description |
|---|---|---|
| `heading` | string | Section heading |
| `content` | string | Section text (for single-content sections) |
| `items` | array | Array of `{title, description}` entries (for list sections) |

**Summary stats:**

| Field | Type | Description |
|---|---|---|
| `total_insights` | integer | Total insights available |
| `critical_alerts` | integer | Number of critical alerts |
| `warnings` | integer | Number of warnings |
| `positive_trends` | integer | Number of positive trends |

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/v1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"report_type": "executive_summary"}'
```

**Example Response:**

```json
{
  "id": 12,
  "title": "AU Agenda 2063 Executive Summary -- February 2026",
  "generated_at": "2026-02-27T14:00:00+00:00",
  "sections": [
    {
      "heading": "Key Finding",
      "content": "Critical youth employment crisis: 12 member states report youth unemployment rates exceeding 30%..."
    },
    {
      "heading": "Critical Alerts",
      "items": [
        {"title": "12 AU countries have youth unemployment above 30%", "description": "..."},
        {"title": "8 AU countries have maternal mortality >500 per 100,000", "description": "..."}
      ]
    },
    {
      "heading": "Areas of Progress",
      "items": [
        {"title": "Internet penetration: Positive continental trend", "description": "..."}
      ]
    },
    {
      "heading": "Warnings Requiring Attention",
      "items": []
    },
    {
      "heading": "Recommendations",
      "items": [
        {"title": "Prioritize youth employment interventions in Southern Africa", "description": "..."}
      ]
    }
  ],
  "insight_ids": [142, 143, 144, 145],
  "summary_stats": {
    "total_insights": 28,
    "critical_alerts": 3,
    "warnings": 10,
    "positive_trends": 6
  }
}
```

**Example Request (country profile):**

```bash
curl -X POST http://localhost:8000/api/v1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"report_type": "country_profile", "parameters": {"iso_code": "KE"}}'
```

---

### `GET /reports/export/excel`

Download a comprehensive data export as an Excel file (.xlsx). The workbook contains three sheets:
1. **Goals Progress** -- All 20 goals with aspirations and progress
2. **Member States** -- All 55 member states with regions
3. **Insights** -- All active insights with type, severity, and descriptions

Uses AU branding (gold #C8A415 header backgrounds).

**Parameters:** None

**Response:** Binary Excel file (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

**Response Headers:**

```
Content-Disposition: attachment; filename=au_agenda2063_report.xlsx
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

**Example Request:**

```bash
curl -o report.xlsx http://localhost:8000/api/v1/reports/export/excel
```

---

### `GET /reports`

List all previously generated reports.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `reports` | array | Array of report metadata objects (newest first) |
| `total` | integer | Total number of reports |

**Report metadata object:**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Report database ID |
| `title` | string | Report title |
| `report_type` | string | Report type |
| `parameters` | object or null | Report generation parameters |
| `insights_included` | array of integers or null | IDs of included insights |
| `generated_at` | string | ISO 8601 timestamp |
| `file_url` | string or null | URL to downloadable file (if applicable) |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/reports
```

**Example Response:**

```json
{
  "reports": [
    {
      "id": 12,
      "title": "AU Agenda 2063 Executive Summary -- February 2026",
      "report_type": "executive_summary",
      "parameters": {"type": "executive_summary"},
      "insights_included": [142, 143, 144, 145],
      "generated_at": "2026-02-27T14:00:00+00:00",
      "file_url": null
    },
    {
      "id": 11,
      "title": "Country Profile: Kenya",
      "report_type": "country_profile",
      "parameters": {"iso_code": "KE"},
      "insights_included": null,
      "generated_at": "2026-02-26T10:00:00+00:00",
      "file_url": null
    }
  ],
  "total": 12
}
```

---

### `GET /reports/{report_id}`

Get a specific report by its ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `report_id` | integer | Yes | Report database ID |

**Response:** The full report object as stored in the database (same structure as report metadata object above).

**Example Request:**

```bash
curl http://localhost:8000/api/v1/reports/12
```

**Example Response:**

```json
{
  "id": 12,
  "title": "AU Agenda 2063 Executive Summary -- February 2026",
  "report_type": "executive_summary",
  "parameters": {"type": "executive_summary"},
  "insights_included": [142, 143, 144, 145],
  "generated_at": "2026-02-27T14:00:00+00:00",
  "file_url": null
}
```

---

## 12. Data Quality

### `GET /data-quality/overview`

Get a continental overview of data quality, including scores, best/worst indicators, and data gaps.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `continental_avg_score` | float | Average data quality score across all country-indicator pairs (0-100) |
| `countries_with_good_data` | integer | Countries with average score above 70 |
| `countries_with_poor_data` | integer | Countries with average score below 40 |
| `most_complete_indicators` | array | Top 5 indicators by data quality score |
| `least_complete_indicators` | array | Bottom 5 indicators by data quality score |
| `gaps` | array | Up to 20 country-indicator pairs with zero data (IDs only) |

**Indicator quality entry:**

| Field | Type | Description |
|---|---|---|
| `indicator` | string | Indicator name |
| `score` | float | Average quality score (0-100) |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/data-quality/overview
```

**Example Response:**

```json
{
  "continental_avg_score": 52.3,
  "countries_with_good_data": 12,
  "countries_with_poor_data": 18,
  "most_complete_indicators": [
    {"indicator": "GDP per capita (current US$)", "score": 78.5},
    {"indicator": "Life expectancy at birth", "score": 75.2},
    {"indicator": "Access to electricity (%)", "score": 72.8},
    {"indicator": "Internet users (% population)", "score": 71.1},
    {"indicator": "Mobile subscriptions per 100", "score": 70.3}
  ],
  "least_complete_indicators": [
    {"indicator": "Poverty headcount ratio ($2.15/day)", "score": 22.1},
    {"indicator": "Manufacturing value added (% GDP)", "score": 28.4},
    {"indicator": "Renewable energy consumption (%)", "score": 30.2},
    {"indicator": "Tax revenue (% GDP)", "score": 31.5},
    {"indicator": "HIV incidence (per 1,000)", "score": 33.0}
  ],
  "gaps": [
    {"member_state_id": 15, "indicator_id": 8},
    {"member_state_id": 15, "indicator_id": 12}
  ]
}
```

---

### `GET /data-quality/by-country`

Get data quality scores aggregated by country, ranked from best to worst.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `scores` | array | Array of country quality score objects, ranked best-first |

**Country quality score object:**

| Field | Type | Description |
|---|---|---|
| `country_name` | string | Country name |
| `iso_code` | string | ISO code |
| `overall_score` | float | Average quality score across all indicators (0-100) |
| `completeness` | float | Average data completeness percentage |
| `indicators_covered` | integer | Number of indicators with any data |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/data-quality/by-country
```

**Example Response:**

```json
{
  "scores": [
    {"country_name": "South Africa", "iso_code": "ZA", "overall_score": 82.4, "completeness": 88.5, "indicators_covered": 24},
    {"country_name": "Kenya", "iso_code": "KE", "overall_score": 78.1, "completeness": 84.2, "indicators_covered": 24},
    {"country_name": "Nigeria", "iso_code": "NG", "overall_score": 76.8, "completeness": 82.0, "indicators_covered": 23},
    {"country_name": "Somalia", "iso_code": "SO", "overall_score": 12.5, "completeness": 15.3, "indicators_covered": 8}
  ]
}
```

---

### `POST /data-quality/assess`

Trigger a full data quality assessment. Evaluates every country-indicator pair on three dimensions:

- **Completeness (40%):** Percentage of expected years (2000-2024) with data.
- **Timeliness (30%):** How recent the latest data point is.
- **Consistency (30%):** Absence of suspicious jumps (>200% year-over-year change).

Results are saved to the `data_quality_scores` table.

**Request Body:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `total_scores` | integer | Number of country-indicator quality scores computed |
| `status` | string | `"completed"` |

**Example Request:**

```bash
curl -X POST http://localhost:8000/api/v1/data-quality/assess
```

**Example Response:**

```json
{
  "total_scores": 1320,
  "status": "completed"
}
```

---

### `GET /data-quality/gaps`

Identify missing data: country-indicator combinations with zero data points in the database.

**Parameters:** None

**Response:**

| Field | Type | Description |
|---|---|---|
| `gaps` | array | First 100 gaps (country-indicator pairs with no data) |
| `total_gaps` | integer | Total number of gaps across all countries and indicators |

**Gap object:**

| Field | Type | Description |
|---|---|---|
| `country` | string | Country name |
| `iso_code` | string | ISO code |
| `indicator` | string | Indicator name |
| `indicator_code` | string | World Bank indicator code |

**Example Request:**

```bash
curl http://localhost:8000/api/v1/data-quality/gaps
```

**Example Response:**

```json
{
  "gaps": [
    {"country": "Eritrea", "iso_code": "ER", "indicator": "GDP per capita (current US$)", "indicator_code": "NY.GDP.PCAP.CD"},
    {"country": "Eritrea", "iso_code": "ER", "indicator": "Adult literacy rate", "indicator_code": "SE.ADT.LITR.ZS"},
    {"country": "Somalia", "iso_code": "SO", "indicator": "Poverty headcount ratio ($2.15/day)", "indicator_code": "SI.POV.DDAY"}
  ],
  "total_gaps": 245
}
```

---

## Appendix: World Bank Indicator Codes

The ETL pipeline fetches the following 24 indicators from the World Bank API:

| Code | Name | Unit | Mapped Goal |
|---|---|---|---|
| `NY.GDP.PCAP.CD` | GDP per capita (current US$) | USD | Goal 1 |
| `SI.POV.DDAY` | Poverty headcount ratio ($2.15/day) | % | Goal 1 |
| `SE.ADT.LITR.ZS` | Adult literacy rate | % | Goal 2 |
| `SE.PRM.ENRR` | Primary school enrollment | % | Goal 2 |
| `SE.SEC.ENRR` | Secondary school enrollment | % | Goal 2 |
| `SP.DYN.LE00.IN` | Life expectancy at birth | years | Goal 3 |
| `SH.STA.MMRT` | Maternal mortality ratio | per 100k | Goal 3 |
| `SH.DYN.MORT` | Under-5 mortality rate | per 1k | Goal 3 |
| `NV.IND.MANF.ZS` | Manufacturing value added (% GDP) | % | Goal 4 |
| `BX.KLT.DINV.WD.GD.ZS` | FDI net inflows (% GDP) | % | Goal 4 |
| `NV.AGR.TOTL.ZS` | Agriculture value added (% GDP) | % | Goal 5 |
| `EN.ATM.CO2E.PC` | CO2 emissions per capita | metric tons | Goal 7 |
| `EG.FEC.RNEW.ZS` | Renewable energy consumption (%) | % | Goal 7 |
| `IT.NET.USER.ZS` | Internet users (% population) | % | Goal 10 |
| `IT.CEL.SETS.P2` | Mobile subscriptions per 100 | per 100 | Goal 10 |
| `EG.ELC.ACCS.ZS` | Access to electricity (%) | % | Goal 10 |
| `SG.GEN.PARL.ZS` | Women in parliament (%) | % | Goal 17 |
| `SE.ENR.PRIM.FM.ZS` | Gender parity index (primary) | index | Goal 17 |
| `SL.TLF.CACT.FE.ZS` | Female labor force participation | % | Goal 17 |
| `SL.UEM.1524.ZS` | Youth unemployment (%) | % | Goal 18 |
| `SH.STA.BRTC.ZS` | Births attended by skilled staff (%) | % | Goal 3 |
| `GC.TAX.TOTL.GD.ZS` | Tax revenue (% GDP) | % | Goal 4 |
| `SP.ADO.TFRT` | Adolescent fertility rate | per 1k | Goal 17 |
| `SH.HIV.INCD.TL.P3` | HIV incidence (per 1,000) | per 1k | Goal 3 |

---

## Appendix: Quick Start

```bash
# 1. Seed the database with reference data
curl -X POST http://localhost:8000/api/v1/pipeline/seed

# 2. Run the ETL pipeline (fetches data from World Bank)
curl -X POST http://localhost:8000/api/v1/pipeline/trigger

# 3. Check pipeline progress
curl http://localhost:8000/api/v1/pipeline/status

# 4. Generate insights from the loaded data
curl -X POST http://localhost:8000/api/v1/insights/generate

# 5. View the dashboard
curl http://localhost:8000/api/v1/dashboard/summary

# 6. Generate an executive report
curl -X POST http://localhost:8000/api/v1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"report_type": "executive_summary"}'

# 7. Download Excel export
curl -o report.xlsx http://localhost:8000/api/v1/reports/export/excel
```
