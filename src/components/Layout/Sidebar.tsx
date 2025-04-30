
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LineChart,
  Users,
  Image,
  Settings,
  Menu,
  ChevronLeft,
  LightbulbIcon,
  TargetIcon,
  MonitorIcon,
  Gauge
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

function SidebarItem({ icon: Icon, label, active, onClick, collapsed }: SidebarItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 text-left",
        active ? "bg-brand/10 font-medium text-brand" : "text-sidebar-foreground/70",
        collapsed ? "justify-center px-2" : ""
      )}
      onClick={onClick}
    >
      <Icon className={cn("h-5 w-5", active ? "text-brand" : "text-sidebar-foreground/70")} />
      {!collapsed && <span>{label}</span>}
    </Button>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex justify-between items-center">
        {!collapsed && <h2 className="text-lg font-semibold text-sidebar-foreground">Navigation</h2>}
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground/70"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu /> : <ChevronLeft />}
        </Button>
      </div>

      <div className="p-2 flex-1 space-y-1">
        <SidebarItem
          icon={LayoutDashboard}
          label="Dashboard"
          active={activeItem === "dashboard"}
          onClick={() => setActiveItem("dashboard")}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={LineChart}
          label="Campaign Analytics"
          active={activeItem === "analytics"}
          onClick={() => setActiveItem("analytics")}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={Image}
          label="Creative Library"
          active={activeItem === "creative"}
          onClick={() => setActiveItem("creative")}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={TargetIcon}
          label="Audience Insights"
          active={activeItem === "audience"}
          onClick={() => setActiveItem("audience")}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={LightbulbIcon}
          label="AI Insights"
          active={activeItem === "insights"}
          onClick={() => setActiveItem("insights")}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={MonitorIcon}
          label="Monitoring"
          active={activeItem === "monitoring"}
          onClick={() => setActiveItem("monitoring")}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={Gauge}
          label="Performance Tools"
          active={activeItem === "tools"}
          onClick={() => setActiveItem("tools")}
          collapsed={collapsed}
        />
      </div>

      <div className="p-2 border-t border-sidebar-border">
        <SidebarItem
          icon={Users}
          label="Team Access"
          active={activeItem === "team"}
          onClick={() => setActiveItem("team")}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={Settings}
          label="Settings"
          active={activeItem === "settings"}
          onClick={() => setActiveItem("settings")}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
