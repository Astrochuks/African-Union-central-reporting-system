-- ============================================================
-- AU Central Reporting System — Database Schema
-- Tracks Agenda 2063 progress across 55 AU member states
-- ============================================================

-- Regions
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    rec_name TEXT,  -- Regional Economic Community
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agenda 2063 Aspirations (7)
CREATE TABLE IF NOT EXISTS aspirations (
    id SERIAL PRIMARY KEY,
    number INTEGER UNIQUE NOT NULL CHECK (number BETWEEN 1 AND 7),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agenda 2063 Goals (20)
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    aspiration_id INTEGER NOT NULL REFERENCES aspirations(id) ON DELETE CASCADE,
    number INTEGER UNIQUE NOT NULL CHECK (number BETWEEN 1 AND 20),
    name TEXT NOT NULL,
    description TEXT,
    target_2063 TEXT,
    current_progress NUMERIC(5,2) DEFAULT 0 CHECK (current_progress BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member States (55 AU countries)
CREATE TABLE IF NOT EXISTS member_states (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    iso_code CHAR(2) UNIQUE NOT NULL,
    iso3_code CHAR(3) UNIQUE,
    region_id INTEGER REFERENCES regions(id),
    population BIGINT,
    gdp_per_capita NUMERIC(12,2),
    au_membership_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indicators (mapped to goals, sourced from World Bank etc.)
CREATE TABLE IF NOT EXISTS indicators (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    unit TEXT,
    source TEXT DEFAULT 'World Bank',
    description TEXT,
    baseline_value NUMERIC,
    baseline_year INTEGER,
    target_value NUMERIC,
    target_year INTEGER DEFAULT 2063,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indicator Time Series Values
CREATE TABLE IF NOT EXISTS indicator_values (
    id SERIAL PRIMARY KEY,
    indicator_id INTEGER NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
    member_state_id INTEGER NOT NULL REFERENCES member_states(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    value NUMERIC,
    data_quality TEXT DEFAULT 'verified' CHECK (data_quality IN ('verified', 'estimated', 'missing')),
    source_detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(indicator_id, member_state_id, year)
);

-- Gender Metrics (WGYD-specific)
CREATE TABLE IF NOT EXISTS gender_metrics (
    id SERIAL PRIMARY KEY,
    member_state_id INTEGER NOT NULL REFERENCES member_states(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    women_parliament_pct NUMERIC(5,2),
    gender_parity_education NUMERIC(5,3),
    women_labor_force_pct NUMERIC(5,2),
    maternal_mortality_ratio NUMERIC(8,2),
    adolescent_fertility_rate NUMERIC(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_state_id, year)
);

-- Youth Metrics (WGYD-specific)
CREATE TABLE IF NOT EXISTS youth_metrics (
    id SERIAL PRIMARY KEY,
    member_state_id INTEGER NOT NULL REFERENCES member_states(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    youth_unemployment_pct NUMERIC(5,2),
    youth_literacy_pct NUMERIC(5,2),
    youth_neet_pct NUMERIC(5,2),
    secondary_enrollment_pct NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_state_id, year)
);

-- Data Sources
CREATE TABLE IF NOT EXISTS data_sources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    api_url TEXT,
    source_type TEXT DEFAULT 'api' CHECK (source_type IN ('api', 'manual_upload', 'csv')),
    last_refresh TIMESTAMPTZ,
    record_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ETL Pipeline Runs
CREATE TABLE IF NOT EXISTS etl_runs (
    id SERIAL PRIMARY KEY,
    data_source_id INTEGER REFERENCES data_sources(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    insights_generated INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    error_message TEXT
);

-- Insights Engine (first-class objects)
CREATE TABLE IF NOT EXISTS insights (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('finding', 'alert', 'trend', 'recommendation', 'comparison', 'milestone')),
    severity TEXT NOT NULL CHECK (severity IN ('positive', 'neutral', 'warning', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB,
    goal_id INTEGER REFERENCES goals(id),
    indicator_id INTEGER REFERENCES indicators(id),
    member_state_id INTEGER REFERENCES member_states(id),
    region_id INTEGER REFERENCES regions(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    etl_run_id INTEGER REFERENCES etl_runs(id),
    is_active BOOLEAN DEFAULT TRUE,
    included_in_report BOOLEAN DEFAULT FALSE
);

-- Data Quality Scores
CREATE TABLE IF NOT EXISTS data_quality_scores (
    id SERIAL PRIMARY KEY,
    member_state_id INTEGER REFERENCES member_states(id),
    indicator_id INTEGER REFERENCES indicators(id),
    completeness_pct NUMERIC(5,2),
    timeliness_years INTEGER,
    consistency_score NUMERIC(5,2),
    overall_score NUMERIC(5,2),
    assessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Reports
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    report_type TEXT CHECK (report_type IN ('executive_summary', 'gender_brief', 'youth_brief', 'country_profile', 'goal_progress')),
    parameters JSONB,
    insights_included INTEGER[],
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    file_url TEXT
);

-- ============================================================
-- Indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_indicator_values_indicator ON indicator_values(indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicator_values_country ON indicator_values(member_state_id);
CREATE INDEX IF NOT EXISTS idx_indicator_values_year ON indicator_values(year);
CREATE INDEX IF NOT EXISTS idx_indicator_values_lookup ON indicator_values(indicator_id, member_state_id, year);
CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(type);
CREATE INDEX IF NOT EXISTS idx_insights_severity ON insights(severity);
CREATE INDEX IF NOT EXISTS idx_insights_active ON insights(is_active);
CREATE INDEX IF NOT EXISTS idx_insights_goal ON insights(goal_id);
CREATE INDEX IF NOT EXISTS idx_insights_generated ON insights(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_gender_metrics_country_year ON gender_metrics(member_state_id, year);
CREATE INDEX IF NOT EXISTS idx_youth_metrics_country_year ON youth_metrics(member_state_id, year);
CREATE INDEX IF NOT EXISTS idx_member_states_iso ON member_states(iso_code);
CREATE INDEX IF NOT EXISTS idx_member_states_region ON member_states(region_id);
CREATE INDEX IF NOT EXISTS idx_goals_aspiration ON goals(aspiration_id);
CREATE INDEX IF NOT EXISTS idx_indicators_goal ON indicators(goal_id);
CREATE INDEX IF NOT EXISTS idx_indicators_code ON indicators(code);
CREATE INDEX IF NOT EXISTS idx_etl_runs_status ON etl_runs(status);
CREATE INDEX IF NOT EXISTS idx_data_quality_country ON data_quality_scores(member_state_id);

-- ============================================================
-- Seed: Insert default data source
-- ============================================================

INSERT INTO data_sources (name, api_url, source_type, status)
VALUES ('World Bank API', 'https://api.worldbank.org/v2/', 'api', 'active')
ON CONFLICT DO NOTHING;
