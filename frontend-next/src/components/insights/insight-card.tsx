import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSeverityColor, getInsightTypeColor } from "@/lib/utils/format";
import type { Insight } from "@/lib/types/api";

export function InsightCard({ insight }: { insight: Insight }) {
  const severityBorder = {
    positive: "border-l-au-green",
    neutral: "border-l-severity-neutral",
    warning: "border-l-au-gold",
    critical: "border-l-severity-critical",
  }[insight.severity] || "border-l-gray-300";

  return (
    <Card className={cn("p-4 border-l-4", severityBorder)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 capitalize", getInsightTypeColor(insight.type))}>
              {insight.type}
            </Badge>
            <Badge className={cn("text-[10px] px-1.5 py-0 capitalize", getSeverityColor(insight.severity))}>
              {insight.severity}
            </Badge>
          </div>
          <h4 className="text-sm font-semibold text-au-dark leading-snug">{insight.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insight.description}</p>
        </div>
      </div>
    </Card>
  );
}
