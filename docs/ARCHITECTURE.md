# AU Central Reporting System --- Architecture Document

**Version:** 1.0.0
**Author:** Shedrack Emeka Ajakghe
**Date:** February 2026
**Status:** Production

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Backend Architecture](#2-backend-architecture)
3. [Database Design](#3-database-design)
4. [ETL Pipeline](#4-etl-pipeline)
5. [Insights Engine](#5-insights-engine)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Why This Architecture](#9-why-this-architecture)

---

## 1. System Overview

The AU Central Reporting System is a production data intelligence platform built for the African Union. It transforms fragmented continental data into actionable insights for evidence-based decision-making across 55 member states and 20 Agenda 2063 goals.

### 1.1 High-Level Architecture

```
+========================================================================================+
|                           AU CENTRAL REPORTING SYSTEM                                  |
+========================================================================================+
|                                                                                        |
|  TIER 1: EXTERNAL DATA SOURCES                                                         |
|  +---------------------------+  +---------------------------+  +--------------------+  |
|  |    World Bank API v2      |  |   Manual CSV/Excel        |  |   Future Sources   |  |
|  |  api.worldbank.org/v2     |  |   Upload Endpoint         |  |   (UN, AfDB, ...)  |  |
|  |  24 indicators, 55 states |  |   Drag-and-drop UI        |  |                    |  |
|  +------------+--------------+  +------------+--------------+  +---------+----------+  |
|               |                              |                           |              |
|               v                              v                           v              |
|  TIER 2: ETL PIPELINE (Extract -> Transform -> Load -> Generate Insights)              |
|  +---------------------------------------------------------------------------------+   |
|  |  etl_service.py                                                                 |   |
|  |  +-------------+   +---------------+   +-----------+   +-------------------+    |   |
|  |  |  EXTRACT    |-->|  TRANSFORM    |-->|   LOAD    |-->|  INSIGHTS ENGINE  |    |   |
|  |  |  httpx      |   |  Validate     |   |  Upsert   |   |  10 generators    |    |   |
|  |  |  async      |   |  Clean nulls  |   |  Batch    |   |  6 insight types  |    |   |
|  |  |  paginated  |   |  ISO mapping  |   |  500/chunk|   |  Auto-triggered   |    |   |
|  |  +-------------+   +---------------+   +-----------+   +-------------------+    |   |
|  +---------------------------------------------------------------------------------+   |
|               |                                                                        |
|               v                                                                        |
|  TIER 3: DATA LAYER (Supabase PostgreSQL)                                              |
|  +---------------------------------------------------------------------------------+   |
|  |  13 Tables  |  Row-Level Security  |  Connection Pooling  |  Managed Backups   |   |
|  |                                                                                 |   |
|  |  +----------+ +----------+ +-----------+ +----------------+ +-------+           |   |
|  |  | regions  | | aspirat- | | goals     | | indicators     | | ind.  |           |   |
|  |  | (5)      | | ions (7) | | (20)      | | (24)           | | vals  |           |   |
|  |  +----------+ +----------+ +-----------+ +----------------+ +-------+           |   |
|  |  +----------+ +-----------+ +-----------+ +--------+ +-------+ +--------+      |   |
|  |  | member   | | gender    | | youth     | | insigh-| | etl   | | data   |      |   |
|  |  | states   | | metrics   | | metrics   | | ts     | | runs  | | source |      |   |
|  |  | (55)     | |           | |           | |        | |       | |        |      |   |
|  |  +----------+ +-----------+ +-----------+ +--------+ +-------+ +--------+      |   |
|  |  +-----------------+ +----------+                                               |   |
|  |  | data_quality    | | reports  |                                               |   |
|  |  | scores          | |          |                                               |   |
|  |  +-----------------+ +----------+                                               |   |
|  +---------------------------------------------------------------------------------+   |
|               |                                                                        |
|               v                                                                        |
|  TIER 4: API LAYER (FastAPI REST)                                                      |
|  +---------------------------------------------------------------------------------+   |
|  |  12 Route Modules  |  40+ Endpoints  |  Pydantic Validation  |  OpenAPI Docs    |   |
|  |                                                                                 |   |
|  |  /health  /dashboard  /goals  /indicators  /countries  /gender                  |   |
|  |  /youth   /insights   /pipeline  /reports  /upload  /data-quality               |   |
|  +---------------------------------------------------------------------------------+   |
|               |                                                                        |
|               v                                                                        |
|  TIER 5: FRONTEND (Single-Page Application)                                            |
|  +---------------------------------------------------------------------------------+   |
|  |  Vanilla JS  |  Plotly.js Charts  |  AU Branding (Gold #C8A415, Green #009A44)  |   |
|  |                                                                                 |   |
|  |  Dashboard | Agenda 2063 | Gender & Youth | Insights | Countries | Pipeline     |   |
|  +---------------------------------------------------------------------------------+   |
|                                                                                        |
+========================================================================================+
```

### 1.2 Key Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Data-Driven** | All insights are evidence-based, generated programmatically from real World Bank data |
| **Separation of Concerns** | 4-tier architecture separating data ingestion, storage, API, and presentation |
| **Service Layer Pattern** | Business logic encapsulated in dedicated service modules, not route handlers |
| **First-Class Insights** | Insights are persisted database objects, not ephemeral computations |
| **AU-Aligned** | All 7 aspirations, 20 goals, and 55 member states modeled as structured data |
| **Async-First** | Full async/await pipeline from HTTP client to database operations |

### 1.3 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Python | 3.11 | Backend language |
| Framework | FastAPI | 0.109+ | Async REST API with auto-documentation |
| Validation | Pydantic | 2.5+ | Request/response schemas and settings |
| Database | PostgreSQL | 15 (Supabase) | Primary data store with RLS |
| DB Client | supabase-py | 2.3+ | REST API client for Supabase |
| DB Pool | asyncpg | 0.29+ | Direct async PostgreSQL connection pool |
| HTTP Client | httpx | 0.26+ | Async World Bank API requests |
| Logging | structlog | 24.1+ | Structured JSON logging |
| Charts | Plotly.js | 2.27 | Interactive data visualizations |
| Reports | xlsxwriter | 3.1+ | Excel report generation |
| Containerization | Docker | - | Deployment packaging |
| Hosting | Render | - | Cloud deployment |

---

## 2. Backend Architecture

### 2.1 Project Structure

```
backend/
+-- app/
|   +-- __init__.py
|   +-- main.py                    # FastAPI application entry point, lifespan, CORS
|   +-- api/
|   |   +-- __init__.py
|   |   +-- v1/
|   |       +-- __init__.py
|   |       +-- router.py          # Aggregates all 12 route modules
|   |       +-- health.py          # GET /health
|   |       +-- dashboard.py       # GET /dashboard/summary
|   |       +-- goals.py           # CRUD + progress for Agenda 2063 goals
|   |       +-- indicators.py      # Time series, rankings, trends
|   |       +-- countries.py       # Member state profiles, scorecards, compare
|   |       +-- gender.py          # WGYD gender analytics
|   |       +-- youth.py           # WGYD youth analytics
|   |       +-- insights.py        # Insight queries, generation trigger
|   |       +-- pipeline.py        # ETL trigger, status, seed
|   |       +-- reports.py         # Report generation and export
|   |       +-- upload.py          # CSV/Excel file upload
|   |       +-- data_quality.py    # Quality scores and assessments
|   +-- core/
|   |   +-- __init__.py
|   |   +-- config.py              # Pydantic Settings (env-based configuration)
|   |   +-- database.py            # Supabase client + asyncpg pool management
|   +-- models/
|   |   +-- __init__.py
|   |   +-- enums.py               # InsightType, InsightSeverity, ETLStatus, etc.
|   |   +-- schemas.py             # 30+ Pydantic schemas for API validation
|   +-- services/
|       +-- __init__.py
|       +-- etl_service.py         # World Bank API ETL pipeline
|       +-- insights_engine.py     # 10 insight generators, 6 insight types
|       +-- analytics_service.py   # Aggregations, trends, rankings
|       +-- report_generator.py    # Executive summary, briefs, Excel export
|       +-- data_quality.py        # Completeness, timeliness, consistency scoring
+-- Dockerfile
+-- requirements.txt
+-- .env                           # SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL
```

### 2.2 Request Lifecycle

```
Client Request
      |
      v
+------------------+
| FastAPI Router   |    1. URL matching via APIRouter prefix + path
+--------+---------+
         |
         v
+------------------+
| CORS Middleware  |    2. Origin validation, preflight handling
+--------+---------+
         |
         v
+------------------+
| Pydantic Schema  |    3. Request body/query validation
+--------+---------+
         |
         v
+------------------+
| Route Handler    |    4. Thin controller — delegates to service layer
+--------+---------+
         |
         v
+------------------+
| Service Layer    |    5. Business logic (analytics, insights, ETL, reports)
+--------+---------+
         |
         v
+------------------+
| Database Layer   |    6. Supabase REST client or asyncpg pool
+--------+---------+
         |
         v
+------------------+
| Pydantic Schema  |    7. Response serialization and validation
+--------+---------+
         |
         v
   JSON Response
```

### 2.3 Application Entry Point (main.py)

The FastAPI application uses the modern lifespan context manager pattern for startup/shutdown lifecycle management:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize Supabase client + asyncpg pool
    get_supabase()
    await get_pg_pool()
    yield
    # Shutdown: close connection pool
    await close_pg_pool()

app = FastAPI(
    title="AU Central Reporting System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware configured from environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All routes under /api/v1
app.include_router(api_router, prefix="/api/v1")
```

### 2.4 Configuration Management

All configuration is loaded from environment variables using Pydantic Settings with automatic `.env` file support:

```python
class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    SUPABASE_URL: str                  # Required
    SUPABASE_ANON_KEY: str             # Required
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    DATABASE_URL: str = ""
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: str = '["http://localhost:3000","http://localhost:8000"]'
    LOG_LEVEL: str = "INFO"

    model_config = {"env_file": ".env", "extra": "ignore"}
```

### 2.5 Dual Database Connection Strategy

The system uses two complementary database access methods:

| Method | Module | Use Case |
|--------|--------|----------|
| **Supabase REST Client** | `supabase-py` | Standard CRUD, filtering, pagination, joins via PostgREST |
| **asyncpg Pool** | `asyncpg` | Complex aggregations, raw SQL, high-throughput batch operations |

```python
# Supabase REST (primary) -- simple relational queries
_supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

# asyncpg Pool (secondary) -- complex analytics queries
_pg_pool = await asyncpg.create_pool(
    settings.DATABASE_URL,
    min_size=2,      # Minimum 2 warm connections
    max_size=10,     # Scale up to 10 under load
    command_timeout=30,
)
```

### 2.6 Service Layer Architecture

Business logic is encapsulated in five service modules that route handlers delegate to. This keeps route handlers thin and testable:

```
+-------------------+     +-------------------+     +-------------------+
|  etl_service.py   |     | insights_engine   |     | analytics_service |
|                   |     |                   |     |                   |
| - World Bank API  |---->| - 10 generators   |     | - Dashboard KPIs  |
| - 24 indicators   |     | - 6 insight types |     | - Time series     |
| - 55 countries    |     | - Auto-trigger    |     | - Rankings        |
| - Batch upsert    |     | - Evidence-based  |     | - Regional avgs   |
| - Gender/Youth    |     |                   |     | - Country profiles|
+-------------------+     +-------------------+     +-------------------+

+-------------------+     +-------------------+
| report_generator  |     |  data_quality.py  |
|                   |     |                   |
| - Exec summary    |     | - Completeness %  |
| - Gender brief    |     | - Timeliness yrs  |
| - Country profile |     | - Consistency     |
| - Excel export    |     | - Overall score   |
| - Pyramid Princ.  |     | - Gap detection   |
+-------------------+     +-------------------+
```

### 2.7 API Route Modules

The API is organized into 12 route modules, each handling a specific domain:

| Module | Prefix | Endpoints | Description |
|--------|--------|-----------|-------------|
| `health.py` | `/health` | 1 | API + DB connectivity check |
| `dashboard.py` | `/dashboard` | 1 | KPI summary with continental averages |
| `goals.py` | `/goals` | 4 | Agenda 2063 goals CRUD + progress |
| `indicators.py` | `/indicators` | 4 | Time series, rankings, trends |
| `countries.py` | `/countries` | 4 | Member state profiles, scorecards, comparison |
| `gender.py` | `/gender` | 4 | WGYD gender analytics |
| `youth.py` | `/youth` | 4 | WGYD youth analytics |
| `insights.py` | `/insights` | 6 | Insight queries, filtering, generation |
| `pipeline.py` | `/pipeline` | 4 | ETL trigger, status, sources, seed |
| `reports.py` | `/reports` | 4 | Report generation, listing, Excel export |
| `upload.py` | `/upload` | 1 | CSV/Excel file upload |
| `data_quality.py` | `/data-quality` | 3 | Quality scores and assessment |

**Total: 40+ endpoints** all documented via OpenAPI at `/docs` and `/redoc`.

---

## 3. Database Design

### 3.1 Entity-Relationship Diagram

```
+------------------+        +------------------+        +------------------+
|     regions      |        |   aspirations    |        |    data_sources  |
+------------------+        +------------------+        +------------------+
| id (PK)          |        | id (PK)          |        | id (PK)          |
| name             |<---+   | number (1-7)     |<---+   | name             |
| rec_name         |    |   | name             |    |   | api_url          |
+------------------+    |   | description      |    |   | source_type      |
        |               |   +------------------+    |   | last_refresh     |
        | 1:N            |           |               |   | record_count     |
        v               |           | 1:N            |   | status           |
+------------------+    |           v               |   +------------------+
|  member_states   |    |   +------------------+    |           |
+------------------+    |   |      goals       |    |           | 1:N
| id (PK)          |    |   +------------------+    |           v
| name             |    |   | id (PK)          |    |   +------------------+
| iso_code (UQ)    |    |   | aspiration_id FK |----+   |    etl_runs      |
| iso3_code        |    |   | number (1-20)    |        +------------------+
| region_id (FK)   |----+   | name             |        | id (PK)          |
| population       |        | description      |        | data_source_id FK|
| gdp_per_capita   |        | target_2063      |        | started_at       |
| au_membership_yr |        | current_progress |        | completed_at     |
+------------------+        +------------------+        | records_processed|
        |                           |                    | records_failed   |
        | 1:N                       | 1:N                | insights_gen.    |
        |                           v                    | status (enum)    |
        |                   +------------------+         +------------------+
        |                   |   indicators     |                 |
        |                   +------------------+                 | 1:N
        |                   | id (PK)          |                 v
        |                   | goal_id (FK)     |         +------------------+
        |                   | name             |         |    insights      |
        |                   | code (UQ)        |         +------------------+
        |                   | unit             |         | id (PK)          |
        |                   | source           |         | type (enum)      |
        |                   | baseline_value   |         | severity (enum)  |
        |                   | baseline_year    |         | title            |
        |                   | target_value     |         | description      |
        |                   | target_year      |         | evidence (JSONB) |
        |                   +------------------+         | goal_id (FK)     |
        |                           |                    | indicator_id FK  |
        |                           | 1:N                | member_state_id  |
        |                           v                    | etl_run_id (FK)  |
        |    +--------------------------------------+    | generated_at     |
        |    |        indicator_values              |    | is_active        |
        |    +--------------------------------------+    | included_in_rep. |
        |    | id (PK)                              |    +------------------+
        +--->| member_state_id (FK)                 |
             | indicator_id (FK)                    |
             | year                                 |    +------------------+
             | value                                |    |    reports       |
             | data_quality (enum)                  |    +------------------+
             | source_detail                        |    | id (PK)          |
             +--------------------------------------+    | title            |
             | UQ(indicator_id, member_state_id, year)   | report_type      |
             +--------------------------------------+    | parameters JSONB |
        |                                                | insights_incl.   |
        | 1:N                                            | generated_at     |
        v                                                | file_url         |
+------------------+    +------------------+             +------------------+
| gender_metrics   |    | youth_metrics    |
+------------------+    +------------------+     +---------------------------+
| id (PK)          |    | id (PK)          |     |   data_quality_scores     |
| member_state_id  |    | member_state_id  |     +---------------------------+
| year             |    | year             |     | id (PK)                   |
| women_parl_pct   |    | youth_unemp_pct  |     | member_state_id (FK)      |
| gender_parity_ed |    | youth_literacy   |     | indicator_id (FK)         |
| women_labor_pct  |    | youth_neet_pct   |     | completeness_pct          |
| maternal_mort.   |    | secondary_enroll |     | timeliness_years          |
| adol_fertility   |    +------------------+     | consistency_score         |
+------------------+                             | overall_score             |
                                                 | assessed_at               |
                                                 +---------------------------+
```

### 3.2 Table Specifications

#### Reference Tables (Seed Data)

| Table | Rows | Description |
|-------|------|-------------|
| `regions` | 5 | AU geographic regions (North, West, Central, East, Southern Africa) |
| `aspirations` | 7 | Agenda 2063 aspirations (top-level strategic framework) |
| `goals` | 20 | Agenda 2063 goals nested under aspirations |
| `member_states` | 55 | All AU member states with ISO codes and region mapping |
| `indicators` | 24 | Development indicator definitions with World Bank codes |
| `data_sources` | 1+ | External data source registry (World Bank, future sources) |

#### Data Tables (ETL-Populated)

| Table | Est. Rows | Description |
|-------|-----------|-------------|
| `indicator_values` | ~33,000 | Core time-series data: value per indicator per country per year |
| `gender_metrics` | ~1,375 | Denormalized gender indicators per country-year |
| `youth_metrics` | ~1,375 | Denormalized youth indicators per country-year |

#### Analytical Tables (System-Generated)

| Table | Description |
|-------|-------------|
| `insights` | Auto-generated findings, alerts, trends, recommendations |
| `etl_runs` | Pipeline execution audit trail |
| `data_quality_scores` | Completeness, timeliness, and consistency scores |
| `reports` | Generated report metadata and linked insights |

### 3.3 Key Constraints and Indexing Strategy

```sql
-- Unique constraint on indicator_values prevents duplicates
ALTER TABLE indicator_values
  ADD CONSTRAINT uq_indicator_value
  UNIQUE (indicator_id, member_state_id, year);

-- Critical indexes for query performance
CREATE INDEX idx_indicator_values_indicator ON indicator_values(indicator_id);
CREATE INDEX idx_indicator_values_country   ON indicator_values(member_state_id);
CREATE INDEX idx_indicator_values_year      ON indicator_values(year DESC);
CREATE INDEX idx_indicator_values_composite ON indicator_values(indicator_id, year DESC);

CREATE INDEX idx_insights_active     ON insights(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_insights_type       ON insights(type);
CREATE INDEX idx_insights_severity   ON insights(severity);
CREATE INDEX idx_insights_generated  ON insights(generated_at DESC);

CREATE INDEX idx_gender_metrics_country  ON gender_metrics(member_state_id, year DESC);
CREATE INDEX idx_youth_metrics_country   ON youth_metrics(member_state_id, year DESC);
CREATE INDEX idx_etl_runs_started        ON etl_runs(started_at DESC);
CREATE INDEX idx_member_states_iso       ON member_states(iso_code);
CREATE INDEX idx_member_states_region    ON member_states(region_id);
CREATE INDEX idx_indicators_code         ON indicators(code);
CREATE INDEX idx_indicators_goal         ON indicators(goal_id);
```

### 3.4 Enumeration Types

```python
class InsightType(str, Enum):        class InsightSeverity(str, Enum):
    FINDING = "finding"                  POSITIVE = "positive"
    ALERT = "alert"                      NEUTRAL = "neutral"
    TREND = "trend"                      WARNING = "warning"
    RECOMMENDATION = "recommendation"    CRITICAL = "critical"
    COMPARISON = "comparison"
    MILESTONE = "milestone"

class ETLStatus(str, Enum):          class DataQuality(str, Enum):
    RUNNING = "running"                  VERIFIED = "verified"
    COMPLETED = "completed"              ESTIMATED = "estimated"
    FAILED = "failed"                    MISSING = "missing"

class ReportType(str, Enum):         class Region(str, Enum):
    EXECUTIVE_SUMMARY                    NORTH_AFRICA = "North Africa"
    GENDER_BRIEF                         WEST_AFRICA = "West Africa"
    YOUTH_BRIEF                          CENTRAL_AFRICA = "Central Africa"
    COUNTRY_PROFILE                      EAST_AFRICA = "East Africa"
    GOAL_PROGRESS                        SOUTHERN_AFRICA = "Southern Africa"
```

### 3.5 Supabase Row-Level Security (RLS)

All tables have RLS enabled to enforce access control at the database level:

```sql
-- Public read access for dashboard and analytics
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON regions FOR SELECT USING (true);

-- Service role required for writes (ETL pipeline, insights engine)
CREATE POLICY "Service write" ON indicator_values
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service write" ON insights
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can generate reports
CREATE POLICY "Auth reports" ON reports
  FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
```

---

## 4. ETL Pipeline

### 4.1 Pipeline Architecture

```
+-------------------------------------------------------------------+
|                     ETL PIPELINE FLOW                              |
+-------------------------------------------------------------------+
|                                                                    |
|  TRIGGER                                                           |
|  POST /api/v1/pipeline/trigger                                     |
|  (BackgroundTasks for non-blocking execution)                      |
|                                                                    |
|       |                                                            |
|       v                                                            |
|  +------------------+                                              |
|  | 1. CREATE RUN    |  Insert etl_runs record (status: "running")  |
|  +--------+---------+                                              |
|           |                                                        |
|           v                                                        |
|  +------------------+                                              |
|  | 2. BUILD LOOKUPS |  member_states -> ID, indicators -> ID       |
|  +--------+---------+                                              |
|           |                                                        |
|           v                                                        |
|  +------------------+    For each of 24 indicators:                |
|  | 3. EXTRACT       |                                              |
|  |                  |    GET api.worldbank.org/v2/country/          |
|  |  httpx.AsyncClient    DZ;AO;BJ;...;ZW/indicator/{code}         |
|  |  timeout=120s    |    ?format=json&per_page=10000               |
|  |  paginated       |    &date=2000:2024                           |
|  +--------+---------+                                              |
|           |                                                        |
|           v                                                        |
|  +------------------+                                              |
|  | 4. TRANSFORM     |    - Filter null values                      |
|  |                  |    - Map country ISO -> member_state_id       |
|  |                  |    - Map indicator code -> indicator_id       |
|  |                  |    - Cast types (year -> int, value -> float) |
|  |                  |    - Set data_quality = "verified"            |
|  +--------+---------+                                              |
|           |                                                        |
|           v                                                        |
|  +------------------+                                              |
|  | 5. LOAD          |    Upsert into indicator_values              |
|  |                  |    (ON CONFLICT indicator_id,                 |
|  |  Batch: 500/chunk|     member_state_id, year)                   |
|  |                  |    + Update gender_metrics table              |
|  |                  |    + Update youth_metrics table               |
|  +--------+---------+                                              |
|           |                                                        |
|           v                                                        |
|  +------------------+                                              |
|  | 6. GENERATE      |    Trigger insights_engine.                  |
|  |    INSIGHTS      |    generate_all_insights(etl_run_id)         |
|  +--------+---------+                                              |
|           |                                                        |
|           v                                                        |
|  +------------------+                                              |
|  | 7. FINALIZE      |    Update etl_runs:                          |
|  |                  |    status="completed", records_processed,     |
|  |                  |    insights_generated                         |
|  +------------------+                                              |
+-------------------------------------------------------------------+
```

### 4.2 World Bank API Integration

The pipeline fetches 24 development indicators from the World Bank API v2 for all 55 AU member states:

| # | World Bank Code | Indicator Name | Agenda 2063 Goal |
|---|----------------|----------------|------------------|
| 1 | `NY.GDP.PCAP.CD` | GDP per capita (current US$) | Goal 1: High standard of living |
| 2 | `SI.POV.DDAY` | Poverty headcount ratio ($2.15/day) | Goal 1: High standard of living |
| 3 | `SE.ADT.LITR.ZS` | Adult literacy rate | Goal 2: Well-educated citizens |
| 4 | `SE.PRM.ENRR` | Primary school enrollment | Goal 2: Well-educated citizens |
| 5 | `SE.SEC.ENRR` | Secondary school enrollment | Goal 2: Well-educated citizens |
| 6 | `SP.DYN.LE00.IN` | Life expectancy at birth | Goal 3: Healthy citizens |
| 7 | `SH.STA.MMRT` | Maternal mortality ratio | Goal 3: Healthy citizens |
| 8 | `SH.DYN.MORT` | Under-5 mortality rate | Goal 3: Healthy citizens |
| 9 | `NV.IND.MANF.ZS` | Manufacturing value added (% GDP) | Goal 4: Transformed economies |
| 10 | `BX.KLT.DINV.WD.GD.ZS` | FDI net inflows (% GDP) | Goal 4: Transformed economies |
| 11 | `NV.AGR.TOTL.ZS` | Agriculture value added (% GDP) | Goal 5: Modern agriculture |
| 12 | `EN.ATM.CO2E.PC` | CO2 emissions per capita | Goal 7: Environmentally sustainable |
| 13 | `EG.FEC.RNEW.ZS` | Renewable energy consumption (%) | Goal 7: Environmentally sustainable |
| 14 | `IT.NET.USER.ZS` | Internet users (% population) | Goal 10: World-class infrastructure |
| 15 | `IT.CEL.SETS.P2` | Mobile subscriptions per 100 | Goal 10: World-class infrastructure |
| 16 | `EG.ELC.ACCS.ZS` | Access to electricity (%) | Goal 10: World-class infrastructure |
| 17 | `SG.GEN.PARL.ZS` | Women in parliament (%) | Goal 17: Full gender equality |
| 18 | `SE.ENR.PRIM.FM.ZS` | Gender parity index (primary) | Goal 17: Full gender equality |
| 19 | `SL.TLF.CACT.FE.ZS` | Female labor force participation | Goal 17: Full gender equality |
| 20 | `SL.UEM.1524.ZS` | Youth unemployment (%) | Goal 18: Engaged and empowered youth |
| 21 | `SH.STA.BRTC.ZS` | Births attended by skilled staff (%) | Goal 3: Healthy citizens |
| 22 | `GC.TAX.TOTL.GD.ZS` | Tax revenue (% GDP) | Goal 4: Transformed economies |
| 23 | `SP.ADO.TFRT` | Adolescent fertility rate | Goal 17: Full gender equality |
| 24 | `SH.HIV.INCD.TL.P3` | HIV incidence (per 1,000) | Goal 3: Healthy citizens |

### 4.3 All 55 AU Member States

The pipeline covers every AU member state by ISO 3166-1 alpha-2 code:

```
DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ
EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG
MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO
ZA SS SD TZ TG TN UG ZM ZW
```

(54 listed; the Sahrawi Arab Democratic Republic is included via manual data where applicable, bringing the total to 55.)

### 4.4 Denormalized Metric Tables

During ETL, the pipeline simultaneously populates denormalized tables for WGYD analytics:

```
Gender Metrics Table                    Youth Metrics Table
+---------------------------+           +---------------------------+
| SG.GEN.PARL.ZS           |           | SL.UEM.1524.ZS            |
|   -> women_parliament_pct |           |   -> youth_unemployment_pct|
| SE.ENR.PRIM.FM.ZS        |           | SE.SEC.ENRR               |
|   -> gender_parity_educ.  |           |   -> secondary_enrollment |
| SL.TLF.CACT.FE.ZS        |           +---------------------------+
|   -> women_labor_force_pct|
| SH.STA.MMRT              |
|   -> maternal_mortality   |
| SP.ADO.TFRT              |
|   -> adolescent_fertility |
+---------------------------+
```

### 4.5 Error Handling and Resilience

```python
# httpx timeout: 120 seconds per request to handle large payloads
async with httpx.AsyncClient(timeout=120.0) as client:
    resp = await client.get(url, params=params)

# Per-indicator error isolation: one indicator failure does not halt the pipeline
for indicator_code in indicators_to_fetch:
    try:
        records = await fetch_world_bank_indicator(indicator_code, ...)
        # ... transform and load ...
    except Exception as e:
        total_failed += 1
        logger.error("etl_indicator_error", code=indicator_code, error=str(e))

# Batch upsert in chunks of 500 to avoid payload limits
for i in range(0, len(batch), 500):
    chunk = batch[i:i + 500]
    supabase.table("indicator_values").upsert(
        chunk, on_conflict="indicator_id,member_state_id,year"
    ).execute()

# Pagination support for large World Bank API responses
total_pages = data[0].get("pages", 1)
for page in range(2, total_pages + 1):
    params["page"] = page
    resp = await client.get(url, params=params)
```

### 4.6 Background Execution

ETL runs are executed as FastAPI `BackgroundTasks` to keep the API responsive:

```python
@router.post("/trigger")
async def trigger_pipeline(background_tasks: BackgroundTasks, ...):
    async def _run_pipeline():
        result = await run_etl(...)
        if result.get("etl_run_id"):
            await generate_all_insights(result["etl_run_id"])

    background_tasks.add_task(_run_pipeline)
    return {"message": "ETL pipeline triggered", "status": "started"}
```

---

## 5. Insights Engine

### 5.1 Architecture Overview

The Insights Engine is the analytical core of the system. After each ETL run, it analyzes loaded data and generates structured insight records as first-class database objects --- not ephemeral computations.

```
+-----------------------------------------------------------------------+
|                        INSIGHTS ENGINE                                 |
+-----------------------------------------------------------------------+
|                                                                        |
|  Input: indicator_values, gender_metrics, youth_metrics, goals         |
|                                                                        |
|  +-------------------+  +-------------------+  +-------------------+   |
|  | Gender Findings   |  | Youth Alerts      |  | Health Findings   |   |
|  | - Parliament %    |  | - Unemployment    |  | - Life expectancy |   |
|  | - Top/bottom 3    |  | - Year-over-year  |  | - Maternal mort.  |   |
|  +-------------------+  +-------------------+  +-------------------+   |
|                                                                        |
|  +-------------------+  +-------------------+  +-------------------+   |
|  | Education         |  | Economic          |  | Infrastructure    |   |
|  | - Literacy rates  |  | - GDP per capita  |  | - Internet %      |   |
|  | - Below 50% alert |  | - Below $1,000    |  | - Electricity %   |   |
|  +-------------------+  +-------------------+  +-------------------+   |
|                                                                        |
|  +-------------------+  +-------------------+  +-------------------+   |
|  | Regional Compare  |  | Milestones        |  | Trend Analysis    |   |
|  | - GDP by region   |  | - Progress vs     |  | - Year-over-year  |   |
|  | - Life exp. by    |  |   Agenda 2063     |  | - Continental     |   |
|  |   region          |  |   targets         |  |   direction       |   |
|  +-------------------+  +-------------------+  +-------------------+   |
|                                                                        |
|  +----------------------------------+                                  |
|  | Recommendations                  |                                  |
|  | - Youth employment intervention  |                                  |
|  | - Digital infrastructure invest. |                                  |
|  +----------------------------------+                                  |
|                                                                        |
|  Output: Persisted insight records with type, severity, evidence       |
+-----------------------------------------------------------------------+
```

### 5.2 Six Insight Types

| Type | Purpose | Example |
|------|---------|---------|
| **finding** | Statement of fact derived from data | "Only 12 of 48 AU states have >30% women in parliament" |
| **alert** | Data-driven warning requiring attention | "7 AU countries have youth unemployment above 30%" |
| **trend** | Year-over-year directional change | "Internet penetration: Positive trend -- 35 of 48 countries improving" |
| **recommendation** | Evidence-based action suggestion | "Prioritize youth employment interventions in Southern Africa" |
| **comparison** | Cross-country or cross-region ranking | "GDP per capita: North Africa leads ($3,800), East Africa lags ($890)" |
| **milestone** | Progress toward Agenda 2063 targets | "Adult literacy: 68% toward 2063 target -- needs acceleration" |

### 5.3 Four Severity Levels

| Severity | Color | Criteria | Example |
|----------|-------|----------|---------|
| **positive** | Green | Metric on track or improving | "Electricity access: Continental trend improving" |
| **neutral** | Gray | Informational, no urgency | "Regional comparison: GDP per capita breakdown" |
| **warning** | Gold | Below target, needs attention | "Only 30% women in parliament vs. 50% target" |
| **critical** | Red | Crisis-level, immediate action | "7 countries with youth unemployment >30% (target: <6%)" |

### 5.4 Ten Generators

Each generator runs independently, and a failure in one does not affect the others:

```python
generators = [
    _generate_gender_findings,        # 1. Women in parliament analysis
    _generate_youth_alerts,           # 2. Youth unemployment + year-over-year
    _generate_health_findings,        # 3. Life expectancy + maternal mortality
    _generate_education_findings,     # 4. Adult literacy rates
    _generate_economic_findings,      # 5. GDP per capita analysis
    _generate_infrastructure_findings,# 6. Internet + electricity access
    _generate_regional_comparisons,   # 7. Cross-region indicator comparison
    _generate_milestone_insights,     # 8. Progress vs Agenda 2063 targets
    _generate_trend_insights,         # 9. Year-over-year continental trends
    _generate_recommendations,        # 10. Evidence-based action suggestions
]

for gen in generators:
    try:
        results = await gen(supabase, etl_run_id)
        for r in results:
            insights_count[r["type"]] += 1
    except Exception as e:
        logger.error("insight_generation_error", generator=gen.__name__, error=str(e))
```

### 5.5 Insight Data Model

Every insight is a first-class database object with structured evidence:

```python
{
    "type": "alert",                          # One of 6 types
    "severity": "critical",                   # One of 4 levels
    "title": "7 AU countries have youth unemployment above 30%",
    "description": "Critical youth employment crisis: 7 member states...",
    "evidence": {                             # JSONB -- machine-readable proof
        "indicator": "SL.UEM.1524.ZS",
        "countries_above_30": 7,
        "target": 6,
        "highest": [
            {"country": "South Africa", "value": 55.2},
            {"country": "Eswatini", "value": 47.3},
        ],
    },
    "goal_id": 18,                            # FK to Agenda 2063 goal
    "etl_run_id": 5,                          # FK to triggering ETL run
    "generated_at": "2026-02-27T10:30:00Z",
    "is_active": true,                        # Deactivated on next generation
    "included_in_report": false,              # True when used in a report
}
```

### 5.6 Lifecycle Management

```
ETL Run Completes
       |
       v
Deactivate all existing active insights
(is_active = false)
       |
       v
Run all 10 generators against fresh data
       |
       v
Insert new insights (is_active = true)
       |
       v
Update etl_runs.insights_generated count
       |
       v
Available via /api/v1/insights/*
Available for report generation
```

---

## 6. Frontend Architecture

### 6.1 Single-Page Application Structure

```
frontend/
+-- index.html        # Shell: sidebar navigation + main content area
+-- css/
|   +-- au-theme.css  # AU branded design system (Gold #C8A415, Green #009A44)
+-- js/
    +-- api.js        # REST API client (fetch wrapper, 25+ methods)
    +-- charts.js     # Plotly.js chart builders (7 chart types)
    +-- app.js        # Application controller (navigation, page loaders)
```

### 6.2 Navigation Architecture

The SPA uses a client-side router pattern with `data-page` attributes:

```
Sidebar Navigation                    Main Content Area
+----------------------------+        +-----------------------------------+
| Overview                   |        |                                   |
|   [Dashboard]       -------|------->|  loadDashboard()                  |
|   [Agenda 2063]     -------|------->|  loadAgenda2063()                 |
|                            |        |                                   |
| Analytics                  |        |                                   |
|   [Gender & Youth]  -------|------->|  loadGenderYouth()                |
|   [Insights Engine] -------|------->|  loadInsights()                   |
|   [Member States]   -------|------->|  loadCountries()                  |
|                            |        |                                   |
| Operations                 |        |                                   |
|   [Data Pipeline]   -------|------->|  loadPipeline()                   |
|   [Reports]         -------|------->|  loadReports()                    |
+----------------------------+        +-----------------------------------+
```

### 6.3 API Client

The API client provides typed methods for all backend endpoints:

```javascript
const api = {
    // Core
    async getDashboard()      { return this.get('/dashboard/summary'); },
    async getHealth()         { return this.get('/health'); },

    // Agenda 2063
    async getGoals()          { return this.get('/goals'); },
    async getGoalProgress(id) { return this.get(`/goals/${id}/progress`); },
    async getGoalByRegion(id) { return this.get(`/goals/${id}/by-region`); },

    // Analytics
    async getGenderOverview() { return this.get('/gender/overview'); },
    async getYouthOverview()  { return this.get('/youth/overview'); },

    // Insights
    async getInsights(type, severity) { ... },
    async generateInsights()  { return this.post('/insights/generate'); },

    // Pipeline
    async triggerPipeline()   { return this.post('/pipeline/trigger'); },
    async seedDatabase()      { return this.post('/pipeline/seed'); },

    // Reports
    async generateReport(type, params) { return this.post('/reports/generate', {...}); },
};
```

### 6.4 Visualization Layer (Plotly.js)

Seven AU-branded chart types are available:

| Chart Type | Function | Use Case |
|------------|----------|----------|
| **Gauge** | `charts.gauge()` | KPI progress toward Agenda 2063 targets |
| **Horizontal Bar** | `charts.barChart()` | Country rankings by indicator |
| **Line Chart** | `charts.lineChart()` | Time series trends (gender, youth, health) |
| **Regional Bar** | `charts.regionalBar()` | 5-region comparison with color coding |
| **Donut** | `charts.donut()` | Distribution breakdowns |
| **Choropleth Map** | `charts.africaMap()` | Africa-scoped country heat maps |
| **Insights Donut** | `charts.insightsSummary()` | Insight type distribution |

### 6.5 AU Branding System

```javascript
const AU_COLORS = {
    gold:   '#C8A415',    // AU official gold
    green:  '#009A44',    // AU official green
    dark:   '#1B1B1B',    // Primary text
    blue:   '#2196F3',    // Accent
    red:    '#D32F2F',    // Critical/alert
    purple: '#7C4DFF',    // Secondary accent
    orange: '#FF9800',    // Milestone
    teal:   '#00BCD4',    // Tertiary accent
};

const REGION_COLORS = {
    'North Africa':    '#C8A415',  // Gold
    'West Africa':     '#009A44',  // Green
    'East Africa':     '#2196F3',  // Blue
    'Central Africa':  '#7C4DFF',  // Purple
    'Southern Africa': '#FF9800',  // Orange
};
```

---

## 7. Security Architecture

### 7.1 Security Layers

```
+===========================================================+
|                    SECURITY LAYERS                         |
+===========================================================+
|                                                            |
|  Layer 1: CORS (Cross-Origin Resource Sharing)             |
|  +------------------------------------------------------+ |
|  | Origins configured via CORS_ORIGINS environment var   | |
|  | Default: localhost:3000, localhost:8000                | |
|  | Production: restricted to deployment domain           | |
|  +------------------------------------------------------+ |
|                                                            |
|  Layer 2: Input Validation (Pydantic)                      |
|  +------------------------------------------------------+ |
|  | 30+ Pydantic schemas validate all request data        | |
|  | Type coercion, range constraints, enum validation     | |
|  | Example: iso_code (min_length=2, max_length=2)        | |
|  | Example: goal number (ge=1, le=20)                    | |
|  +------------------------------------------------------+ |
|                                                            |
|  Layer 3: Environment-Based Configuration                  |
|  +------------------------------------------------------+ |
|  | Secrets in .env file, never in code                   | |
|  | SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL         | |
|  | SUPABASE_SERVICE_ROLE_KEY for admin operations        | |
|  | extra="ignore" prevents env injection                 | |
|  +------------------------------------------------------+ |
|                                                            |
|  Layer 4: Supabase Row-Level Security                      |
|  +------------------------------------------------------+ |
|  | Database-level access control                         | |
|  | Public read for analytics tables                      | |
|  | Service role required for writes                      | |
|  | Policies enforced regardless of API bypass            | |
|  +------------------------------------------------------+ |
|                                                            |
|  Layer 5: Structured Logging (structlog)                   |
|  +------------------------------------------------------+ |
|  | Every operation logged with structured context        | |
|  | ETL runs, insight generation, errors -- all auditable | |
|  | JSON format for log aggregation and alerting          | |
|  +------------------------------------------------------+ |
|                                                            |
+===========================================================+
```

### 7.2 Key Security Measures

| Measure | Implementation |
|---------|---------------|
| **No hardcoded secrets** | All credentials via environment variables |
| **Input validation** | Pydantic v2 schemas on every endpoint |
| **CORS lockdown** | Origin whitelist from environment |
| **Database RLS** | Supabase policies enforce read/write separation |
| **Connection limits** | asyncpg pool capped at 10 connections |
| **Timeout protection** | 30s DB command timeout, 120s HTTP timeout |
| **Error isolation** | Per-indicator, per-generator try/catch prevents cascading failures |
| **Audit trail** | etl_runs table logs every pipeline execution |

---

## 8. Deployment Architecture

### 8.1 Infrastructure Diagram

```
                    +------------------+
                    |   End Users      |
                    |  (AU Staff /     |
                    |   Reviewers)     |
                    +--------+---------+
                             |
                             | HTTPS
                             v
                    +------------------+
                    |   Render.com     |
                    |   (PaaS)         |
                    +------------------+
                    |                  |
                    |  Docker          |
                    |  Container       |
                    |                  |
                    |  +------------+  |
                    |  | FastAPI    |  |
                    |  | uvicorn    |  |
                    |  | port 8000  |  |
                    |  +------+-----+  |
                    |         |        |
                    |  +------+-----+  |
                    |  | Static     |  |
                    |  | Frontend   |  |
                    |  | /frontend/ |  |
                    |  +------------+  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
     +------------------+         +------------------+
     | Supabase         |         | World Bank API   |
     | Managed          |         | (Outbound)       |
     | PostgreSQL       |         |                  |
     |                  |         | api.worldbank.   |
     | riycajzmxllwk... |         | org/v2           |
     | .supabase.co     |         |                  |
     +------------------+         +------------------+
```

### 8.2 Docker Configuration

```dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ app/

# Expose port
EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 8.3 Environment Variables (Production)

```
ENVIRONMENT=production
SUPABASE_URL=https://riycajzmxllwkqroaaog.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:...@db.riycajzmxllwkqroaaog.supabase.co:5432/postgres
CORS_ORIGINS=["https://au-central-reporting.onrender.com"]
API_VERSION=1.0.0
LOG_LEVEL=INFO
```

### 8.4 Dependency Stack

```
# Web Framework
fastapi>=0.109.0          uvicorn[standard]>=0.27.0
pydantic>=2.5.0           pydantic-settings>=2.1.0

# Database
asyncpg>=0.29.0           supabase>=2.3.0

# Data Processing
pandas>=2.0.0             numpy>=1.24.0             openpyxl>=3.1.0

# HTTP Client
httpx>=0.26.0

# Security
python-jose[cryptography]>=3.3.0    passlib[bcrypt]>=1.7.4

# Reports
reportlab>=4.0.0          xlsxwriter>=3.1.0

# Utilities
python-dotenv>=1.0.0      structlog>=24.1.0         tenacity>=8.2.0
python-multipart>=0.0.6
```

---

## 9. Why This Architecture

### 9.1 Decision Rationale

| Decision | Alternatives Considered | Why This Choice |
|----------|------------------------|-----------------|
| **FastAPI** over Django/Flask | Django REST Framework, Flask | Async-native, automatic OpenAPI docs, Pydantic integration, 40% faster than Flask for I/O-bound work |
| **Supabase** over raw PostgreSQL | Self-hosted PG, Firebase, MongoDB | Managed PostgreSQL with RLS, REST API, auth, real-time subscriptions -- reduces ops overhead for a small team |
| **Dual DB access** (supabase-py + asyncpg) | Single access method | REST client for simple CRUD, raw pool for complex analytics -- best of both worlds |
| **World Bank API** as primary source | UN Data, AfDB, manual data entry | Most comprehensive coverage of AU states, free API, well-documented, 24 relevant indicators |
| **Insights as DB objects** | Computed on-the-fly, cached | Persist for audit trail, link to reports, filter/query, track evolution over time |
| **Vanilla JS frontend** over React/Vue | Next.js, React, Vue, Svelte | Zero build step, instant deployment, smaller bundle, sufficient for dashboard use case |
| **Plotly.js** over D3/Chart.js | D3.js, ECharts, Chart.js | Built-in choropleth maps (critical for Africa view), interactive without boilerplate, declarative API |
| **Pydantic v2** for validation | Marshmallow, attrs, dataclasses | Native FastAPI integration, 5-50x faster than v1, discriminated unions for insight types |
| **structlog** over stdlib logging | Python logging, loguru | Structured JSON output, context binding, production-ready log aggregation |
| **Background ETL** (BackgroundTasks) | Celery, RQ, Dramatiq | No external broker needed, sufficient for hourly/daily ETL runs, simpler deployment |
| **Docker** for deployment | VM, serverless (Lambda) | Consistent environment, single-command deploy, Render native support |
| **Batch upsert (500/chunk)** | Single inserts, full batch | Balances throughput with Supabase REST payload limits (max ~1MB per request) |

### 9.2 Scalability Considerations

| Dimension | Current Capacity | Scale Path |
|-----------|-----------------|------------|
| Data volume | ~33,000 indicator values | Partitioning by year if >1M rows |
| API throughput | ~1,000 req/s (uvicorn) | Add workers, load balancer |
| ETL frequency | On-demand (minutes) | Scheduled via cron, parallel indicator fetch |
| Insights | ~30-50 per run | Add generators, ML-based anomaly detection |
| Users | Single-tenant | Supabase auth + RLS for multi-tenant |
| Data sources | World Bank only | Plugin architecture for UN, AfDB, IMF |

### 9.3 Alignment with AU Requirements

| AU Need | System Capability |
|---------|-------------------|
| Agenda 2063 M&E | 20 goals modeled with progress tracking and targets |
| Gender & Youth (WGYD) | Dedicated analytics service with 5 gender + 2 youth indicators |
| Evidence-based decisions | Insights Engine generates structured evidence with every claim |
| Continental coverage | All 55 member states with 5-region geographic breakdown |
| Executive reporting | Pyramid Principle reports with key finding up front |
| Data quality monitoring | Completeness, timeliness, and consistency scoring per country per indicator |
| Interoperability | REST API with OpenAPI spec enables integration with other AU systems |

---

## Appendix A: API Endpoint Reference

```
GET    /                              Root info
GET    /api/v1/health                 Health check

GET    /api/v1/dashboard/summary      Dashboard KPIs

GET    /api/v1/goals                  List all 20 goals
GET    /api/v1/goals/{id}             Goal detail + indicators
GET    /api/v1/goals/{id}/progress    Goal progress summary
GET    /api/v1/goals/{id}/by-region   Goal progress by region

GET    /api/v1/indicators             List indicators (filter by goal)
GET    /api/v1/indicators/{id}/values Time series data
GET    /api/v1/indicators/{id}/ranking Country rankings
GET    /api/v1/indicators/{id}/trend  Year-over-year trends

GET    /api/v1/countries              List member states (filter by region)
GET    /api/v1/countries/{iso}/profile Country profile with indicators
GET    /api/v1/countries/{iso}/scorecard Country scorecard
GET    /api/v1/countries/compare      Compare multiple countries

GET    /api/v1/gender/overview        Continental gender summary
GET    /api/v1/gender/by-country      Gender metrics per country
GET    /api/v1/gender/trends          Gender time series
GET    /api/v1/gender/parity-index    Education parity index

GET    /api/v1/youth/overview         Continental youth summary
GET    /api/v1/youth/by-country       Youth metrics per country
GET    /api/v1/youth/employment       Youth employment analysis
GET    /api/v1/youth/trends           Youth time series

GET    /api/v1/insights               List active insights (filter by type/severity)
GET    /api/v1/insights/latest        Most recent insights
GET    /api/v1/insights/critical      Critical alerts only
GET    /api/v1/insights/by-goal/{id}  Insights for a specific goal
GET    /api/v1/insights/summary       Counts by type and severity
POST   /api/v1/insights/generate      Trigger insight regeneration

POST   /api/v1/pipeline/trigger       Start ETL pipeline
POST   /api/v1/pipeline/seed          Seed reference data
GET    /api/v1/pipeline/status        ETL run history
GET    /api/v1/pipeline/sources       Data source registry

POST   /api/v1/reports/generate       Generate a report
GET    /api/v1/reports                List generated reports
GET    /api/v1/reports/export/excel   Download Excel report

POST   /api/v1/upload                 Upload CSV/Excel data

GET    /api/v1/data-quality/overview  Continental quality summary
GET    /api/v1/data-quality/by-country Quality scores per country
POST   /api/v1/data-quality/assess    Trigger quality assessment
```

## Appendix B: Seed Data Files

| File | Location | Contents |
|------|----------|----------|
| `aspirations.json` | `data/seed/` | 7 Agenda 2063 aspirations |
| `goals.json` | `data/seed/` | 20 goals with aspiration mapping |
| `member_states.json` | `data/seed/` | 55 countries with ISO codes and regions |
| `indicator_definitions.json` | `data/seed/` | 24 indicators with World Bank codes and targets |

---

*This architecture document describes the AU Central Reporting System as built for the African Union Digital Innovation Fellowship. The system demonstrates production-grade data engineering, API design, and analytical capabilities aligned with the AU's Agenda 2063 monitoring and evaluation requirements.*
