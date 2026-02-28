"use client";

import { useEffect, useState } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPipelineStatus,
  getDataSources,
  triggerPipeline,
  seedDatabase,
} from "@/lib/api/pipeline";
import { formatNumber, formatDateTime } from "@/lib/utils/format";
import type { PipelineStatus, DataSource } from "@/lib/types/api";

function PipelineSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

function statusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
    case "active":
      return "bg-au-green text-white";
    case "running":
    case "in_progress":
      return "bg-au-gold text-white";
    case "failed":
    case "error":
      return "bg-severity-critical text-white";
    case "available":
      return "bg-severity-neutral text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

export default function PipelinePage() {
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      const [statusData, sourcesData] = await Promise.all([
        getPipelineStatus().catch(() => null),
        getDataSources().catch(() => ({ sources: [] })),
      ]);
      if (statusData) setPipelineStatus(statusData);
      setDataSources(sourcesData.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleTrigger() {
    try {
      setTriggering(true);
      setActionMessage(null);
      const result = await triggerPipeline();
      setActionMessage(result.message || "Pipeline triggered successfully");
      await fetchData();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Failed to trigger pipeline");
    } finally {
      setTriggering(false);
    }
  }

  async function handleSeed() {
    try {
      setSeeding(true);
      setActionMessage(null);
      const result = await seedDatabase();
      setActionMessage(
        `Database seeded: ${result.regions} regions, ${result.aspirations} aspirations, ${result.goals} goals, ${result.member_states} member states, ${result.indicators} indicators`
      );
      await fetchData();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Failed to seed database");
    } finally {
      setSeeding(false);
    }
  }

  if (error && !pipelineStatus) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-au-dark">ETL Pipeline</h1>
        <Card className="p-6 border-l-4 border-l-severity-critical">
          <p className="text-sm text-severity-critical font-medium">Failed to load pipeline</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </Card>
      </div>
    );
  }

  if (loading && !pipelineStatus) return <PipelineSkeleton />;

  // Include a virtual DHIS2 source if not present
  const allSources = [...dataSources];
  if (!allSources.find((s) => s.name.toLowerCase().includes("dhis2"))) {
    allSources.push({
      id: 0,
      name: "DHIS2",
      source_type: "API",
      status: "available",
      api_url: "https://play.dhis2.org/40/api",
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-au-dark">ETL Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Extract, Transform, Load data from external sources into the AU Central Reporting System
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          label="Total ETL Runs"
          value={String(pipelineStatus?.total_runs ?? 0)}
          severity="neutral"
        />
        <KPICard
          label="Total Data Records"
          value={formatNumber(pipelineStatus?.total_data_records ?? 0, 0)}
          severity="positive"
        />
        <KPICard
          label="Data Sources"
          value={String(allSources.length)}
          severity="neutral"
        />
      </div>

      {/* Action Buttons */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            onClick={handleTrigger}
            disabled={triggering}
            className="bg-au-green hover:bg-au-green/90 text-white"
          >
            {triggering ? "Running Pipeline..." : "Run ETL Pipeline"}
          </Button>
          <Button
            onClick={handleSeed}
            disabled={seeding}
            variant="outline"
            className="border-au-gold text-au-gold-dark hover:bg-au-gold/10"
          >
            {seeding ? "Seeding..." : "Seed Database"}
          </Button>
          {actionMessage && (
            <p className="text-sm text-muted-foreground flex-1">{actionMessage}</p>
          )}
        </div>
      </Card>

      {/* Data Sources */}
      <div>
        <h2 className="text-lg font-semibold text-au-dark mb-3">Data Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allSources.map((source) => (
            <Card key={source.id || source.name} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-au-dark">{source.name}</h4>
                <Badge className={statusBadgeClass(source.status)}>{source.status}</Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {source.source_type && (
                  <p>
                    Type: <span className="font-medium">{source.source_type}</span>
                  </p>
                )}
                {source.last_refresh && (
                  <p>
                    Last Refresh: <span className="font-medium">{formatDateTime(source.last_refresh)}</span>
                  </p>
                )}
                {source.record_count != null && (
                  <p>
                    Records: <span className="font-medium">{formatNumber(source.record_count, 0)}</span>
                  </p>
                )}
                {source.api_url && (
                  <p className="truncate">
                    URL: <span className="font-mono text-[10px]">{source.api_url}</span>
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ETL History Table */}
      <div>
        <h2 className="text-lg font-semibold text-au-dark mb-3">ETL Run History</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Started</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Completed</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Processed</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Failed</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Insights</th>
                </tr>
              </thead>
              <tbody>
                {!pipelineStatus?.runs || pipelineStatus.runs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No ETL runs recorded. Click &quot;Run ETL Pipeline&quot; to start.
                    </td>
                  </tr>
                ) : (
                  pipelineStatus.runs.map((run) => (
                    <tr key={run.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(run.started_at)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(run.completed_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={statusBadgeClass(run.status)}>{run.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-au-dark">
                        {formatNumber(run.records_processed, 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={run.records_failed > 0 ? "text-severity-critical font-medium" : "text-muted-foreground"}>
                          {run.records_failed}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-au-green">
                        {run.insights_generated}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
