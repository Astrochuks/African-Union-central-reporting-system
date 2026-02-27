/**
 * AU Central Reporting System — Application Controller
 * Manages navigation, page loading, and state
 */

let currentPage = 'dashboard';

// ── Navigation ────────────────────────────────────────────────

function navigateTo(page) {
  currentPage = page;

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeNav) activeNav.classList.add('active');

  // Show loading state
  const content = document.getElementById('page-content');
  content.innerHTML = '<div class="loading"><div class="spinner"></div>Loading...</div>';

  // Load page
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'agenda2063': loadAgenda2063(); break;
    case 'gender-youth': loadGenderYouth(); break;
    case 'insights': loadInsights(); break;
    case 'countries': loadCountries(); break;
    case 'pipeline': loadPipeline(); break;
    case 'reports': loadReports(); break;
    default: loadDashboard();
  }

  // Update top bar title
  const titles = {
    dashboard: ['Dashboard', 'Continental overview and key performance indicators'],
    agenda2063: ['Agenda 2063 Goals', 'Progress tracking across all 20 goals and 7 aspirations'],
    'gender-youth': ['Gender & Youth Analytics', 'WGYD indicators and M&E tracking'],
    insights: ['Insights Engine', 'Auto-generated findings, alerts, and recommendations'],
    countries: ['Member States', '55 AU member state profiles and scorecards'],
    pipeline: ['Data Pipeline', 'ETL operations, data sources, and quality monitoring'],
    reports: ['Reports', 'Executive report generation and export'],
  };
  const [title, subtitle] = titles[page] || ['Dashboard', ''];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = subtitle;
}

// ── Dashboard ─────────────────────────────────────────────────

async function loadDashboard() {
  const data = await api.getDashboard();
  const content = document.getElementById('page-content');

  if (!data) {
    content.innerHTML = '<div class="card"><div class="card-body">Unable to load dashboard. Is the API server running?</div></div>';
    return;
  }

  // KPI cards
  let kpiHtml = '<div class="kpi-grid">';
  if (data.kpis) {
    data.kpis.forEach(kpi => {
      const topClass = kpi.label.includes('Unemployment') ? 'red-top' : kpi.label.includes('Women') ? 'gold-top' : 'green-top';
      kpiHtml += `
        <div class="kpi-card ${topClass}">
          <div class="kpi-label">${kpi.label}</div>
          <div class="kpi-value">${kpi.value}</div>
          <div class="kpi-target">Target: <span>${kpi.target}</span></div>
        </div>`;
    });
  }
  // Add system stats
  kpiHtml += `
    <div class="kpi-card">
      <div class="kpi-label">Member States</div>
      <div class="kpi-value">${data.total_member_states}</div>
      <div class="kpi-target">All AU members tracked</div>
    </div>
    <div class="kpi-card gold-top">
      <div class="kpi-label">Data Points</div>
      <div class="kpi-value">${(data.total_data_points || 0).toLocaleString()}</div>
      <div class="kpi-target">${data.total_indicators} indicators</div>
    </div>`;
  kpiHtml += '</div>';

  // Insights section
  let insightsHtml = '<div class="card"><div class="card-header"><h3>Latest Insights</h3><button class="btn btn-sm btn-outline" onclick="navigateTo(\'insights\')">View All</button></div><div class="card-body">';
  if (data.recent_insights && data.recent_insights.length > 0) {
    data.recent_insights.slice(0, 6).forEach(insight => {
      insightsHtml += renderInsight(insight);
    });
  } else {
    insightsHtml += '<p style="color:var(--au-text-muted)">No insights generated yet. Run the ETL pipeline first.</p>';
  }
  insightsHtml += '</div></div>';

  content.innerHTML = kpiHtml + '<div class="grid-2">' +
    '<div>' + insightsHtml + '</div>' +
    '<div><div class="card"><div class="card-header"><h3>Pipeline Status</h3></div><div class="card-body">' +
    (data.latest_etl_run
      ? `<p><span class="status-dot ${data.latest_etl_run.status === 'completed' ? 'green' : 'yellow'}"></span>${data.latest_etl_run.status}</p><p style="font-size:13px;color:var(--au-text-muted)">Records: ${data.latest_etl_run.records_processed?.toLocaleString() || 0} | Insights: ${data.latest_etl_run.insights_generated || 0}</p>`
      : '<p style="color:var(--au-text-muted)">No ETL runs yet</p>') +
    '<div style="margin-top:16px"><button class="btn btn-primary" onclick="triggerETL()">Run ETL Pipeline</button></div>' +
    '</div></div></div></div>';
}

