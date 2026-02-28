import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  target?: string;
  unit?: string;
  trend?: "up" | "down" | "flat";
  severity?: "positive" | "warning" | "critical" | "neutral";
}

export function KPICard({ label, value, target, unit, severity = "neutral" }: KPICardProps) {
  const borderColor = {
    positive: "border-t-au-green",
    warning: "border-t-au-gold",
    critical: "border-t-severity-critical",
    neutral: "border-t-severity-neutral",
  }[severity];

  return (
    <Card className={cn("p-4 border-t-4", borderColor)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-au-dark mt-1">
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
      {target && (
        <p className="text-xs text-muted-foreground mt-1">
          Target: <span className="font-medium text-au-gold">{target}</span>
        </p>
      )}
    </Card>
  );
}
