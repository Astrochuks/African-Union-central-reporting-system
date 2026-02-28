// Dashboard
export interface DashboardKPI {
  label: string;
  value: string;
  target: string;
  unit: string;
}
export interface DashboardSummary {
  total_member_states: number;
  total_goals: number;
  total_indicators: number;
  total_data_points: number;
  avg_goal_progress: number | null;
  latest_etl_run: ETLRun | null;
  recent_insights: Insight[];
  kpis: DashboardKPI[];
  data_quality_score: number | null;
}

// Goals
export interface Goal {
  id: number;
  aspiration_id: number;
  number: number;
  name: string;
  description?: string;
  target_2063?: string;
  current_progress?: number;
  aspiration_name?: string;
  indicator_count?: number;
  aspirations?: { number: number; name: string };
}
export interface GoalDetail {
  goal: Goal;
  indicators: Indicator[];
}
export interface GoalProgress {
  goal: Goal;
  progress: {
    indicator: string;
    code: string;
    target: number | null;
    time_series: { year: number; avg_value: number; countries: number }[];
  }[];
}
export interface GoalRegionalBreakdown {
  goal_id: number;
  regions: Record<string, { average: number; countries: number }>;
}

// Indicators
export interface Indicator {
  id: number;
  goal_id: number;
  name: string;
  code?: string;
  unit?: string;
  source?: string;
  baseline_value?: number;
  baseline_year?: number;
  target_value?: number;
  target_year?: number;
  latest_value?: number;
  latest_year?: number;
  data_points?: number;
  goals?: { number: number; name: string };
}
export interface IndicatorTimeSeries {
  indicator_id: number;
  indicator_name: string;
  country?: string;
  unit?: string;
  values: { year: number; value: number; country?: string }[];
}
export interface IndicatorRanking {
  rank: number;
  country_name: string;
  iso_code: string;
  value: number;
  year: number;
  region?: string;
}
export interface IndicatorTrend {
  indicator: Indicator;
  trend: { year: number; avg: number; min: number; max: number; countries: number }[];
  direction: "improving" | "declining" | "stable" | "insufficient_data";
}

// Countries
export interface MemberState {
  id: number;
  name: string;
  iso_code: string;
  iso3_code?: string;
  region_id?: number;
  population?: number;
  gdp_per_capita?: number;
  au_membership_year?: number;
  region_name?: string;
  regions?: { name: string };
}
export interface CountryProfile {
  country: MemberState;
  key_indicators: {
    indicator: string;
    code: string;
    value: number;
    year: number;
    unit?: string;
    goal?: string;
  }[];
  gender_metrics: GenderMetrics | null;
  youth_metrics: YouthMetrics | null;
  agenda_2063_progress?: Record<string, unknown>[];
  data_quality_score?: number;
}
export interface CountryScorecard {
  country: MemberState;
  scorecard: {
    goal_number: number;
    goal_name: string;
    aspiration: string;
    indicators: {
      indicator: string;
      value: number;
      year: number;
      unit?: string;
      target?: number;
    }[];
    data_completeness: string;
  }[];
  insights: { type: string; severity: string; title: string; description: string }[];
}

// Gender
export interface GenderMetrics {
  id: number;
  member_state_id: number;
  year: number;
  women_parliament_pct?: number;
  gender_parity_education?: number;
  women_labor_force_pct?: number;
  maternal_mortality_ratio?: number;
  adolescent_fertility_rate?: number;
  country_name?: string;
}
export interface GenderOverview {
  continental_avg_women_parliament: number | null;
  continental_avg_labor_force: number | null;
  continental_avg_parity_index: number | null;
  countries_above_30pct_parliament: number;
  total_countries_with_data: number;
  regional_breakdown?: {
    region: string;
    women_parliament_pct: number;
    labor_force_pct: number;
    parity_index: number;
  }[];
  trends?: Record<string, unknown>[];
}
export interface GenderTrend {
  year: number;
  avg_women_parliament: number | null;
  avg_labor_force: number | null;
  avg_parity_index: number | null;
  countries_reporting: number;
}

// Youth
export interface YouthMetrics {
  id: number;
  member_state_id: number;
  year: number;
  youth_unemployment_pct?: number;
  youth_literacy_pct?: number;
  youth_neet_pct?: number;
  secondary_enrollment_pct?: number;
  country_name?: string;
}
export interface YouthOverview {
  continental_avg_unemployment: number | null;
  continental_avg_literacy: number | null;
  continental_avg_enrollment: number | null;
  countries_high_unemployment: number;
  total_countries_with_data: number;
  regional_breakdown?: {
    region: string;
    unemployment_pct: number;
    enrollment_pct: number;
  }[];
  trends?: Record<string, unknown>[];
}
export interface YouthEmploymentRanking {
  ranking: {
    rank: number;
    country: string;
    iso_code: string;
    region?: string;
    unemployment_pct: number;
    year: number;
  }[];
  continental_avg: number | null;
  target: number;
}
export interface YouthTrend {
  year: number;
  avg_unemployment: number | null;
  avg_enrollment: number | null;
  countries_reporting: number;
}

// Insights
export interface Insight {
  id: number;
  type: string;
  severity: string;
  title: string;
  description: string;
  evidence?: Record<string, unknown>;
  goal_id?: number;
  indicator_id?: number;
  member_state_id?: number;
  generated_at: string;
  etl_run_id?: number;
  is_active: boolean;
  included_in_report: boolean;
}
export interface InsightsSummary {
  total_active: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  latest_generated: string | null;
}

// ETL Pipeline
export interface ETLRun {
  id: number;
  data_source_id?: number;
  started_at: string;
  completed_at?: string;
  records_processed: number;
  records_failed: number;
  insights_generated: number;
  status: string;
}
export interface PipelineStatus {
  runs: ETLRun[];
  total_runs: number;
  total_data_records: number;
}
export interface DataSource {
  id: number;
  name: string;
  api_url?: string;
  source_type?: string;
  last_refresh?: string;
  record_count?: number;
  status: string;
}

// Reports
export interface ReportGenerateRequest {
  report_type: string;
  title?: string;
  parameters?: Record<string, unknown>;
}
export interface Report {
  id: number;
  title: string;
  report_type: string;
  parameters?: Record<string, unknown>;
  insights_included?: number[];
  generated_at: string;
  file_url?: string;
}

// Data Quality
export interface DataQualityOverview {
  continental_avg_score: number;
  countries_with_good_data: number;
  countries_with_poor_data: number;
  most_complete_indicators: { indicator: string; score: number }[];
  least_complete_indicators: { indicator: string; score: number }[];
  gaps: { member_state_id: number; indicator_id: number }[];
}
export interface DataQualityCountryScore {
  country_name: string;
  iso_code: string;
  overall_score: number;
  completeness: number;
  indicators_covered: number;
}

// Chat
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}
export interface ChatResponse {
  response: string;
  data?: Record<string, unknown>;
  suggested_follow_ups?: string[];
}

// Health
export interface HealthStatus {
  status: string;
  timestamp: string;
  environment: string;
  version: string;
  database: string;
}