// ── Agenda 2063 ───────────────────────────────────────────────

async function loadAgenda2063() {
  const data = await api.getGoals();
  const content = document.getElementById('page-content');

  if (!data || !data.goals) {
    content.innerHTML = '<div class="card"><div class="card-body">Unable to load goals.</div></div>';
    return;
  }

  let html = '<div class="card"><div class="card-header"><h3>Agenda 2063 Goals (20 Goals, 7 Aspirations)</h3></div><div class="card-body">';
  html += '<table class="data-table"><thead><tr><th>#</th><th>Goal</th><th>Aspiration</th><th>Progress</th><th>Target 2063</th><th></th></tr></thead><tbody>';

  data.goals.forEach(g => {
    const progress = g.current_progress || 0;
    const fillClass = progress >= 60 ? 'green' : progress >= 30 ? 'gold' : 'red';
    html += `<tr>
      <td><strong>${g.number}</strong></td>
      <td>${g.name}</td>
      <td style="font-size:12px;color:var(--au-text-muted)">${g.aspirations?.name?.substring(0, 50) || ''}...</td>
      <td style="width:150px">
        <div style="display:flex;align-items:center;gap:8px">
          <div class="progress-bar" style="flex:1"><div class="fill ${fillClass}" style="width:${progress}%"></div></div>
          <span style="font-size:12px;font-weight:600">${progress}%</span>
        </div>
      </td>
      <td style="font-size:12px;max-width:200px">${g.target_2063 || '-'}</td>
      <td><button class="btn btn-sm btn-outline" onclick="viewGoalDetail(${g.id})">Detail</button></td>
    </tr>`;
  });

  html += '</tbody></table></div></div>';
  content.innerHTML = html;
}

async function viewGoalDetail(goalId) {
  const [goalData, progressData, regionData, insightData] = await Promise.all([
    api.getGoal(goalId),
    api.getGoalProgress(goalId),
    api.getGoalByRegion(goalId),
    api.getInsights(),
  ]);

  const content = document.getElementById('page-content');
  const goal = goalData?.goal;
  if (!goal) return;

  let html = `
    <button class="btn btn-outline" onclick="loadAgenda2063()" style="margin-bottom:16px">Back to Goals</button>
    <div class="card"><div class="card-header"><h3>Goal ${goal.number}: ${goal.name}</h3></div><div class="card-body">
      <p>${goal.description || ''}</p>
      <p style="margin-top:8px"><strong>Target 2063:</strong> ${goal.target_2063 || '-'}</p>
    </div></div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><h3>Indicators</h3></div><div class="card-body">`;

  if (goalData.indicators) {
    goalData.indicators.forEach(ind => {
      html += `<div style="padding:8px 0;border-bottom:1px solid var(--au-gray-light)">
        <strong>${ind.name}</strong><br>
        <span style="font-size:12px;color:var(--au-text-muted)">Code: ${ind.code} | Source: ${ind.source} | Unit: ${ind.unit || '-'}</span>
      </div>`;
    });
  }

  html += '</div></div><div class="card"><div class="card-header"><h3>Regional Breakdown</h3></div><div class="card-body"><div id="region-chart"></div></div></div></div>';
  content.innerHTML = html;

  // Render region chart
  if (regionData?.regions && Object.keys(regionData.regions).length > 0) {
    charts.regionalBar('region-chart', regionData.regions, 'Average by Region');
  }
}

// ── Gender & Youth ────────────────────────────────────────────

