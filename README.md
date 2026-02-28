# African Union Central Reporting System

**A data intelligence platform that transforms fragmented continental data into actionable insights for evidence-based decision-making across the African Union.**

Built to address the AU's core data challenge: **55 member states, 20 Agenda 2063 goals, thousands of indicators -- but no centralized system to collect, clean, analyze, and report on them in real time.**

---

## The Problem

The African Union tracks progress across **7 aspirations and 20 goals** under Agenda 2063, spanning 55 member states. Today, this data lives in:

- PDF reports published annually with 1-2 year data lags
- Scattered Excel files across departments (ODG, WGYD, ICD, MIS)
- External partner databases (World Bank, UNECA, AfDB) with no unified access layer
- Manual spreadsheet-based analysis that takes weeks to compile before major meetings

**The result:** Decision-makers in the Director General's Office wait days or weeks for basic continental metrics. Gender and youth indicators are tracked inconsistently. No automated alerts when indicators deteriorate. No system to tell the data story automatically.

## The Solution

This platform provides the **complete data lifecycle** -- not just dashboards, but the entire pipeline from data collection to automated insight generation:

```
Data Sources (World Bank, UN SDG, Manual Uploads)
    ↓
ETL Pipeline (Extract, Clean, Validate, Load)
    ↓
PostgreSQL Database (Supabase) -- 55 countries × 24 indicators × 25 years (23,100+ records)
    ↓
Insights Engine (Auto-generates findings, alerts, trends, recommendations)
    ↓
REST API (FastAPI -- 35+ endpoints with Swagger docs)
    ↓
AU-Branded Dashboard (Real-time KPIs, charts, executive reports)
```

### Key Capabilities

| Capability | What It Does | Who It Serves |
|-----------|-------------|---------------|
| **Agenda 2063 Goal Tracker** | Progress monitoring across all 20 goals with regional breakdowns | Office of the Director General |
| **Gender & Youth Analytics** | Gender parity, women in leadership, youth employment trends with M&E indicators | Women, Gender and Youth Directorate |
| **Automated Insights Engine** | After every data refresh, auto-generates findings, alerts, and recommendations as first-class objects | All departments |
| **Data Pipeline (ETL)** | Pulls from World Bank API for all 55 AU member states, cleans and validates automatically | MIS / Data teams |
| **Executive Report Generator** | Consulting-style reports following the Pyramid Principle -- answer first, evidence second | Senior leadership |
| **Data Quality Scoring** | Tracks completeness, timeliness, and consistency of data per country and indicator | M&E teams |
| **Country Scorecards** | Per-country Agenda 2063 progress dashboards | Member State representatives |

### The Insights Engine

The system doesn't just store and display data -- **it tells the story automatically.**

After every ETL run, the Insights Engine analyzes the data and generates:

| Insight Type | Example | Severity |
|-------------|---------|----------|
| **Finding** | "Only 12 of 55 AU member states have >30% women in national parliament" | Neutral |
| **Alert** | "Youth unemployment in North Africa rose 8% year-over-year -- 3x the continental average" | Critical |
| **Trend** | "Gender parity in primary education improving across East Africa -- 5-year positive trajectory" | Positive |
| **Recommendation** | "Prioritize youth employment interventions in Sahel region (5 countries below 2063 target)" | Warning |
| **Milestone** | "Goal 17 (Gender Equality) reached 62% of 2063 target -- on track" | Positive |
| **Comparison** | "Southern Africa leads in secondary enrollment (68%); Central Africa lags (34%)" | Neutral |

