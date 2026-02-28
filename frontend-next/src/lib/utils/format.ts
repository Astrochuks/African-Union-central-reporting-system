export function formatNumber(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value == null) return "N/A";
  if (Math.abs(value) >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(decimals)}B`;
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toFixed(decimals)}M`;
  if (Math.abs(value) >= 1_000)
    return `${(value / 1_000).toFixed(decimals)}K`;
  return value.toFixed(decimals);
}

export function formatCurrency(
  value: number | null | undefined
): string {
  if (value == null) return "N/A";
  return `$${formatNumber(value)}`;
}

export function formatPercent(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value == null) return "N/A";
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getProgressColor(pct: number | null | undefined): string {
  if (pct == null) return "bg-gray-300";
  if (pct >= 60) return "bg-au-green";
  if (pct >= 30) return "bg-au-gold";
  return "bg-severity-critical";
}

export function getProgressTextColor(pct: number | null | undefined): string {
  if (pct == null) return "text-gray-500";
  if (pct >= 60) return "text-au-green";
  if (pct >= 30) return "text-au-gold";
  return "text-severity-critical";
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "positive":
      return "bg-severity-positive text-white";
    case "neutral":
      return "bg-severity-neutral text-white";
    case "warning":
      return "bg-severity-warning text-white";
    case "critical":
      return "bg-severity-critical text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

export function getInsightTypeColor(type: string): string {
  switch (type) {
    case "finding":
      return "bg-severity-neutral/10 text-severity-neutral border-severity-neutral";
    case "alert":
      return "bg-severity-critical/10 text-severity-critical border-severity-critical";
    case "trend":
      return "bg-au-green/10 text-au-green border-au-green";
    case "recommendation":
      return "bg-au-gold/10 text-au-gold-dark border-au-gold";
    case "comparison":
      return "bg-purple-50 text-purple-700 border-purple-500";
    case "milestone":
      return "bg-au-olive/10 text-au-olive border-au-olive";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}