async function loadGenderYouth() {
  const [gender, youth, genderTrends, youthTrends] = await Promise.all([
    api.getGenderOverview(),
    api.getYouthOverview(),
    api.getGenderTrends(),
    api.getYouthTrends(),
  ]);

  const content = document.getElementById('page-content');

  // KPI cards
  let html = '<div class="kpi-grid">';
  if (gender) {
    html += `
      <div class="kpi-card gold-top">
        <div class="kpi-label">Women in Parliament</div>
        <div class="kpi-value">${gender.continental_avg_women_parliament?.toFixed(1) || '-'}%</div>
        <div class="kpi-target">Target: <span>50%</span> | ${gender.countries_above_30pct_parliament} countries above 30%</div>
      </div>
      <div class="kpi-card green-top">
        <div class="kpi-label">Female Labor Force</div>
        <div class="kpi-value">${gender.continental_avg_labor_force?.toFixed(1) || '-'}%</div>
        <div class="kpi-target">Target: <span>50%</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Gender Parity (Education)</div>
        <div class="kpi-value">${gender.continental_avg_parity_index?.toFixed(3) || '-'}</div>
        <div class="kpi-target">Target: <span>1.000</span> (full parity)</div>
      </div>`;
  }
  if (youth) {
    html += `
      <div class="kpi-card red-top">
        <div class="kpi-label">Youth Unemployment</div>
        <div class="kpi-value">${youth.continental_avg_unemployment?.toFixed(1) || '-'}%</div>
        <div class="kpi-target">Target: <span>&lt;6%</span> | ${youth.countries_high_unemployment} countries critical</div>
      </div>
      <div class="kpi-card green-top">
        <div class="kpi-label">Secondary Enrollment</div>
        <div class="kpi-value">${youth.continental_avg_enrollment?.toFixed(1) || '-'}%</div>
        <div class="kpi-target">Target: <span>100%</span></div>
      </div>`;
  }
  html += '</div>';

  // Charts
  html += '<div class="grid-2">';
  html += '<div class="card"><div class="card-header"><h3>Gender Trends</h3></div><div class="card-body"><div id="gender-trends-chart" class="chart-container"></div></div></div>';
  html += '<div class="card"><div class="card-header"><h3>Youth Trends</h3></div><div class="card-body"><div id="youth-trends-chart" class="chart-container"></div></div></div>';
  html += '</div>';

  content.innerHTML = html;

  // Render charts
  if (genderTrends?.trends?.length) {
    charts.lineChart('gender-trends-chart', [
      { name: 'Women in Parliament (%)', years: genderTrends.trends.map(t => t.year), values: genderTrends.trends.map(t => t.avg_women_parliament) },
      { name: 'Female Labor Force (%)', years: genderTrends.trends.map(t => t.year), values: genderTrends.trends.map(t => t.avg_labor_force) },
    ], 'Continental Gender Trends', '%');
  }
  if (youthTrends?.trends?.length) {
    charts.lineChart('youth-trends-chart', [
      { name: 'Youth Unemployment (%)', years: youthTrends.trends.map(t => t.year), values: youthTrends.trends.map(t => t.avg_unemployment) },
      { name: 'Secondary Enrollment (%)', years: youthTrends.trends.map(t => t.year), values: youthTrends.trends.map(t => t.avg_enrollment) },
    ], 'Continental Youth Trends', '%');
  }
}

// ── Insights Engine ───────────────────────────────────────────

async function loadInsights() {
  const [insights, summary] = await Promise.all([
    api.getInsights(),
    api.getInsightsSummary(),
  ]);

  const content = document.getElementById('page-content');

  // Summary cards
  let html = '<div class="kpi-grid">';
  if (summary) {
    html += `
      <div class="kpi-card green-top"><div class="kpi-label">Total Active Insights</div><div class="kpi-value">${summary.total_active}</div></div>
      <div class="kpi-card red-top"><div class="kpi-label">Critical Alerts</div><div class="kpi-value">${summary.by_severity?.critical || 0}</div></div>
      <div class="kpi-card gold-top"><div class="kpi-label">Warnings</div><div class="kpi-value">${summary.by_severity?.warning || 0}</div></div>
      <div class="kpi-card"><div class="kpi-label">Positive Trends</div><div class="kpi-value">${summary.by_severity?.positive || 0}</div></div>`;
  }
  html += '</div>';

  html += '<div class="grid-2"><div>';

  // Insight breakdown chart
  html += '<div class="card"><div class="card-header"><h3>Insights by Type</h3></div><div class="card-body"><div id="insights-chart"></div></div></div>';

  html += '</div><div>';

  // Generate button
  html += '<div class="card"><div class="card-header"><h3>Actions</h3></div><div class="card-body">';
  html += '<button class="btn btn-primary" onclick="regenerateInsights()" style="width:100%">Regenerate All Insights</button>';
  html += '<p style="margin-top:8px;font-size:12px;color:var(--au-text-muted)">Analyzes all current data and generates new findings, alerts, trends, and recommendations.</p>';
  html += '</div></div>';

  html += '</div></div>';

  // All insights
  html += '<div class="card"><div class="card-header"><h3>All Active Insights</h3></div><div class="card-body">';
  if (insights?.insights?.length) {
    // Filter buttons
    html += '<div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">';
    html += '<button class="btn btn-sm btn-outline active" onclick="filterInsights(null)">All</button>';
    ['finding', 'alert', 'trend', 'recommendation', 'comparison', 'milestone'].forEach(t => {
      html += `<button class="btn btn-sm btn-outline" onclick="filterInsights('${t}')">${t.charAt(0).toUpperCase() + t.slice(1)}s</button>`;
    });
    html += '</div>';

    html += '<div id="insights-list">';
    insights.insights.forEach(i => { html += renderInsight(i); });
    html += '</div>';
  } else {
    html += '<p style="color:var(--au-text-muted)">No insights generated yet. Run the ETL pipeline and then generate insights.</p>';
  }
  html += '</div></div>';

  content.innerHTML = html;

  // Render chart
  if (summary?.by_type) {
    charts.insightsSummary('insights-chart', summary.by_type);
  }
}

