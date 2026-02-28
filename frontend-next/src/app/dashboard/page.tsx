"use client";

import { useEffect, useState } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { InsightCard } from "@/components/insights/insight-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboard } from "@/lib/api/dashboard";
import { formatNumber, formatDateTime } from "@/lib/utils/format";
import type { DashboardSummary } from "@/lib/types/api";

function kpiSeverity(label: string, value: string, target: string): "positive" | "warning" | "critical" | "neutral" {
  const numVal = parseFloat(value);
  const numTarget = parseFloat(target);

  const lower = label.toLowerCase();
  if (lower.includes("youth unemployment")) {
    return numVal > 25 ? "critical" : numVal > 15 ? "warning" : "positive";
  }
  if (lower.includes("women") || lower.includes("parliament")) {
    return numVal < numTarget * 0.5 ? "critical" : numVal < numTarget ? "warning" : "positive";
  }
  if (lower.includes("life expectancy")) {
    return numVal >= numTarget ? "positive" : numVal >= numTarget * 0.8 ? "warning" : "critical";
  }
  return "neutral";
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-au-dark">Dashboard</h1>
        <Card className="p-6 border-l-4 border-l-severity-critical">
          <p className="text-sm text-severity-critical font-medium">Failed to load dashboard</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-au-dark">AU Central Reporting Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitoring {data.total_member_states} member states across {data.total_goals} Agenda 2063 goals
          with {formatNumber(data.total_data_points, 0)} data points
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.kpis.map((kpi) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            target={kpi.target}
            unit={kpi.unit}
            severity={kpiSeverity(kpi.label, kpi.value, kpi.target)}
          />
        ))}
        {/* Fill remaining slots with system KPIs if fewer than 6 */}
        {data.kpis.length < 6 && (
          <>
            <KPICard
              label="Member States"
              value={String(data.total_member_states)}
              severity="neutral"
            />
            <KPICard
              label="Agenda 2063 Goals"
              value={String(data.total_goals)}
              severity="neutral"
            />
            <KPICard
              label="Data Quality Score"
              value={data.data_quality_score != null ? `${data.data_quality_score.toFixed(0)}%` : "N/A"}
              severity={
                data.data_quality_score == null
                  ? "neutral"
                  : data.data_quality_score >= 70
                    ? "positive"
                    : data.data_quality_score >= 40
                      ? "warning"
                      : "critical"
              }
            />
          </>
        )}
      </div>

      {/* Insights + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Insights */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-au-dark">Latest Insights</h2>
          {data.recent_insights.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No insights generated yet. Run the ETL pipeline to generate insights.</p>
            </Card>
          ) : (
            data.recent_insights.slice(0, 10).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))
          )}
        </div>

        {/* System Status */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-au-dark">System Status</h2>
          <Card className="p-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Data Points</p>
              <p className="text-xl font-bold text-au-dark">{formatNumber(data.total_data_points, 0)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Indicators Tracked</p>
              <p className="text-xl font-bold text-au-dark">{data.total_indicators}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Goal Progress</p>
              <p className="text-xl font-bold text-au-dark">
                {data.avg_goal_progress != null ? `${data.avg_goal_progress.toFixed(1)}%` : "N/A"}
              </p>
            </div>
          </Card>

          {/* Latest ETL Run */}
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-au-dark">Latest ETL Run</h3>
            {data.latest_etl_run ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      data.latest_etl_run.status === "completed"
                        ? "bg-au-green text-white"
                        : data.latest_etl_run.status === "running"
                          ? "bg-au-gold text-white"
                          : "bg-severity-critical text-white"
                    }
                  >
                    {data.latest_etl_run.status}
                  </Badge>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>Records Processed: <span className="font-medium text-au-dark">{formatNumber(data.latest_etl_run.records_processed, 0)}</span></p>
                  <p>Insights Generated: <span className="font-medium text-au-dark">{data.latest_etl_run.insights_generated}</span></p>
                  <p>Completed: <span className="font-medium text-au-dark">{formatDateTime(data.latest_etl_run.completed_at)}</span></p>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No ETL runs recorded yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
