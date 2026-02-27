# Database Schema

## Overview

The AU Central Reporting System uses **PostgreSQL via Supabase** with **13 tables** organized into 5 logical groups:

| Group | Tables | Purpose |
|-------|--------|---------|
| **Framework** | aspirations, goals, indicators | Agenda 2063 structure (7 aspirations → 20 goals → 24 indicators) |
| **Geography** | regions, member_states | 5 regions, 55 AU member states |
| **Data** | indicator_values, gender_metrics, youth_metrics | Time series data (2000-2024) |
| **Intelligence** | insights, data_quality_scores | Auto-generated insights, quality assessment |
| **Operations** | etl_runs, data_sources, reports | Pipeline tracking, report generation |

## Entity Relationship Diagram

```
                    ┌──────────────┐
                    │  aspirations │
                    │──────────────│
                    │ id (PK)      │
                    │ number (1-7) │
                    │ name         │
                    └──────┬───────┘
                           │ 1:N
                    ┌──────┴───────┐
                    │    goals     │
                    │──────────────│
                    │ id (PK)      │
                    │ aspiration_id│──→ aspirations.id
                    │ number (1-20)│
                    │ progress %   │
                    └──────┬───────┘
                           │ 1:N
                    ┌──────┴───────┐
                    │  indicators  │
                    │──────────────│
                    │ id (PK)      │
                    │ goal_id      │──→ goals.id
                    │ code (unique)│
                    │ target_value │
                    └──────┬───────┘
                           │ 1:N
┌──────────────┐    ┌──────┴────────────┐
│   regions    │    │ indicator_values   │
│──────────────│    │───────────────────│
│ id (PK)      │    │ id (PK)           │
│ name         │    │ indicator_id       │──→ indicators.id
│ rec_name     │    │ member_state_id    │──→ member_states.id
└──────┬───────┘    │ year               │
       │ 1:N        │ value              │
┌──────┴───────┐    │ data_quality       │
│member_states │    └───────────────────┘
│──────────────│          UNIQUE(indicator_id, member_state_id, year)
│ id (PK)      │
│ iso_code (UQ)│    ┌───────────────────┐    ┌───────────────────┐
│ region_id    │    │  gender_metrics    │    │  youth_metrics     │
└──────────────┘    │───────────────────│    │───────────────────│
       │            │ member_state_id    │    │ member_state_id    │
       ├───────────→│ year               │    │ year               │
       │            │ women_parliament   │    │ youth_unemployment │
       │            │ gender_parity      │    │ secondary_enroll   │
       │            │ women_labor_force  │    │ youth_literacy     │
       │            │ maternal_mortality │    └───────────────────┘
       │            └───────────────────┘
       │
       │            ┌───────────────────┐
       ├───────────→│    insights        │
       │            │───────────────────│
       │            │ type, severity     │
       │            │ title, description │
       │            │ evidence (JSONB)   │
       │            │ goal_id, indicator_id │
       │            │ member_state_id    │
       │            │ etl_run_id         │
       │            └───────────────────┘
       │
       │            ┌───────────────────┐
       └───────────→│data_quality_scores│
                    │───────────────────│
                    │ member_state_id    │
                    │ indicator_id       │
                    │ completeness_pct   │
                    │ overall_score      │
                    └───────────────────┘
```

## Table Definitions

### aspirations
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| number | INTEGER | UNIQUE, NOT NULL, 1-7 | Aspiration number |
| name | TEXT | NOT NULL | Full aspiration name |
| description | TEXT | | Detailed description |

### goals
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| aspiration_id | INTEGER | FK → aspirations(id) | Parent aspiration |
| number | INTEGER | UNIQUE, NOT NULL, 1-20 | Goal number |
| name | TEXT | NOT NULL | Goal name |
| description | TEXT | | Detailed description |
| target_2063 | TEXT | | Target for year 2063 |
| current_progress | NUMERIC(5,2) | 0-100 | Progress percentage |