async function filterInsights(type) {
  const data = await api.getInsights(type);
  if (data?.insights) {
    const list = document.getElementById('insights-list');
    if (list) {
      list.innerHTML = data.insights.map(i => renderInsight(i)).join('');
    }
  }
}

async function regenerateInsights() {
  const btn = event.target;
  btn.textContent = 'Generating...';
  btn.disabled = true;
  const result = await api.generateInsights();
  if (result) {
    alert(`Insights generated: ${result.total_insights} total`);
    loadInsights();
  }
  btn.textContent = 'Regenerate All Insights';
  btn.disabled = false;
}

// ── Countries ─────────────────────────────────────────────────

async function loadCountries() {
  const data = await api.getCountries();
  const content = document.getElementById('page-content');

  if (!data?.countries) {
    content.innerHTML = '<div class="card"><div class="card-body">Unable to load countries.</div></div>';
    return;
  }

  // Region filter
  let html = '<div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">';
  html += '<button class="btn btn-sm btn-primary" onclick="loadCountries()">All Regions</button>';
  ['North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa'].forEach(r => {
    html += `<button class="btn btn-sm btn-outline" onclick="loadCountriesByRegion('${r}')">${r}</button>`;
  });
  html += '</div>';

  html += '<div class="card"><div class="card-header"><h3>AU Member States (${data.total})</h3></div><div class="card-body">';
  html += '<table class="data-table"><thead><tr><th>Country</th><th>ISO</th><th>Region</th><th>AU Member Since</th><th></th></tr></thead><tbody>';

  data.countries.forEach(c => {
    html += `<tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.iso_code}</td>
      <td>${c.regions?.name || '-'}</td>
      <td>${c.au_membership_year || '-'}</td>
      <td><button class="btn btn-sm btn-outline" onclick="viewCountryProfile('${c.iso_code}')">Profile</button></td>
    </tr>`;
  });

  html += '</tbody></table></div></div>';
  content.innerHTML = html;
}

async function loadCountriesByRegion(region) {
  const data = await api.getCountries(region);
  const content = document.getElementById('page-content');

  let html = '<div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap">';
  html += '<button class="btn btn-sm btn-outline" onclick="loadCountries()">All Regions</button>';
  ['North Africa', 'West Africa', 'Central Africa', 'East Africa', 'Southern Africa'].forEach(r => {
    const cls = r === region ? 'btn-primary' : 'btn-outline';
    html += `<button class="btn btn-sm ${cls}" onclick="loadCountriesByRegion('${r}')">${r}</button>`;
  });
  html += '</div>';

  html += `<div class="card"><div class="card-header"><h3>${region} (${data?.total || 0} countries)</h3></div><div class="card-body">`;
  html += '<table class="data-table"><thead><tr><th>Country</th><th>ISO</th><th>AU Member Since</th><th></th></tr></thead><tbody>';

  (data?.countries || []).forEach(c => {
    html += `<tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.iso_code}</td>
      <td>${c.au_membership_year || '-'}</td>
      <td><button class="btn btn-sm btn-outline" onclick="viewCountryProfile('${c.iso_code}')">Profile</button></td>
    </tr>`;
  });

  html += '</tbody></table></div></div>';
  content.innerHTML = html;
}

