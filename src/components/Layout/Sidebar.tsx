import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LineChart,
  Image,
  Settings,
  Menu,
  ChevronLeft,
  LightbulbIcon,
  Users,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
  active?: boolean;
  collapsed?: boolean;
}

function SidebarItem({ icon: Icon, label, to, active, collapsed }: SidebarItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 text-left",
        active ? "bg-brand/10 font-medium text-brand" : "text-sidebar-foreground/70",
        collapsed ? "justify-center px-2" : ""
      )}
      asChild
    >
      <Link to={to}>
        <Icon className={cn("h-5 w-5", active ? "text-brand" : "text-sidebar-foreground/70")} />
        {!collapsed && <span>{label}</span>}
      </Link>
    </Button>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
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
          to="/"
          active={location.pathname === "/"}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={LineChart}
          label="Campaign Analytics"
          to="/analytics"
          active={location.pathname === "/analytics"}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={Image}
          label="Creative Library"
          to="/creative-library"
          active={location.pathname === "/creative-library"}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={LightbulbIcon}
          label="AI Insights"
          to="/insights"
          active={location.pathname === "/insights"}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={FileText}
          label="Reports"
          to="/reports"
          active={location.pathname === "/reports"}
          collapsed={collapsed}
        />
      </div>

      <div className="p-2 border-t border-sidebar-border">
        <SidebarItem
          icon={Users}
          label="Team Access"
          to="/team"
          active={location.pathname === "/team"}
          collapsed={collapsed}
        />
        <SidebarItem
          icon={Settings}
          label="Settings"
          to="/settings"
          active={location.pathname === "/settings"}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
