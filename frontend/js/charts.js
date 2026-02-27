/**
 * AU Central Reporting System — Chart Builders (Plotly.js)
 * AU branded charts with gold/green color scheme
 */

const AU_COLORS = {
  gold: '#C8A415',
  green: '#009A44',
  dark: '#1B1B1B',
  blue: '#2196F3',
  red: '#D32F2F',
  purple: '#7C4DFF',
  orange: '#FF9800',
  teal: '#00BCD4',
};

const REGION_COLORS = {
  'North Africa': '#C8A415',
  'West Africa': '#009A44',
  'East Africa': '#2196F3',
  'Central Africa': '#7C4DFF',
  'Southern Africa': '#FF9800',
};

const CHART_LAYOUT = {
  font: { family: 'Inter, sans-serif', color: '#2D3436' },
  paper_bgcolor: 'white',
  plot_bgcolor: 'white',
  margin: { t: 40, r: 20, b: 40, l: 60 },
  hoverlabel: { bgcolor: '#1B1B1B', font: { color: 'white', size: 13 } },
};

const CHART_CONFIG = {
  responsive: true,
  displayModeBar: false,
};

const charts = {
  /**
   * KPI Gauge chart
   */
  gauge(elementId, value, target, title, color = AU_COLORS.green) {
    const progress = Math.min(100, (value / target) * 100);
    const data = [{
      type: 'indicator',
      mode: 'gauge+number',
      value: value,
      title: { text: title, font: { size: 14 } },
      gauge: {
        axis: { range: [0, target], tickwidth: 1 },
        bar: { color: color },
        bgcolor: '#E9ECEF',
        steps: [
          { range: [0, target * 0.3], color: '#FFEBEE' },
          { range: [target * 0.3, target * 0.7], color: '#FFF8E1' },
          { range: [target * 0.7, target], color: '#E8F5E9' },
        ],
        threshold: {
          line: { color: AU_COLORS.dark, width: 2 },
          value: target,
        },
      },
    }];

    Plotly.newPlot(elementId, data, {
      ...CHART_LAYOUT,
      height: 200,
      margin: { t: 30, r: 20, b: 0, l: 20 },
    }, CHART_CONFIG);
  },

  /**
   * Bar chart for rankings
   */
  barChart(elementId, labels, values, title, color = AU_COLORS.green) {
    const data = [{
      type: 'bar',
      x: values,
      y: labels,
      orientation: 'h',
      marker: { color: color, cornerradius: 4 },
      hovertemplate: '%{y}: %{x:.1f}<extra></extra>',
    }];

    Plotly.newPlot(elementId, data, {
      ...CHART_LAYOUT,
      title: { text: title, font: { size: 16 } },
      yaxis: { autorange: 'reversed' },
      xaxis: { title: '' },
      height: Math.max(300, labels.length * 28),
    }, CHART_CONFIG);
  },

  /**
   * Time series line chart
   */
  lineChart(elementId, series, title, yLabel = '') {
    const colors = [AU_COLORS.green, AU_COLORS.gold, AU_COLORS.blue, AU_COLORS.red, AU_COLORS.purple];
    const data = series.map((s, i) => ({
      type: 'scatter',
      mode: 'lines+markers',
      name: s.name,
      x: s.years,
      y: s.values,
      line: { color: colors[i % colors.length], width: 2 },
      marker: { size: 5 },
      hovertemplate: `${s.name}: %{y:.1f}<extra>%{x}</extra>`,
    }));

    Plotly.newPlot(elementId, data, {
      ...CHART_LAYOUT,
      title: { text: title, font: { size: 16 } },
      xaxis: { title: 'Year' },
      yaxis: { title: yLabel },
      showlegend: series.length > 1,
      legend: { orientation: 'h', y: -0.2 },
    }, CHART_CONFIG);
  },

  /**
   * Regional comparison bar chart
   */
  regionalBar(elementId, regionData, title) {
    const regions = Object.keys(regionData);
    const values = regions.map(r => regionData[r].average || regionData[r]);
    const colors = regions.map(r => REGION_COLORS[r] || AU_COLORS.blue);

    const data = [{
      type: 'bar',
      x: regions,
      y: values,
      marker: { color: colors, cornerradius: 4 },
      hovertemplate: '%{x}: %{y:.1f}<extra></extra>',
    }];

    Plotly.newPlot(elementId, data, {
      ...CHART_LAYOUT,
      title: { text: title, font: { size: 16 } },
      xaxis: { title: '' },
      yaxis: { title: '' },
      height: 350,
    }, CHART_CONFIG);
  },

  /**
   * Pie/donut chart
   */
  donut(elementId, labels, values, title) {
    const colors = [AU_COLORS.green, AU_COLORS.gold, AU_COLORS.blue, AU_COLORS.red, AU_COLORS.purple];
    const data = [{
      type: 'pie',
      labels: labels,
      values: values,
      hole: 0.5,
      marker: { colors: colors },
      textinfo: 'label+percent',
      hovertemplate: '%{label}: %{value}<extra></extra>',
    }];

    Plotly.newPlot(elementId, data, {
      ...CHART_LAYOUT,
      title: { text: title, font: { size: 16 } },
      height: 350,
      showlegend: true,
      legend: { orientation: 'h', y: -0.1 },
    }, CHART_CONFIG);
  },

  /**
   * Map chart (choropleth) — Africa
   */
  africaMap(elementId, countryData, title, colorscale = 'Greens') {
    const data = [{
      type: 'choropleth',
      locations: countryData.map(d => d.iso3),
      z: countryData.map(d => d.value),
      text: countryData.map(d => d.name),
      hovertemplate: '%{text}: %{z:.1f}<extra></extra>',
      colorscale: colorscale,
      colorbar: { title: '', thickness: 15 },
      marker: { line: { color: 'white', width: 0.5 } },
    }];

    Plotly.newPlot(elementId, data, {
      ...CHART_LAYOUT,
      title: { text: title, font: { size: 16 } },
      geo: {
        scope: 'africa',
        showframe: false,
        showcoastlines: true,
        coastlinecolor: '#ccc',
        projection: { type: 'natural earth' },
        bgcolor: 'white',
      },
      height: 500,
    }, CHART_CONFIG);
  },

  /**
   * Insights summary donut
   */
  insightsSummary(elementId, byType) {
    const typeColors = {
      finding: AU_COLORS.blue,
      alert: AU_COLORS.red,
      trend: AU_COLORS.green,
      recommendation: AU_COLORS.gold,
      comparison: AU_COLORS.purple,
      milestone: AU_COLORS.orange,
    };
    const labels = Object.keys(byType);
    const values = Object.values(byType);
    const colors = labels.map(l => typeColors[l] || '#ccc');

    const data = [{
      type: 'pie',
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
      values: values,
      hole: 0.55,
      marker: { colors: colors },
      textinfo: 'label+value',
    }];

    Plotly.newPlot(elementId, data, {
      ...CHART_LAYOUT,
      height: 300,
      margin: { t: 10, r: 10, b: 10, l: 10 },
      showlegend: false,
    }, CHART_CONFIG);
  },
};