async function viewCountryProfile(iso) {
  const data = await api.getCountryProfile(iso);
  const content = document.getElementById('page-content');

  if (!data?.country) {
    content.innerHTML = '<div class="card"><div class="card-body">Country not found.</div></div>';
    return;
  }

  const c = data.country;
  let html = `
    <button class="btn btn-outline" onclick="loadCountries()" style="margin-bottom:16px">Back to Countries</button>
    <div class="card"><div class="card-header"><h3>${c.name}</h3></div><div class="card-body">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
        <div><strong>ISO Code:</strong> ${c.iso_code}</div>
        <div><strong>Region:</strong> ${c.regions?.name || '-'}</div>
        <div><strong>AU Member Since:</strong> ${c.au_membership_year || '-'}</div>
      </div>
    </div></div>`;

  // Key indicators table
  if (data.key_indicators?.length) {
    html += '<div class="card"><div class="card-header"><h3>Key Indicators</h3></div><div class="card-body">';
    html += '<table class="data-table"><thead><tr><th>Indicator</th><th>Value</th><th>Year</th><th>Unit</th><th>Goal</th></tr></thead><tbody>';
    data.key_indicators.forEach(ind => {
      html += `<tr>
        <td>${ind.indicator}</td>
        <td><strong>${ind.value != null ? Number(ind.value).toLocaleString(undefined, {maximumFractionDigits: 2}) : '-'}</strong></td>
        <td>${ind.year}</td>
        <td>${ind.unit || '-'}</td>
        <td style="font-size:12px">${ind.goal || '-'}</td>
      </tr>`;
    });
    html += '</tbody></table></div></div>';
  }

  content.innerHTML = html;
}

// ── Pipeline ──────────────────────────────────────────────────

async function loadPipeline() {
  const [status, sources] = await Promise.all([
    api.getPipelineStatus(),
    api.getDataSources(),
  ]);

  const content = document.getElementById('page-content');

  let html = '<div class="kpi-grid">';
  html += `<div class="kpi-card green-top"><div class="kpi-label">Total ETL Runs</div><div class="kpi-value">${status?.total_runs || 0}</div></div>`;
  html += `<div class="kpi-card gold-top"><div class="kpi-label">Total Data Records</div><div class="kpi-value">${(status?.total_data_records || 0).toLocaleString()}</div></div>`;
  html += `<div class="kpi-card"><div class="kpi-label">Data Sources</div><div class="kpi-value">${sources?.sources?.length || 0}</div></div>`;
  html += '</div>';

  // Actions
  html += '<div class="grid-2"><div class="card"><div class="card-header"><h3>Pipeline Actions</h3></div><div class="card-body">';
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
  html += '<button class="btn btn-primary" onclick="triggerETL()">Run Full ETL</button>';
  html += '<button class="btn btn-gold" onclick="seedDB()">Seed Database</button>';
  html += '</div></div></div>';

  // Sources
  html += '<div class="card"><div class="card-header"><h3>Data Sources</h3></div><div class="card-body">';
  if (sources?.sources?.length) {
    sources.sources.forEach(s => {
      html += `<div style="padding:8px 0;border-bottom:1px solid var(--au-gray-light)">
        <strong>${s.name}</strong> <span class="status-dot green"></span>${s.status}
        <div style="font-size:12px;color:var(--au-text-muted)">${s.api_url || ''} | Records: ${s.record_count || 0}</div>
      </div>`;
    });
  }
  html += '</div></div></div>';

  // Run history
  html += '<div class="card"><div class="card-header"><h3>ETL Run History</h3></div><div class="card-body">';
  if (status?.runs?.length) {
    html += '<table class="data-table"><thead><tr><th>Run ID</th><th>Started</th><th>Status</th><th>Records</th><th>Failed</th><th>Insights</th></tr></thead><tbody>';
    status.runs.forEach(r => {
      const statusColor = r.status === 'completed' ? 'green' : r.status === 'running' ? 'yellow' : 'red';
      html += `<tr>
        <td>#${r.id}</td>
        <td>${new Date(r.started_at).toLocaleString()}</td>
        <td><span class="status-dot ${statusColor}"></span>${r.status}</td>
        <td>${(r.records_processed || 0).toLocaleString()}</td>
        <td>${r.records_failed || 0}</td>
        <td>${r.insights_generated || 0}</td>
      </tr>`;
    });
    html += '</tbody></table>';
  } else {
    html += '<p style="color:var(--au-text-muted)">No ETL runs yet.</p>';
  }
  html += '</div></div>';

  content.innerHTML = html;
}

