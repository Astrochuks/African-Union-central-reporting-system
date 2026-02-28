"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Target, TrendingUp, AlertTriangle, CheckCircle2, Info, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/dashboard/kpi-card";
import { getGoals } from "@/lib/api/goals";
import { formatPercent } from "@/lib/utils/format";
import type { Goal } from "@/lib/types/api";

interface AspirationGroup {
  aspirationId: number;
  aspirationName: string;
  goals: Goal[];
}

function getStatus(progress: number | null | undefined): {
  label: string;
  color: string;
  badgeClass: string;
} {
  if (progress == null) {
    return { label: "No Data", color: "bg-gray-300", badgeClass: "bg-gray-100 text-gray-600" };
  }
  if (progress >= 60) {
    return { label: "On Track", color: "bg-au-green", badgeClass: "bg-au-green/10 text-au-green border-au-green" };
  }
  if (progress >= 40) {
    return { label: "Progressing", color: "bg-au-gold", badgeClass: "bg-au-gold/10 text-au-gold border-au-gold" };
  }
  if (progress >= 20) {
    return {
      label: "Needs Acceleration",
      color: "bg-orange-500",
      badgeClass: "bg-orange-50 text-orange-600 border-orange-500",
    };
  }
  return {
    label: "Off Track",
    color: "bg-severity-critical",
    badgeClass: "bg-red-50 text-red-600 border-red-500",
  };
}

function ProgressBar({ value }: { value: number | null | undefined }) {
  const pct = value ?? 0;
  const status = getStatus(value);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${status.color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-au-dark w-10 text-right">{value != null ? formatPercent(value, 0) : "N/A"}</span>
    </div>
  );
}

function AspirationSection({ group, defaultOpen }: { group: AspirationGroup; defaultOpen: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const avgProgress = useMemo(() => {
    const withData = group.goals.filter((g) => g.current_progress != null);
    if (withData.length === 0) return null;
    return withData.reduce((sum, g) => sum + (g.current_progress ?? 0), 0) / withData.length;
  }, [group.goals]);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-au-dark">
            Aspiration {group.aspirationId}: {group.aspirationName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {group.goals.length} goal{group.goals.length !== 1 ? "s" : ""}
            {avgProgress != null ? ` | Avg Progress: ${formatPercent(avgProgress, 0)}` : ""}
          </p>
        </div>
        {avgProgress != null && (
          <Badge variant="outline" className={`text-[10px] ${getStatus(avgProgress).badgeClass}`}>
            {getStatus(avgProgress).label}
          </Badge>
        )}
      </button>
      {isOpen && (
        <div className="border-t border-gray-100">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50/50 border-b border-gray-100">
            <div className="col-span-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">#</div>
            <div className="col-span-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Goal
            </div>
            <div className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Target 2063
            </div>
            <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Progress
            </div>
            <div className="col-span-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
              Status
            </div>
          </div>
          {/* Goal Rows */}
          {group.goals.map((goal) => {
            const status = getStatus(goal.current_progress);
            return (
              <div
                key={goal.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/30 transition-colors items-center"
              >
                <div className="col-span-1">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-au-dark/5 text-xs font-bold text-au-dark">
                    {goal.number}
                  </span>
                </div>
                <div className="col-span-4">
                  <p className="text-sm font-medium text-au-dark leading-snug">{goal.name}</p>
                  {goal.indicator_count != null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {goal.indicator_count} indicator{goal.indicator_count !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="col-span-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {goal.target_2063 || "Target not defined"}
                  </p>
                </div>
                <div className="col-span-2">
                  <ProgressBar value={goal.current_progress} />
                </div>
                <div className="col-span-2 text-right">
                  <Badge variant="outline" className={`text-[10px] ${status.badgeClass}`}>
                    {status.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function MEFrameworkPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getGoals();
        setGoals(data.goals || []);
      } catch {
        setError("Failed to load goals data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const aspirationGroups = useMemo(() => {
    const groups: Record<number, AspirationGroup> = {};
    for (const goal of goals) {
      const aspId = goal.aspiration_id || 0;
      const aspName = goal.aspiration_name || goal.aspirations?.name || `Aspiration ${aspId}`;
      if (!groups[aspId]) {
        groups[aspId] = { aspirationId: aspId, aspirationName: aspName, goals: [] };
      }
      groups[aspId].goals.push(goal);
    }
    // Sort by aspiration ID
    return Object.values(groups).sort((a, b) => a.aspirationId - b.aspirationId);
  }, [goals]);

  const stats = useMemo(() => {
    const withProgress = goals.filter((g) => g.current_progress != null);
    const avgProgress =
      withProgress.length > 0
        ? withProgress.reduce((sum, g) => sum + (g.current_progress ?? 0), 0) / withProgress.length
        : null;
    const onTrack = withProgress.filter((g) => (g.current_progress ?? 0) >= 60).length;
    const offTrack = withProgress.filter((g) => (g.current_progress ?? 0) < 20).length;
    return {
      totalGoals: goals.length,
      avgProgress,
      onTrack,
      offTrack,
    };
  }, [goals]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-au-gold mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-au-dark mb-1">Unable to Load Framework</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro */}
      <Card className="p-4 border-l-4 border-l-au-gold bg-au-gold/5">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-au-gold flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-au-dark">Monitoring & Evaluation Framework</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              This logframe presents the results framework for the African Union&apos;s Agenda 2063. It maps each of the
              7 aspirations to their constituent goals, targets, and current progress. The M&E framework enables
              systematic tracking of continental development outcomes, identifies areas requiring acceleration, and
              supports evidence-based decision making at the policy level.
            </p>
          </div>
        </div>
      </Card>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Goals"
          value={String(stats.totalGoals)}
          target="20 Agenda 2063 Goals"
          severity="neutral"
        />
        <KPICard
          label="Avg Progress"
          value={stats.avgProgress != null ? formatPercent(stats.avgProgress, 0) : "N/A"}
          target="100% by 2063"
          severity={stats.avgProgress != null && stats.avgProgress >= 50 ? "positive" : "warning"}
        />
        <KPICard
          label="On Track"
          value={String(stats.onTrack)}
          unit={`of ${stats.totalGoals}`}
          severity="positive"
        />
        <KPICard
          label="Off Track"
          value={String(stats.offTrack)}
          unit={`of ${stats.totalGoals}`}
          severity={stats.offTrack > 0 ? "critical" : "positive"}
        />
      </div>

      {/* Color Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="font-medium text-muted-foreground">Status Legend:</span>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-au-green" />
          <span className="text-au-dark">On Track (&ge;60%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-au-gold" />
          <span className="text-au-dark">Progressing (&ge;40%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-au-dark">Needs Acceleration (&ge;20%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-red-500" />
          <span className="text-au-dark">Off Track (&lt;20%)</span>
        </div>
      </div>

      {/* Aspiration Groups */}
      <div className="space-y-3">
        {aspirationGroups.map((group, idx) => (
          <AspirationSection key={group.aspirationId} group={group} defaultOpen={idx === 0} />
        ))}
      </div>

      {/* Export Hint */}
      <Card className="p-3 bg-gray-50 border-dashed flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          This framework data can be exported as part of the{" "}
          <a href="/dashboard/reports" className="text-au-green underline underline-offset-2 hover:text-au-green/80">
            Reports
          </a>{" "}
          page. Generate an Executive Summary or Goal Progress report for formatted output.
        </p>
      </Card>
    </div>
  );
}
