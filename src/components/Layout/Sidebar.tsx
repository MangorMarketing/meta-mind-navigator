
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Gauge,
  Settings,
  ImageIcon,
  ChevronRight,
  Sparkles,
  MessagesSquare,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const [navOpen, setNavOpen] = useState({
    campaigns: false,
    insights: false,
  });

  const handleNavToggle = (section: keyof typeof navOpen) => {
    setNavOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Gauge className="h-4 w-4" />,
    },
    {
      title: "Campaign Analytics",
      href: "/campaign-analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      badge: "New",
    },
    {
      title: "Creative Library",
      href: "/creative-library",
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      title: "AI Tools",
      section: "insights",
      icon: <BrainCircuit className="h-4 w-4" />,
      children: [
        {
          title: "AI Insights",
          href: "/insights",
          icon: <Sparkles className="h-4 w-4" />,
        },
        {
          title: "AI Analysis",
          href: "/ai-chat",
          icon: <MessagesSquare className="h-4 w-4" />,
          badge: "New",
        },
      ],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="py-2 w-64 bg-background border-r h-[calc(100vh-3.5rem)]">
      <nav className="space-y-0.5 px-2">
        {navItems.map((item, i) => {
          if (item.children) {
            return (
              <div key={i}>
                <button
                  onClick={() => handleNavToggle(item.section as keyof typeof navOpen)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      navOpen[item.section as keyof typeof navOpen] ? "rotate-90" : ""
                    )}
                  />
                </button>
                {navOpen[item.section as keyof typeof navOpen] && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child, j) => {
                      const isActive = location.pathname === child.href;
                      return (
                        <div key={j} className="relative">
                          <Link to={child.href}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              size="sm"
                              className="w-full justify-start"
                            >
                              {child.icon}
                              <span className="ml-2">{child.title}</span>
                            </Button>
                          </Link>
                          {child.badge && (
                            <span className="absolute top-1 right-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] leading-none text-white">
                              {child.badge}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          } else {
            const isActive = location.pathname === item.href;
            return (
              <div key={i} className="relative">
                <Link to={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                  >
                    {item.icon}
                    <span className="ml-2">{item.title}</span>
                  </Button>
                </Link>
                {item.badge && (
                  <span className="absolute top-1 right-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] leading-none text-white">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }
        })}
      </nav>

      <Separator className="my-4" />

      <div className="px-4">
        <p className="text-xs text-muted-foreground mb-2">Signed in as:</p>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="truncate text-sm font-medium">{user?.email}</div>
        </div>
      </div>
    </div>
  );
}
