"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRing } from "@/components/charts/progress-ring";
import { AUBarChart } from "@/components/charts/au-bar-chart";
import { AULineChart } from "@/components/charts/au-line-chart";
import { InsightCard } from "@/components/insights/insight-card";
import { getGoal, getGoalProgress, getGoalByRegion, getGoalInsights } from "@/lib/api/goals";
import { formatNumber } from "@/lib/utils/format";
import type { GoalDetail, GoalProgress, GoalRegionalBreakdown, Insight } from "@/lib/types/api";

function GoalDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-40 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

export default function GoalDetailPage() {
  const params = useParams();
  const goalId = Number(params.goalId);

  const [detail, setDetail] = useState<GoalDetail | null>(null);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [regional, setRegional] = useState<GoalRegionalBreakdown | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNaN(goalId)) {
      setError("Invalid goal ID");
      return;
    }

    Promise.all([
      getGoal(goalId).catch(() => null),
      getGoalProgress(goalId).catch(() => null),
      getGoalByRegion(goalId).catch(() => null),
      getGoalInsights(goalId).catch(() => null),
    ])
      .then(([goalDetail, goalProgress, goalRegion, goalInsights]) => {
        if (!goalDetail) {
          setError("Goal not found");
          return;
        }
        setDetail(goalDetail);
        setProgress(goalProgress);
        setRegional(goalRegion);
        setInsights(goalInsights?.insights ?? []);
      })
      .catch((err) => setError(err.message));
  }, [goalId]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-au-dark">Goal Detail</h1>
        <Card className="p-6 border-l-4 border-l-severity-critical">
          <p className="text-sm text-severity-critical font-medium">Error loading goal</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </Card>
      </div>
    );
  }

  if (!detail) return <GoalDetailSkeleton />;

  const { goal, indicators } = detail;

  // Prepare region bar chart data
  const regionChartData = regional
    ? Object.entries(regional.regions).map(([name, data]) => ({
        name,
        value: Math.round(data.average * 100) / 100,
      }))
    : [];

  // Prepare time series data from progress
  const timeSeriesData: Record<string, unknown>[] = [];
  const seriesList: { dataKey: string; name: string }[] = [];

  if (progress?.progress && progress.progress.length > 0) {
    // Collect all years
    const yearMap: Record<number, Record<string, unknown>> = {};
    progress.progress.forEach((p) => {
      const key = p.code || p.indicator;
      seriesList.push({ dataKey: key, name: p.indicator });
      p.time_series.forEach((ts) => {
        if (!yearMap[ts.year]) yearMap[ts.year] = { year: ts.year };
        yearMap[ts.year][key] = Math.round(ts.avg_value * 100) / 100;
      });
    });

    timeSeriesData.push(
      ...Object.values(yearMap).sort(
        (a, b) => (a as { year: number }).year - (b as { year: number }).year
      )
    );
  }

  return (
    <div className="space-y-6">
      {/* Goal Header */}
      <Card className="p-6 border-t-4 border-t-au-green">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <ProgressRing
            value={goal.current_progress ?? 0}
            size={100}
            strokeWidth={8}
            label="Progress"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-au-gold text-white">Goal {goal.number}</Badge>
              {goal.aspiration_name && (
                <Badge variant="outline" className="text-xs">
                  {goal.aspiration_name}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-au-dark">{goal.name}</h1>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-2">{goal.description}</p>
            )}
            {goal.target_2063 && (
              <p className="text-xs text-muted-foreground mt-2">
                <span className="font-medium text-au-gold">2063 Target:</span> {goal.target_2063}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Indicators Table */}
      <div>
        <h2 className="text-lg font-semibold text-au-dark mb-3">Indicators</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Baseline</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Target</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Latest Value</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Year</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Data Pts</th>
                </tr>
              </thead>
              <tbody>
                {indicators.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                      No indicators available for this goal.
                    </td>
                  </tr>
                ) : (
                  indicators.map((ind) => (
                    <tr key={ind.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-au-dark max-w-[250px]">
                        <span className="line-clamp-2">{ind.name}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{ind.code ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ind.unit ?? "-"}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {ind.baseline_value != null ? formatNumber(ind.baseline_value) : "-"}
                        {ind.baseline_year && <span className="text-[10px] ml-1">({ind.baseline_year})</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-au-gold">
                        {ind.target_value != null ? formatNumber(ind.target_value) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-au-dark">
                        {ind.latest_value != null ? formatNumber(ind.latest_value) : "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{ind.latest_year ?? "-"}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{ind.data_points ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Breakdown */}
        <div>
          <h2 className="text-lg font-semibold text-au-dark mb-3">Regional Breakdown</h2>
          <Card className="p-4">
            {regionChartData.length > 0 ? (
              <AUBarChart data={regionChartData} layout="horizontal" useRegionColors height={280} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No regional data available.</p>
            )}
          </Card>
        </div>

        {/* Progress Over Time */}
        <div>
          <h2 className="text-lg font-semibold text-au-dark mb-3">Progress Over Time</h2>
          <Card className="p-4">
            {timeSeriesData.length > 0 ? (
              <AULineChart
                data={timeSeriesData}
                series={seriesList.slice(0, 5)}
                xKey="year"
                height={280}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No time series data available.</p>
            )}
          </Card>
        </div>
      </div>

      {/* Goal Insights */}
      {insights.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-au-dark mb-3">
            Goal Insights <span className="text-sm font-normal text-muted-foreground">({insights.length})</span>
          </h2>
          <div className="space-y-3">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
