"use client";

import {
  BarChart3,
  Target,
  Scale,
  Lightbulb,
  Globe,
  Settings,
  FileText,
  Database,
  Shield,
  BookOpen,
  ArrowRight,
  Code,
  Calendar,
  Mail,
  Activity,
  Layers,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

function QuickLink({ href, icon: Icon, label, description }: { href: string; icon: React.ElementType; label: string; description: string }) {
  return (
    <Link href={href}>
      <Card className="p-3 hover:border-au-gold hover:shadow-sm transition-all group cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-au-dark/5 flex items-center justify-center group-hover:bg-au-gold/10 transition-colors">
            <Icon className="h-4 w-4 text-au-dark group-hover:text-au-gold transition-colors" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-au-dark group-hover:text-au-gold transition-colors">{label}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Card>
    </Link>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-au-gold" />
        <h4 className="text-sm font-semibold text-au-dark">{title}</h4>
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </Card>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CircleDot className="h-3 w-3 text-au-gold flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="getting-started">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-6">
          <TabsTrigger value="getting-started" className="text-xs data-[state=active]:bg-au-gold/10 data-[state=active]:text-au-dark">
            Getting Started
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs data-[state=active]:bg-au-gold/10 data-[state=active]:text-au-dark">
            Dashboard & KPIs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-au-gold/10 data-[state=active]:text-au-dark">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="data-management" className="text-xs data-[state=active]:bg-au-gold/10 data-[state=active]:text-au-dark">
            Data Management
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs data-[state=active]:bg-au-gold/10 data-[state=active]:text-au-dark">
            Reports & Export
          </TabsTrigger>
          <TabsTrigger value="technical" className="text-xs data-[state=active]:bg-au-gold/10 data-[state=active]:text-au-dark">
            Technical Reference
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Getting Started */}
        <TabsContent value="getting-started" className="space-y-4">
          <Card className="p-5 border-l-4 border-l-au-gold">
            <h3 className="text-base font-semibold text-au-dark mb-2">Welcome to the AU Central Reporting System</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This platform serves as the primary data intelligence hub for the African Union Commission.
              It aggregates development data from all 55 member states, tracks progress against Agenda 2063
              goals, and generates AI-powered insights to support evidence-based policy recommendations.
              The system covers economic, health, education, gender, youth, and infrastructure indicators.
            </p>
          </Card>

          <h4 className="text-sm font-semibold text-au-dark">Quick Links</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickLink href="/dashboard" icon={BarChart3} label="Dashboard" description="Continental overview with KPIs and recent insights" />
            <QuickLink href="/dashboard/insights" icon={Lightbulb} label="Insights Engine" description="AI-generated findings, alerts, and recommendations" />
            <QuickLink href="/dashboard/gender-youth" icon={Scale} label="Gender & Youth" description="WGYD metrics across member states" />
            <QuickLink href="/dashboard/agenda-2063" icon={Target} label="Agenda 2063" description="Track progress across 20 continental goals" />
            <QuickLink href="/dashboard/countries" icon={Globe} label="Member States" description="Detailed country profiles and scorecards" />
            <QuickLink href="/dashboard/chat" icon={BookOpen} label="AI Assistant" description="Ask natural language questions about AU data" />
          </div>

          <SectionCard icon={Target} title="What is Agenda 2063?">
            <p>
              Agenda 2063 is the African Union&apos;s strategic framework for the socio-economic transformation of the
              continent over the next 50 years. Adopted in 2013, it is built on 7 Aspirations, broken into 20 Goals
              and tracked through specific indicators across all 55 member states. This system monitors progress
              toward those goals using real-world data from the World Bank and other sources.
            </p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
              <BulletItem>7 continental aspirations</BulletItem>
              <BulletItem>20 measurable goals</BulletItem>
              <BulletItem>55 member states tracked</BulletItem>
              <BulletItem>5 geographic regions</BulletItem>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Tab 2: Dashboard & KPIs */}
        <TabsContent value="dashboard" className="space-y-4">
          <SectionCard icon={BarChart3} title="Key Performance Indicators">
            <p className="mb-2">
              The dashboard displays continental-level KPIs derived from the latest available data across all member states.
              Each KPI card shows the current value, target, and a color-coded severity indicator.
            </p>
            <BulletItem><strong>Total Member States:</strong> Number of countries in the AU with active data</BulletItem>
            <BulletItem><strong>Total Goals:</strong> Agenda 2063 goals being tracked (target: 20)</BulletItem>
            <BulletItem><strong>Total Data Points:</strong> Number of individual indicator observations loaded</BulletItem>
            <BulletItem><strong>Avg Goal Progress:</strong> Mean progress across all goals with data</BulletItem>
            <BulletItem><strong>Data Quality Score:</strong> Continental average of data completeness</BulletItem>
          </SectionCard>

          <SectionCard icon={Activity} title="Color System">
            <p className="mb-2">Colors are used consistently throughout the system to indicate performance status:</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-au-green" />
                <span><strong className="text-au-green">Green:</strong> On Track -- metric meets or exceeds 60% of target</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-au-gold" />
                <span><strong className="text-au-gold">Gold:</strong> Progressing -- metric is between 30-60% of target</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-severity-critical" />
                <span><strong className="text-severity-critical">Red:</strong> Off Track -- metric is below 30% of target</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Lightbulb} title="Reading Insights">
            <p className="mb-2">Insights appear as cards with colored left borders indicating severity:</p>
            <div className="space-y-1.5">
              <BulletItem><strong>Positive (green):</strong> Good news -- milestone reached, target achieved</BulletItem>
              <BulletItem><strong>Neutral (blue):</strong> Informational finding or data observation</BulletItem>
              <BulletItem><strong>Warning (gold):</strong> An emerging concern that needs attention</BulletItem>
              <BulletItem><strong>Critical (red):</strong> Urgent alert requiring immediate action</BulletItem>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Tab 3: Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <SectionCard icon={Scale} title="Gender & Youth Analytics">
            <p className="mb-2">
              Aligned with the Women, Gender and Youth Directorate (WGYD), this module tracks key gender parity
              and youth development metrics across all member states.
            </p>
            <BulletItem><strong>Gender Metrics:</strong> Women in parliament (%), gender parity index, female labor force participation, maternal mortality</BulletItem>
            <BulletItem><strong>Youth Metrics:</strong> Youth unemployment, literacy rates, secondary enrollment, NEET rates</BulletItem>
            <BulletItem>Regional breakdown by North, West, East, Central, and Southern Africa</BulletItem>
            <BulletItem>Continental trend analysis over time</BulletItem>
          </SectionCard>

          <SectionCard icon={Lightbulb} title="Insights Engine">
            <p className="mb-2">
              The insights engine automatically analyzes loaded data and generates structured findings.
              It runs 10 analysis generators producing 6 types of insights at 4 severity levels.
            </p>
            <div className="mt-2">
              <p className="font-medium text-au-dark text-xs mb-1.5">Insight Types:</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px] bg-severity-neutral/5 text-severity-neutral">Finding</Badge>
                <Badge variant="outline" className="text-[10px] bg-severity-critical/5 text-severity-critical">Alert</Badge>
                <Badge variant="outline" className="text-[10px] bg-au-green/5 text-au-green">Trend</Badge>
                <Badge variant="outline" className="text-[10px] bg-au-gold/5 text-au-gold">Recommendation</Badge>
                <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700">Comparison</Badge>
                <Badge variant="outline" className="text-[10px] bg-au-olive/5 text-au-olive">Milestone</Badge>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Target} title="M&E Framework">
            <p className="mb-2">
              The Monitoring and Evaluation framework provides a logframe view of all 20 Agenda 2063 goals,
              organized by aspiration. It tracks baselines, targets (2063), and current progress.
            </p>
            <BulletItem><strong>Baselines:</strong> Starting values established from historical data</BulletItem>
            <BulletItem><strong>Targets:</strong> 2063 aspirational goals set by the AU</BulletItem>
            <BulletItem><strong>Progress:</strong> Current achievement as a percentage of the baseline-to-target range</BulletItem>
            <BulletItem>Color-coded status: On Track, Progressing, Needs Acceleration, Off Track</BulletItem>
          </SectionCard>

          <SectionCard icon={Shield} title="Data Quality Scoring">
            <p className="mb-2">
              Each country receives a data quality score based on indicator coverage and completeness.
            </p>
            <BulletItem><strong>Good Quality (&gt;70):</strong> Country has data for most indicators across recent years</BulletItem>
            <BulletItem><strong>Moderate Quality (40-70):</strong> Gaps exist but core indicators are available</BulletItem>
            <BulletItem><strong>Poor Quality (&lt;40):</strong> Significant data gaps limiting analysis</BulletItem>
          </SectionCard>
        </TabsContent>

        {/* Tab 4: Data Management */}
        <TabsContent value="data-management" className="space-y-4">
          <SectionCard icon={Settings} title="ETL Pipeline">
            <p className="mb-2">
              The Extract-Transform-Load (ETL) pipeline automates data collection from external sources.
              The primary source is the World Bank Indicators API.
            </p>
            <BulletItem><strong>Extract:</strong> Pulls indicator data from the World Bank API for all 55 AU member states</BulletItem>
            <BulletItem><strong>Transform:</strong> Normalizes values, maps to Agenda 2063 goals, and validates data quality</BulletItem>
            <BulletItem><strong>Load:</strong> Stores cleaned records in the Supabase PostgreSQL database</BulletItem>
            <BulletItem>Each ETL run logs records processed, records failed, and insights generated</BulletItem>
            <BulletItem>Pipeline status and run history are visible on the Data Pipeline page</BulletItem>
          </SectionCard>

          <SectionCard icon={Database} title="Manual Data Submission">
            <p className="mb-2">
              Data can also be submitted manually through the Data Entry page. This is useful for indicators
              not available through automated sources.
            </p>
            <BulletItem>Select a country, indicator, year, and value</BulletItem>
            <BulletItem>Add multiple rows before submitting</BulletItem>
            <BulletItem>All entries are validated before insertion</BulletItem>
          </SectionCard>

          <SectionCard icon={Layers} title="Supported Data Sources">
            <div className="space-y-1.5">
              <BulletItem><strong>World Bank API (Automated):</strong> Primary source for economic, health, education, and infrastructure indicators</BulletItem>
              <BulletItem><strong>Excel Upload:</strong> Bulk upload via standardized Excel template</BulletItem>
              <BulletItem><strong>Manual Entry:</strong> Individual data points through the web form</BulletItem>
              <BulletItem><strong>DHIS2 Import (Planned):</strong> Future integration with DHIS2 health information systems</BulletItem>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Tab 5: Reports & Export */}
        <TabsContent value="reports" className="space-y-4">
          <SectionCard icon={FileText} title="Available Report Types">
            <p className="mb-2">The system can generate structured reports in multiple formats:</p>
            <BulletItem><strong>Executive Summary:</strong> Pyramid Principle-structured overview with key findings, situation analysis, and recommendations</BulletItem>
            <BulletItem><strong>Gender Brief:</strong> Focused analysis of gender parity metrics and WGYD priorities</BulletItem>
            <BulletItem><strong>Youth Brief:</strong> Youth employment, education, and engagement metrics</BulletItem>
            <BulletItem><strong>Country Profile:</strong> Detailed scorecard for a specific member state</BulletItem>
            <BulletItem><strong>Goal Progress:</strong> Deep dive into a specific Agenda 2063 goal</BulletItem>
          </SectionCard>

          <SectionCard icon={FileText} title="Export Options">
            <BulletItem>Reports are generated as structured JSON and can be exported</BulletItem>
            <BulletItem>Data tables support Excel (.xlsx) export for offline analysis</BulletItem>
            <BulletItem>Insights can be filtered and exported by type, severity, or topic</BulletItem>
          </SectionCard>

          <SectionCard icon={Lightbulb} title="How Insights Feed Into Reports">
            <p>
              When you generate a report, the system automatically selects the most relevant active insights
              and organizes them using the Pyramid Principle -- leading with the synthesis, followed by
              supporting evidence grouped by theme. Critical and warning-level insights are prioritized to
              ensure decision-makers see the most actionable information first.
            </p>
          </SectionCard>
        </TabsContent>

        {/* Tab 6: Technical Reference */}
        <TabsContent value="technical" className="space-y-4">
          <SectionCard icon={Code} title="API Documentation">
            <p className="mb-2">
              The backend exposes a RESTful API built with FastAPI. Interactive documentation is available at:
            </p>
            <div className="mt-1">
              <a
                href="/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-au-green underline underline-offset-2 hover:text-au-green/80 text-xs font-medium"
              >
                <Code className="h-3 w-3" />
                /docs -- Swagger UI
              </a>
            </div>
            <div className="mt-1">
              <a
                href="/redoc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-au-green underline underline-offset-2 hover:text-au-green/80 text-xs font-medium"
              >
                <Code className="h-3 w-3" />
                /redoc -- ReDoc
              </a>
            </div>
          </SectionCard>

          <SectionCard icon={Calendar} title="Data Update Schedule">
            <BulletItem>World Bank data is refreshed via ETL pipeline (can be triggered manually)</BulletItem>
            <BulletItem>Insights are regenerated after each successful ETL run</BulletItem>
            <BulletItem>Data quality scores are recalculated on demand</BulletItem>
            <BulletItem>Manual entries are reflected immediately in analytics</BulletItem>
          </SectionCard>

          <SectionCard icon={Globe} title="Supported Indicators">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
              <BulletItem>GDP per capita</BulletItem>
              <BulletItem>Manufacturing (% GDP)</BulletItem>
              <BulletItem>FDI (% GDP)</BulletItem>
              <BulletItem>Life expectancy</BulletItem>
              <BulletItem>Maternal mortality</BulletItem>
              <BulletItem>Under-5 mortality</BulletItem>
              <BulletItem>Adult literacy rate</BulletItem>
              <BulletItem>Primary enrollment</BulletItem>
              <BulletItem>Secondary enrollment</BulletItem>
              <BulletItem>Women in parliament</BulletItem>
              <BulletItem>Gender parity index</BulletItem>
              <BulletItem>Female labor force</BulletItem>
              <BulletItem>Youth unemployment</BulletItem>
              <BulletItem>Internet users</BulletItem>
              <BulletItem>Electricity access</BulletItem>
              <BulletItem>Mobile subscriptions</BulletItem>
            </div>
          </SectionCard>

          <SectionCard icon={Mail} title="Contact & Support">
            <BulletItem><strong>Technical Support:</strong> ajakgheshedrack@gmail.com</BulletItem>
            <BulletItem><strong>Repository:</strong> github.com/Astrochuks/African-Union-central-reporting-system</BulletItem>
            <BulletItem><strong>Stack:</strong> Next.js (frontend) + FastAPI (backend) + Supabase (database) + ECharts (charts)</BulletItem>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