### indicators
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| goal_id | INTEGER | FK → goals(id) | Parent goal |
| name | TEXT | NOT NULL | Indicator name |
| code | TEXT | UNIQUE | World Bank indicator code |
| unit | TEXT | | Unit of measurement |
| source | TEXT | DEFAULT 'World Bank' | Data source |
| baseline_value | NUMERIC | | Baseline value |
| baseline_year | INTEGER | | Baseline year |
| target_value | NUMERIC | | 2063 target value |
| target_year | INTEGER | DEFAULT 2063 | Target year |

### member_states
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| name | TEXT | NOT NULL | Country name |
| iso_code | CHAR(2) | UNIQUE, NOT NULL | ISO 3166-1 alpha-2 |
| iso3_code | CHAR(3) | UNIQUE | ISO 3166-1 alpha-3 |
| region_id | INTEGER | FK → regions(id) | AU region |
| population | BIGINT | | Latest population |
| gdp_per_capita | NUMERIC(12,2) | | Latest GDP/capita |
| au_membership_year | INTEGER | | Year joined AU/OAU |

### indicator_values
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| indicator_id | INTEGER | FK → indicators(id) | Which indicator |
| member_state_id | INTEGER | FK → member_states(id) | Which country |
| year | INTEGER | NOT NULL | Data year |
| value | NUMERIC | | Data value |
| data_quality | TEXT | CHECK: verified/estimated/missing | Quality flag |
| source_detail | TEXT | | Specific source info |

**Unique constraint**: (indicator_id, member_state_id, year)

### insights
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-increment ID |
| type | TEXT | NOT NULL, CHECK list | finding/alert/trend/recommendation/comparison/milestone |
| severity | TEXT | NOT NULL, CHECK list | positive/neutral/warning/critical |
| title | TEXT | NOT NULL | Short headline |
| description | TEXT | NOT NULL | Full description with data |
| evidence | JSONB | | Machine-readable supporting data |
| goal_id | INTEGER | FK → goals(id) | Related goal |
| indicator_id | INTEGER | FK → indicators(id) | Related indicator |
| member_state_id | INTEGER | FK → member_states(id) | Related country |
| region_id | INTEGER | FK → regions(id) | Related region |
| generated_at | TIMESTAMPTZ | DEFAULT NOW() | Generation timestamp |
| etl_run_id | INTEGER | FK → etl_runs(id) | Triggering ETL run |
| is_active | BOOLEAN | DEFAULT TRUE | Current insight |
| included_in_report | BOOLEAN | DEFAULT FALSE | Used in a report |

## Performance Indexes

```sql
-- Fast lookups for time series queries
CREATE INDEX idx_indicator_values_lookup ON indicator_values(indicator_id, member_state_id, year);

-- Fast insight filtering
CREATE INDEX idx_insights_type ON insights(type);
CREATE INDEX idx_insights_severity ON insights(severity);
CREATE INDEX idx_insights_active ON insights(is_active);
CREATE INDEX idx_insights_generated ON insights(generated_at DESC);

-- Geographic queries
CREATE INDEX idx_member_states_iso ON member_states(iso_code);
CREATE INDEX idx_member_states_region ON member_states(region_id);
```

## Data Volume Estimates

| Table | Estimated Rows | Growth Rate |
|-------|---------------|-------------|
| indicator_values | 15,000-30,000 | ~1,500/year per ETL run |
| gender_metrics | 1,000-2,000 | ~55/year |
| youth_metrics | 500-1,500 | ~55/year |
| insights | 20-50 per ETL run | Regenerated each run |
| data_quality_scores | ~1,300 | Reassessed on demand |

## Migration

The schema is defined in `backend/migrations/001_initial_schema.sql`. To apply:

```bash
# Using psycopg2 (Python)
python -c "
import psycopg2, os
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
conn.autocommit = True
with open('migrations/001_initial_schema.sql') as f:
    conn.cursor().execute(f.read())
"
```
