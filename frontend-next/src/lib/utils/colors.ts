export const AU_COLORS = {
  gold: "#c3a367",
  goldLight: "#d4bc8a",
  goldDark: "#9a7d3f",
  green: "#017c3a",
  greenLight: "#4da672",
  greenDark: "#015c2b",
  maroon: "#9a2c44",
  maroonLight: "#b85a6e",
  olive: "#5f913b",
  dark: "#1a1a2e",
  darkLight: "#2d2d44",
} as const;

export const SEVERITY_COLORS = {
  positive: "#017c3a",
  neutral: "#2563eb",
  warning: "#c3a367",
  critical: "#dc2626",
} as const;

export const REGION_COLORS = {
  "North Africa": "#c3a367",
  "West Africa": "#017c3a",
  "East Africa": "#2563eb",
  "Central Africa": "#7c3aed",
  "Southern Africa": "#f97316",
} as const;

export const CHART_COLORS = [
  "#017c3a",
  "#c3a367",
  "#2563eb",
  "#9a2c44",
  "#5f913b",
  "#f97316",
  "#7c3aed",
  "#06b6d4",
] as const;

export const INSIGHT_TYPE_COLORS: Record<string, string> = {
  finding: "#2563eb",
  alert: "#dc2626",
  trend: "#017c3a",
  recommendation: "#c3a367",
  comparison: "#7c3aed",
  milestone: "#5f913b",
};
