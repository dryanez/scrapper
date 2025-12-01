import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import {
  MapPin,
  Users,
  Briefcase,
  Mail,
  Globe,
  Building2,
  Database,
  ChevronRight,
  Activity,
  TrendingUp
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: MapPin,
    description: "Jobs & matches"
  },
  {
    title: "Hospitals",
    url: createPageUrl("Hospitals"),
    icon: Building2,
    description: "Manage hospitals"
  },
  {
    title: "Doctors",
    url: createPageUrl("Doctors"),
    icon: Users,
    description: "Manage profiles"
  },
  {
    title: "Applications",
    url: createPageUrl("Applications"),
    icon: Mail,
    description: "Application tracking"
  },
  {
    title: "Job Database",
    url: createPageUrl("JobDatabase"),
    icon: Database,
    description: "Manage all jobs"
  },
  {
    title: "Scraping",
    url: createPageUrl("Scraping"),
    icon: Globe,
    description: "Manage URLs"
  }
];

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };

  const iconBg = {
    cyan: 'bg-cyan-500/20 text-cyan-400',
    orange: 'bg-orange-500/20 text-orange-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    violet: 'bg-violet-500/20 text-violet-400',
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-default ${colorClasses[color]}`}>
      <div className={`p-2 rounded-lg ${iconBg[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
        <div className="text-lg font-bold text-foreground flex items-center gap-1">
          {value.toLocaleString()}
          {value > 0 && <TrendingUp className="w-3 h-3 text-emerald-400" />}
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = React.useState(null);
  const [stats, setStats] = React.useState({
    activeDoctors: 0,
    openPositions: 0,
    applicationsSent: 0,
    totalHospitals: 0,
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        // User not logged in
      }
    };
    fetchUser();
  }, []);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const { Doctor } = await import('@/api/entities');
        const { Job } = await import('@/api/entities');
        const { Application } = await import('@/api/entities');
        const { Hospital } = await import('@/api/entities');

        const [doctors, jobs, applications, hospitals] = await Promise.all([
          Doctor.list("-updated_date", 1000).catch(() => []),
          Job.filter({ isActive: true }, "-created_date", 1000).catch(() => []),
          Application.list("-appliedAt", 1000).catch(() => []),
          Hospital.list().catch(() => []),
        ]);

        setStats({
          activeDoctors: doctors.length,
          openPositions: jobs.length,
          applicationsSent: applications.length,
          totalHospitals: hospitals.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border/50 bg-sidebar">
          <SidebarHeader className="border-b border-border/50 p-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="https://www.vhr-referenten.de/images/61385cba3b8ef45deec38604_logo.png" 
                  alt="VHR Logo" 
                  className="h-10 w-auto"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Medical</span>
                <span className="text-lg font-bold text-foreground">Recruiting Platform</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item, index) => {
                    const isActive = location.pathname === item.url;
                    const activeClass = isActive 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'hover:bg-secondary/80 text-muted-foreground hover:text-foreground';
                    const iconClass = isActive 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-secondary/50 text-muted-foreground group-hover:bg-secondary group-hover:text-foreground';
                    const textClass = isActive ? 'text-primary' : '';
                    const chevronClass = isActive ? 'text-primary opacity-100' : 'opacity-0 group-hover:opacity-50';
                    
                    return (
                      <SidebarMenuItem 
                        key={item.title} 
                        className="animate-slide-in-left" 
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <SidebarMenuButton
                          asChild
                          className={`group relative overflow-hidden rounded-xl px-3 py-3 transition-all duration-300 ${activeClass}`}
                        >
                          <Link to={item.url} className="flex items-center gap-3">
                            {isActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                            )}
                            <div className={`p-2 rounded-lg transition-all duration-300 ${iconClass}`}>
                              <item.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${textClass}`}>{item.title}</div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {item.description}
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-all duration-300 ${chevronClass}`} />
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-3 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Live Stats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-2 py-2 space-y-2">
                  <StatCard icon={Users} label="Active Doctors" value={stats.activeDoctors} color="cyan" />
                  <StatCard icon={Building2} label="Total Hospitals" value={stats.totalHospitals} color="orange" />
                  <StatCard icon={Briefcase} label="Open Positions" value={stats.openPositions} color="emerald" />
                  <StatCard icon={Mail} label="Applications" value={stats.applicationsSent} color="violet" />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/50 p-4">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-secondary/30 transition-all duration-300 hover:bg-secondary/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-bold text-sm">
                  {currentUser?.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">
                  {currentUser?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentUser?.email || 'Loading...'}
                </p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-secondary p-2 rounded-lg transition-all duration-200" />
              <img 
                src="https://www.vhr-referenten.de/images/61385cba3b8ef45deec38604_logo.png" 
                alt="VHR Logo" 
                className="h-8 w-auto"
              />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
