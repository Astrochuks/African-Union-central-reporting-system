"use client";

import { useEffect, useState } from "react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { AULineChart } from "@/components/charts/au-line-chart";
import { AUBarChart } from "@/components/charts/au-bar-chart";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGenderOverview, getGenderTrends } from "@/lib/api/gender";
import { getYouthOverview, getYouthTrends } from "@/lib/api/youth";
import { formatPercent } from "@/lib/utils/format";
import type { GenderOverview, GenderTrend, YouthOverview, YouthTrend } from "@/lib/types/api";

function GenderYouthSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-80" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

export default function GenderYouthPage() {
  const [genderOverview, setGenderOverview] = useState<GenderOverview | null>(null);
  const [genderTrends, setGenderTrends] = useState<GenderTrend[]>([]);
  const [youthOverview, setYouthOverview] = useState<YouthOverview | null>(null);
  const [youthTrends, setYouthTrends] = useState<YouthTrend[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getGenderOverview().catch(() => null),
      getGenderTrends().catch(() => ({ trends: [] })),
      getYouthOverview().catch(() => null),
      getYouthTrends().catch(() => ({ trends: [] })),
    ])
      .then(([gOverview, gTrends, yOverview, yTrends]) => {
        setGenderOverview(gOverview);
        setGenderTrends(gTrends?.trends ?? []);
        setYouthOverview(yOverview);
        setYouthTrends(yTrends?.trends ?? []);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-au-dark">Gender & Youth Analytics</h1>
        <Card className="p-6 border-l-4 border-l-severity-critical">
          <p className="text-sm text-severity-critical font-medium">Failed to load data</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </Card>
      </div>
    );
  }

  if (!genderOverview && !youthOverview) return <GenderYouthSkeleton />;

  // Gender trend chart data
  const genderTrendData = genderTrends.map((t) => ({
    year: t.year,
    avg_women_parliament: t.avg_women_parliament,
    avg_labor_force: t.avg_labor_force,
    avg_parity_index: t.avg_parity_index,
  }));

  // Youth trend chart data
  const youthTrendData = youthTrends.map((t) => ({
    year: t.year,
    avg_unemployment: t.avg_unemployment,
    avg_enrollment: t.avg_enrollment,
  }));

  // Gender regional data for bar chart
  const genderRegionalData = genderOverview?.regional_breakdown?.map((r) => ({
    name: r.region,
    value: r.women_parliament_pct,
  })) ?? [];

  // Youth regional data for bar chart
  const youthRegionalData = youthOverview?.regional_breakdown?.map((r) => ({
    name: r.region,
    value: r.unemployment_pct,
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-au-dark">Gender & Youth Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitoring gender equality, women&apos;s empowerment, and youth development across the continent
        </p>
      </div>

      <Tabs defaultValue="gender" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="gender">Gender Analytics</TabsTrigger>
          <TabsTrigger value="youth">Youth Analytics</TabsTrigger>
        </TabsList>

        {/* Gender Tab */}
        <TabsContent value="gender" className="space-y-6">
          {genderOverview ? (
            <>
              {/* Gender KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <KPICard
                  label="Women in Parliament"
                  value={formatPercent(genderOverview.continental_avg_women_parliament)}
                  target="30%"
                  unit="avg"
                  severity={
                    (genderOverview.continental_avg_women_parliament ?? 0) >= 30
                      ? "positive"
                      : (genderOverview.continental_avg_women_parliament ?? 0) >= 20
                        ? "warning"
                        : "critical"
                  }
                />
                <KPICard
                  label="Labor Force Participation"
                  value={formatPercent(genderOverview.continental_avg_labor_force)}
                  target="50%"
                  unit="avg"
                  severity={
                    (genderOverview.continental_avg_labor_force ?? 0) >= 50
                      ? "positive"
                      : "warning"
                  }
                />
                <KPICard
                  label="Gender Parity Index"
                  value={genderOverview.continental_avg_parity_index?.toFixed(2) ?? "N/A"}
                  target="1.00"
                  severity={
                    (genderOverview.continental_avg_parity_index ?? 0) >= 0.95
                      ? "positive"
                      : (genderOverview.continental_avg_parity_index ?? 0) >= 0.8
                        ? "warning"
                        : "critical"
                  }
                />
                <KPICard
                  label="Countries above 30% Parliament"
                  value={String(genderOverview.countries_above_30pct_parliament)}
                  target={`of ${genderOverview.total_countries_with_data}`}
                  severity={
                    genderOverview.countries_above_30pct_parliament > genderOverview.total_countries_with_data * 0.5
                      ? "positive"
                      : "warning"
                  }
                />
              </div>

              {/* Gender Trends Chart */}
              <Card className="p-5">
                <h3 className="text-md font-semibold text-au-dark mb-4">Gender Trends Over Time</h3>
                {genderTrendData.length > 0 ? (
                  <AULineChart
                    data={genderTrendData}
                    series={[
                      { dataKey: "avg_women_parliament", name: "Women in Parliament (%)", color: "#9a2c44" },
                      { dataKey: "avg_labor_force", name: "Labor Force Participation (%)", color: "#017c3a" },
                    ]}
                    xKey="year"
                    yLabel="%"
                    height={320}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No trend data available.</p>
                )}
              </Card>

              {/* Gender Regional Breakdown */}
              {genderRegionalData.length > 0 && (
                <Card className="p-5">
                  <h3 className="text-md font-semibold text-au-dark mb-4">
                    Women in Parliament by Region
                  </h3>
                  <AUBarChart data={genderRegionalData} layout="horizontal" useRegionColors height={280} />
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Gender data not available. Run the ETL pipeline to load data.</p>
            </Card>
          )}
        </TabsContent>

        {/* Youth Tab */}
        <TabsContent value="youth" className="space-y-6">
          {youthOverview ? (
            <>
              {/* Youth KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <KPICard
                  label="Youth Unemployment"
                  value={formatPercent(youthOverview.continental_avg_unemployment)}
                  target="<15%"
                  unit="avg"
                  severity={
                    (youthOverview.continental_avg_unemployment ?? 0) > 25
                      ? "critical"
                      : (youthOverview.continental_avg_unemployment ?? 0) > 15
                        ? "warning"
                        : "positive"
                  }
                />
                <KPICard
                  label="Secondary Enrollment"
                  value={formatPercent(youthOverview.continental_avg_enrollment)}
                  target="100%"
                  unit="avg"
                  severity={
                    (youthOverview.continental_avg_enrollment ?? 0) >= 80
                      ? "positive"
                      : (youthOverview.continental_avg_enrollment ?? 0) >= 50
                        ? "warning"
                        : "critical"
                  }
                />
                <KPICard
                  label="High Unemployment Countries"
                  value={String(youthOverview.countries_high_unemployment)}
                  target={`of ${youthOverview.total_countries_with_data}`}
                  severity={
                    youthOverview.countries_high_unemployment > youthOverview.total_countries_with_data * 0.5
                      ? "critical"
                      : "warning"
                  }
                />
              </div>

              {/* Youth Trends Chart */}
              <Card className="p-5">
                <h3 className="text-md font-semibold text-au-dark mb-4">Youth Trends Over Time</h3>
                {youthTrendData.length > 0 ? (
                  <AULineChart
                    data={youthTrendData}
                    series={[
                      { dataKey: "avg_unemployment", name: "Youth Unemployment (%)", color: "#dc2626" },
                      { dataKey: "avg_enrollment", name: "Secondary Enrollment (%)", color: "#2563eb" },
                    ]}
                    xKey="year"
                    yLabel="%"
                    height={320}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No trend data available.</p>
                )}
              </Card>

              {/* Youth Regional Breakdown */}
              {youthRegionalData.length > 0 && (
                <Card className="p-5">
                  <h3 className="text-md font-semibold text-au-dark mb-4">
                    Youth Unemployment by Region
                  </h3>
                  <AUBarChart data={youthRegionalData} layout="horizontal" useRegionColors height={280} />
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Youth data not available. Run the ETL pipeline to load data.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
