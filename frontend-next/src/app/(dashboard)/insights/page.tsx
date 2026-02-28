"use client";

import { useEffect, useState, useCallback } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { InsightCard } from "@/components/insights/insight-card";
import { AUDonutChart } from "@/components/charts/au-donut-chart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getInsights, getInsightsSummary, generateInsights } from "@/lib/api/insights";
import type { Insight, InsightsSummary } from "@/lib/types/api";

const INSIGHT_TYPES = ["finding", "alert", "trend", "recommendation", "comparison", "milestone"] as const;

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-lg" />
        <div className="lg:col-span-2 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [summary, setSummary] = useState<InsightsSummary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterSeverity] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryData, insightsData] = await Promise.all([
        getInsightsSummary().catch(() => null),
        getInsights(filterType, filterSeverity),
      ]);
      if (summaryData) setSummary(summaryData);
      setInsights(insightsData.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterSeverity]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  async function handleGenerate() {
    try {
      setGenerating(true);
      await generateInsights();
      await fetchInsights();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setGenerating(false);
    }
  }

  if (error && !summary) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-au-dark">Insights Engine</h1>
        <Card className="p-6 border-l-4 border-l-severity-critical">
          <p className="text-sm text-severity-critical font-medium">Failed to load insights</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </Card>
      </div>
    );
  }

  if (!summary && loading) return <InsightsSkeleton />;

  // Prepare donut chart data from summary by_type
  const donutData = summary
    ? Object.entries(summary.by_type).map(([name, value]) => ({ name, value }))
    : [];

  // Severity counts
  const criticalCount = summary?.by_severity?.critical ?? 0;
  const warningCount = summary?.by_severity?.warning ?? 0;
  const positiveCount = summary?.by_severity?.positive ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-au-dark">Insights Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-generated findings, alerts, trends, and recommendations from AU data
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="bg-au-green hover:bg-au-green/90 text-white"
        >
          {generating ? "Generating..." : "Regenerate Insights"}
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Total Active Insights"
          value={String(summary?.total_active ?? 0)}
          severity="neutral"
        />
        <KPICard
          label="Critical"
          value={String(criticalCount)}
          severity="critical"
        />
        <KPICard
          label="Warnings"
          value={String(warningCount)}
          severity="warning"
        />
        <KPICard
          label="Positive"
          value={String(positiveCount)}
          severity="positive"
        />
      </div>

      {/* Donut Chart + Insights List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <Card className="p-5">
          <h3 className="text-md font-semibold text-au-dark mb-4">Insights by Type</h3>
          {donutData.length > 0 ? (
            <AUDonutChart data={donutData} colorMode="insightType" height={250} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data.</p>
          )}
        </Card>

        {/* Insights List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === undefined ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(undefined)}
              className={filterType === undefined ? "bg-au-dark text-white" : ""}
            >
              All
            </Button>
            {INSIGHT_TYPES.map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
                className={filterType === type ? "bg-au-dark text-white capitalize" : "capitalize"}
              >
                {type}
              </Button>
            ))}
          </div>

          {/* Scrollable Insights */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))
            ) : insights.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No insights found{filterType ? ` for type "${filterType}"` : ""}. Try generating new insights.
                </p>
              </Card>
            ) : (
              insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
