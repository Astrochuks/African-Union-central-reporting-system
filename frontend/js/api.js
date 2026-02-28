/**
 * AU Central Reporting System — API Client
 * Communicates with the FastAPI backend
 */

// Auto-detect API URL based on how the frontend is served
const API_BASE = (() => {
  const host = window.location.hostname;
  const protocol = window.location.protocol;

  // Opened as a local file (file://) — try local server
  if (protocol === 'file:') {
    return 'http://localhost:8001/api/v1';
  }
  // Running on localhost (dev) — use same port
  if (host === 'localhost' || host === '127.0.0.1') {
    return `${window.location.origin}/api/v1`;
  }
  // Production — same origin
  return '/api/v1';
})();

const api = {
  async get(endpoint) {
    try {
      const resp = await fetch(`${API_BASE}${endpoint}`);
      if (!resp.ok) throw new Error(`API error: ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error(`API GET ${endpoint}:`, err);
      return null;
    }
  },

  async post(endpoint, data = {}) {
    try {
      const resp = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error(`API error: ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error(`API POST ${endpoint}:`, err);
      return null;
    }
  },

  // Dashboard
  async getDashboard() { return this.get('/dashboard/summary'); },

  // Goals
  async getGoals() { return this.get('/goals'); },
  async getGoal(id) { return this.get(`/goals/${id}`); },
  async getGoalProgress(id) { return this.get(`/goals/${id}/progress`); },
  async getGoalByRegion(id) { return this.get(`/goals/${id}/by-region`); },

  // Indicators
  async getIndicators(goalId) { return this.get(`/indicators${goalId ? '?goal_id=' + goalId : ''}`); },
  async getIndicatorValues(id, country) { return this.get(`/indicators/${id}/values${country ? '?country=' + country : ''}`); },
  async getIndicatorRanking(id) { return this.get(`/indicators/${id}/ranking`); },
  async getIndicatorTrend(id) { return this.get(`/indicators/${id}/trend`); },

  // Countries
  async getCountries(region) { return this.get(`/countries${region ? '?region=' + encodeURIComponent(region) : ''}`); },
  async getCountryProfile(iso) { return this.get(`/countries/${iso}/profile`); },
  async getCountryScorecard(iso) { return this.get(`/countries/${iso}/scorecard`); },
  async compareCountries(codes, indicator) {
    let url = `/countries/compare?countries=${codes}`;
    if (indicator) url += `&indicator_code=${indicator}`;
    return this.get(url);
  },

  // Gender
  async getGenderOverview() { return this.get('/gender/overview'); },
  async getGenderByCountry() { return this.get('/gender/by-country'); },
  async getGenderTrends() { return this.get('/gender/trends'); },
  async getGenderParity() { return this.get('/gender/parity-index'); },

  // Youth
  async getYouthOverview() { return this.get('/youth/overview'); },
  async getYouthByCountry() { return this.get('/youth/by-country'); },
  async getYouthEmployment() { return this.get('/youth/employment'); },
  async getYouthTrends() { return this.get('/youth/trends'); },

  // Insights
  async getInsights(type, severity) {
    let params = [];
    if (type) params.push(`type=${type}`);
    if (severity) params.push(`severity=${severity}`);
    return this.get(`/insights${params.length ? '?' + params.join('&') : ''}`);
  },
  async getLatestInsights(limit = 10) { return this.get(`/insights/latest?limit=${limit}`); },
  async getCriticalInsights() { return this.get('/insights/critical'); },
  async getInsightsSummary() { return this.get('/insights/summary'); },
  async generateInsights() { return this.post('/insights/generate'); },

  // Pipeline
  async triggerPipeline() { return this.post('/pipeline/trigger'); },
  async getPipelineStatus() { return this.get('/pipeline/status'); },
  async getDataSources() { return this.get('/pipeline/sources'); },
  async seedDatabase() { return this.post('/pipeline/seed'); },

  // Reports
  async generateReport(type, params) { return this.post('/reports/generate', { report_type: type, parameters: params }); },
  async getReports() { return this.get('/reports'); },

  // Data Quality
  async getDataQuality() { return this.get('/data-quality/overview'); },
  async getDataQualityByCountry() { return this.get('/data-quality/by-country'); },

  // Health
  async getHealth() { return this.get('/health'); },
};