These insights are **first-class database objects** -- they appear on dashboards, feed into notifications, and auto-compile into executive reports.

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                     AU-BRANDED FRONTEND                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│  │  Dashboard  │ │  Gender &  │ │  Insights  │ │  Reports   │     │
│  │  (KPIs +   │ │   Youth    │ │   Engine   │ │ Generator  │     │
│  │  Overview)  │ │  Analytics │ │   Feed     │ │            │     │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘     │
│  AU Gold (#C8A415) | AU Green (#009A44) | Professional Design     │
└──────────────────────────┬────────────────────────────────────────┘
                           │ REST API (JSON)
┌──────────────────────────┴────────────────────────────────────────┐
│                      FASTAPI BACKEND                              │
│                                                                   │
│  API Layer (35+ endpoints with auto-generated Swagger docs)       │
│  ├── /dashboard    KPI summary + recent insights                  │
│  ├── /goals        Agenda 2063 goal tracking + progress           │
│  ├── /indicators   Time series data + rankings                    │
│  ├── /countries    55 member state profiles + scorecards          │
│  ├── /gender       Gender analytics (WGYD)                        │
│  ├── /youth        Youth analytics (WGYD)                         │
│  ├── /insights     Insights Engine output                         │
│  ├── /pipeline     ETL trigger + monitoring                       │
│  ├── /reports      Executive report generation                    │
│  └── /health       Health check                                   │
│                                                                   │
│  Services Layer                                                   │
│  ├── etl_service       World Bank API extraction + cleaning       │
│  ├── insights_engine   Auto-generates findings from data          │
│  ├── analytics         Aggregations, trends, comparisons          │
│  ├── report_generator  PDF/Excel executive reports                │
│  └── data_quality      Validation + completeness scoring          │
└──────────────────────────┬────────────────────────────────────────┘
                           │
┌──────────────────────────┴────────────────────────────────────────┐
│                   SUPABASE (PostgreSQL)                            │
│  12+ tables: aspirations, goals, indicators, indicator_values,    │
│  member_states, regions, gender_metrics, youth_metrics,           │
│  insights, etl_runs, data_sources, reports, data_quality_scores   │
└──────────────────────────┬────────────────────────────────────────┘
                           │
┌──────────────────────────┴────────────────────────────────────────┐
│                   EXTERNAL DATA SOURCES                           │
│  ├── World Bank API (GDP, education, health, gender, youth)       │
│  ├── UN SDG Indicators (mapped to Agenda 2063 goals)              │
│  ├── Manual CSV/Excel uploads (AU internal reports)               │
│  └── Agenda 2063 Continental Report data (extracted)              │
└───────────────────────────────────────────────────────────────────┘
```

### Why This Architecture

| Decision | Rationale |
|----------|-----------|
| **FastAPI** | Async Python framework -- auto-generates OpenAPI/Swagger docs, type-safe with Pydantic, production-grade performance |
| **Supabase (PostgreSQL)** | Enterprise-grade database with built-in auth, storage, and real-time subscriptions. Row-level security for multi-tenant access |
| **ETL Pipeline (not Power BI)** | Power BI visualizes data; this platform manages the complete lifecycle. Automated ingestion, cleaning, validation, insight generation -- not just charts |
| **Insights Engine** | Insights as first-class objects enable automated storytelling. Every dashboard, notification, and report is data-driven end-to-end |
| **REST API** | Decoupled architecture enables any frontend (web, mobile, Power BI) to consume the same data layer |
| **World Bank API** | Real, authoritative, machine-readable data for all 55 AU member states with 20+ year history |

### Security
- Environment-based configuration (no secrets in code)
- Supabase Row-Level Security (RLS) for data access control
- CORS configuration for frontend access
- Input validation via Pydantic schemas on every endpoint
- Structured logging for audit trails

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (React/TypeScript), Tailwind CSS, Shadcn/ui, Recharts | 16-page AU-branded dashboard with auth |
| **Backend** | Python 3.11+, FastAPI | API server with 50+ endpoints, async support |
| **Database** | PostgreSQL via Supabase | Persistent data store with RLS |
| **Authentication** | Supabase Auth (JWT) | Role-based access: admin, analyst, viewer |
| **Data Processing** | Pandas, NumPy | ETL pipeline, data cleaning |
| **HTTP Client** | httpx | World Bank API integration |
| **AI Chatbot** | Rule-based NLP + keyword extraction | Natural language queries against real data |
| **Reports** | ReportLab, XlsxWriter | PDF and Excel report generation |
| **Deployment** | Docker, Render | Containerized backend hosting |
| **Version Control** | Git, GitHub | Source code management |

---

## Project Structure

```
├── frontend-next/                   # Next.js 14 frontend (primary)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/              # Login & Registration pages
│   │   │   ├── (dashboard)/         # 16 dashboard pages
│   │   │   │   ├── page.tsx         # Main dashboard (KPIs, insights)
│   │   │   │   ├── agenda-2063/     # Goal tracking + detail views
│   │   │   │   ├── gender-youth/    # WGYD gender & youth analytics
│   │   │   │   ├── insights/        # AI-powered Insights Engine
│   │   │   │   ├── countries/       # Member state profiles + scorecards
│   │   │   │   ├── me-framework/    # M&E logframe view
│   │   │   │   ├── data-quality/    # Data quality scoring dashboard
│   │   │   │   ├── data-entry/      # Manual data submission forms
│   │   │   │   ├── chat/            # AI Assistant chatbot
│   │   │   │   ├── pipeline/        # ETL operations management
│   │   │   │   ├── reports/         # Report generation & export
│   │   │   │   └── guide/           # In-app user guide (6 sections)
│   │   │   └── layout.tsx           # Root layout with AuthProvider
│   │   ├── components/              # Reusable UI components
│   │   │   ├── charts/              # Recharts wrappers (line, bar, donut, progress ring)
│   │   │   ├── layout/              # Sidebar, Topbar
│   │   │   └── ui/                  # Shadcn/ui components
│   │   ├── lib/
│   │   │   ├── api/                 # Typed API client (12 domain modules)
│   │   │   ├── supabase/            # Supabase browser client
│   │   │   ├── types/               # TypeScript interfaces (30+ types)
│   │   │   └── utils/               # Formatters, colors, helpers
│   │   ├── providers/               # Auth context provider
│   │   └── middleware.ts            # Route protection (auth redirect)
│   └── tailwind.config.ts           # AU brand colors & theme
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry point
│   │   ├── api/v1/                  # API route modules (14 routers, 50+ endpoints)
│   │   │   ├── chat.py              # AI chatbot (NLP keyword matching)
│   │   │   ├── dashboard.py         # KPI summary + recent insights
│   │   │   ├── goals.py             # Agenda 2063 goal tracking
│   │   │   ├── gender.py            # Gender analytics (WGYD)
│   │   │   ├── youth.py             # Youth analytics (WGYD)
│   │   │   ├── insights.py          # Insights Engine
│   │   │   ├── data_quality.py      # Data quality scoring
│   │   │   ├── pipeline.py          # ETL operations (admin-only)
│   │   │   ├── reports.py           # Report generation (analyst+)
│   │   │   └── upload.py            # Data upload (analyst+)
│   │   ├── core/
│   │   │   ├── auth.py              # JWT validation + role-based middleware
│   │   │   ├── config.py            # Environment configuration
│   │   │   └── database.py          # Supabase client
│   │   ├── services/                # Business logic layer
│   │   └── models/                  # Pydantic schemas (25+ models)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                        # Legacy vanilla JS dashboard
├── docs/                            # Comprehensive documentation
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   ├── ETL_PIPELINE.md
│   ├── INSIGHTS_ENGINE.md
│   ├── DATABASE_SCHEMA.md
│   └── USER_GUIDE.md
├── AU_CASE_STUDY.md                 # AU platform case study
├── AU_SLIDE_DECK.md                 # AU executive presentation
├── CASE_STUDY.md                    # PW system case study
├── SLIDE_DECK.md                    # PW executive presentation
└── README.md                        # This file
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account (free tier works)
- Git

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the server
uvicorn app.main:app --reload --port 8001
```

### Frontend Setup (Next.js)
```bash
cd frontend-next
npm install

# Configure environment
# Create .env.local with NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# Run the dev server
npm run dev
```

### Access
- **Frontend Dashboard**: http://localhost:3000 (login required)
- **API Documentation**: http://localhost:8001/docs (Swagger UI)
- **Health Check**: http://localhost:8001/api/v1/health

---

## Data Sources

| Source | Indicators | Coverage | Update Frequency |
|--------|-----------|----------|-----------------|
| World Bank API | GDP, education, health, gender, infrastructure | 55 AU states, 2000-2024 | Annual |
| UN SDG Indicators | SDG targets mapped to Agenda 2063 | Global | Annual |
| Manual Upload | AU-specific M&E data, internal reports | Variable | On-demand |

---

## API Documentation

Full interactive documentation available at `/docs` when the server is running.

See [docs/API_REFERENCE.md](docs/API_REFERENCE.md) for the complete endpoint specification.

---

## Relevance to the African Union

This platform directly addresses documented challenges across AU departments:

| AU Department | Challenge | How This Platform Helps |
|--------------|-----------|------------------------|
| **Office of the Director General** | No centralized dashboard for cross-departmental performance | Dashboard with instant access to all departmental KPIs and Agenda 2063 progress |
| **Women, Gender and Youth Directorate** | Fragmented gender/youth data, manual spreadsheet analysis | Automated gender and youth analytics with M&E indicator tracking |
| **Information and Communication Directorate** | Disconnected digital platforms (AKSP, Digital Library) | API-first architecture enabling system integration |
| **Management Information Systems** | Legacy systems not interoperable with modern platforms | REST API layer bridging data sources into unified access |

---

## Author

**Shedrack Emeka Ajakghe**
Full Stack Data Analyst | Data Pipelines, Dashboards & Evidence-Based Intelligence

- GitHub: [github.com/Astrochuks](https://github.com/Astrochuks)
- LinkedIn: [linkedin.com/in/shedrack-ajakghe-79484623b](https://www.linkedin.com/in/shedrack-ajakghe-79484623b)

---

*Built as a demonstration of end-to-end data platform capabilities for the AU Digital & Innovation Fellowship 2026/2027.*
