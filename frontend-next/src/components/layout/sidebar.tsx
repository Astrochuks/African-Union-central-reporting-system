"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Target,
  Scale,
  Lightbulb,
  Globe,
  Settings,
  FileText,
  MessageSquare,
  ClipboardCheck,
  ShieldCheck,
  FormInput,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  admin?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
      { label: "Agenda 2063", href: "/dashboard/agenda-2063", icon: Target },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Gender & Youth", href: "/dashboard/gender-youth", icon: Scale },
      { label: "Insights Engine", href: "/dashboard/insights", icon: Lightbulb },
      { label: "Member States", href: "/dashboard/countries", icon: Globe },
      { label: "M&E Framework", href: "/dashboard/me-framework", icon: ClipboardCheck },
      { label: "Data Quality", href: "/dashboard/data-quality", icon: ShieldCheck },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Data Pipeline", href: "/dashboard/pipeline", icon: Settings },
      { label: "Data Entry", href: "/dashboard/data-entry", icon: FormInput },
      { label: "Reports", href: "/dashboard/reports", icon: FileText },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "AI Assistant", href: "/dashboard/chat", icon: MessageSquare },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "User Guide", href: "/dashboard/guide", icon: HelpCircle },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-au-dark text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <Image src="/au-logo.png" alt="African Union" width={40} height={40} className="flex-shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-au-gold truncate">AU Central Reporting</h1>
            <p className="text-[10px] text-white/50">Data Intelligence Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5",
                    isActive
                      ? "bg-au-gold/15 text-au-gold border-l-2 border-au-gold"
                      : "text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-3">
        {!collapsed && (
          <p className="text-[10px] text-white/30 text-center">
            African Union Commission
            <br />
            Agenda 2063 Monitoring
          </p>
        )}
      </div>
    </aside>
  );
}
