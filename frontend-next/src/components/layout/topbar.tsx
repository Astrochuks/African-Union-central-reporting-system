"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Continental overview and key performance indicators" },
  "/dashboard/agenda-2063": { title: "Agenda 2063 Goals", subtitle: "Track progress across 20 continental goals" },
  "/dashboard/gender-youth": { title: "Gender & Youth Analytics", subtitle: "Women, Gender and Youth Directorate metrics" },
  "/dashboard/insights": { title: "Insights Engine", subtitle: "AI-powered findings, alerts, and recommendations" },
  "/dashboard/countries": { title: "Member States", subtitle: "55 AU member states data explorer" },
  "/dashboard/pipeline": { title: "Data Pipeline", subtitle: "ETL operations and data source management" },
  "/dashboard/reports": { title: "Reports", subtitle: "Generate executive summaries and data exports" },
  "/dashboard/chat": { title: "AI Assistant", subtitle: "Ask questions about AU data and indicators" },
  "/dashboard/me-framework": { title: "M&E Framework", subtitle: "Monitoring & Evaluation logframe view" },
  "/dashboard/data-quality": { title: "Data Quality", subtitle: "Assess completeness and reliability of data" },
  "/dashboard/data-entry": { title: "Data Entry", subtitle: "Submit data from member states and partners" },
  "/dashboard/guide": { title: "User Guide", subtitle: "Learn how to use the reporting system" },
};

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const pageInfo = pageTitles[pathname] || { title: "AU Reporting", subtitle: "" };

  // Handle dynamic routes
  let displayTitle = pageInfo.title;
  let displaySubtitle = pageInfo.subtitle;
  if (pathname.startsWith("/dashboard/countries/") && pathname !== "/dashboard/countries") {
    displayTitle = "Country Profile";
    displaySubtitle = "Detailed indicators and Agenda 2063 scorecard";
  }
  if (pathname.startsWith("/dashboard/agenda-2063/") && pathname !== "/dashboard/agenda-2063") {
    displayTitle = "Goal Detail";
    displaySubtitle = "Indicators, regional breakdown, and insights";
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AU";

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-au-dark">{displayTitle}</h2>
            <p className="text-sm text-muted-foreground">{displaySubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile?.role && (
            <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">
              {profile.role}
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-au-green text-white text-xs">{initials}</AvatarFallback>
                </Avatar>
                {profile?.full_name && (
                  <span className="text-sm text-au-dark hidden md:inline">{profile.full_name}</span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {profile?.email || "Not signed in"}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