async function triggerETL() {
  const btn = event.target;
  btn.textContent = 'Starting...';
  btn.disabled = true;
  const result = await api.triggerPipeline();
  if (result) {
    alert('ETL pipeline started! This may take a few minutes. Check Pipeline Status for progress.');
  }
  btn.textContent = 'Run Full ETL';
  btn.disabled = false;
}

async function seedDB() {
  const btn = event.target;
  btn.textContent = 'Seeding...';
  btn.disabled = true;
  const result = await api.seedDatabase();
  if (result) {
    alert(`Database seeded: ${JSON.stringify(result)}`);
  }
  btn.textContent = 'Seed Database';
  btn.disabled = false;
}

// ── Reports ───────────────────────────────────────────────────

async function loadReports() {
  const data = await api.getReports();
  const content = document.getElementById('page-content');

  let html = '<div class="grid-3">';
  const reportTypes = [
    { type: 'executive_summary', name: 'Executive Summary', desc: 'Continental overview with key findings and recommendations', icon: '📊' },
    { type: 'gender_brief', name: 'Gender Brief', desc: 'Gender equality metrics and analysis for WGYD', icon: '♀️' },
    { type: 'country_profile', name: 'Country Profile', desc: 'Per-country Agenda 2063 scorecard', icon: '🗺️' },
  ];

  reportTypes.forEach(rt => {
    html += `<div class="card"><div class="card-body" style="text-align:center;padding:30px">
      <div style="font-size:36px;margin-bottom:12px">${rt.icon}</div>
      <h3 style="margin-bottom:8px">${rt.name}</h3>
      <p style="font-size:13px;color:var(--au-text-muted);margin-bottom:16px">${rt.desc}</p>
      <button class="btn btn-primary" onclick="generateReportUI('${rt.type}')">Generate</button>
    </div></div>`;
  });
  html += '</div>';

  // Export
  html += '<div class="card"><div class="card-header"><h3>Export</h3></div><div class="card-body">';
  html += '<a class="btn btn-gold" href="' + (API_BASE || '/api/v1') + '/reports/export/excel" target="_blank">Download Excel Report</a>';
  html += '</div></div>';

  // Previous reports
  html += '<div class="card"><div class="card-header"><h3>Generated Reports</h3></div><div class="card-body">';
  if (data?.reports?.length) {
    html += '<table class="data-table"><thead><tr><th>Title</th><th>Type</th><th>Generated</th></tr></thead><tbody>';
    data.reports.forEach(r => {
      html += `<tr><td>${r.title}</td><td>${r.report_type}</td><td>${new Date(r.generated_at).toLocaleString()}</td></tr>`;
    });
    html += '</tbody></table>';
  } else {
    html += '<p style="color:var(--au-text-muted)">No reports generated yet.</p>';
  }
  html += '</div></div>';

  content.innerHTML = html;
}

async function generateReportUI(type) {
  const btn = event.target;
  btn.textContent = 'Generating...';
  btn.disabled = true;
  const result = await api.generateReport(type);
  if (result) {
    alert('Report generated successfully!');
    loadReports();
  }
  btn.textContent = 'Generate';
  btn.disabled = false;
}

// ── Helpers ───────────────────────────────────────────────────

function renderInsight(insight) {
  return `
    <div class="insight-item ${insight.severity}">
      <div class="insight-meta">
        <span class="insight-badge badge-${insight.type}">${insight.type}</span>
        <span class="insight-badge badge-${insight.severity}">${insight.severity}</span>
      </div>
      <div class="insight-title">${insight.title}</div>
      <div class="insight-desc">${insight.description}</div>
    </div>`;
}

// ── Initialize ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Set up sidebar navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  // Load dashboard by default
  navigateTo('dashboard');
});
