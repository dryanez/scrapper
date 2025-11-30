

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import {
  Heart,
  MapPin,
  Users,
  Briefcase,
  Mail,
  Settings,
  Search,
  Globe,
  Building2,
  FlaskConical // Added FlaskConical icon
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
    title: "Scraping",
    url: createPageUrl("Scraping"),
    icon: Globe,
    description: "Manage URLs"
  },
  {
    title: "Email Settings",
    url: createPageUrl("EmailSettings"),
    icon: Settings,
    description: "Configure Resend"
  },
  { // New navigation item added
    title: "AMEOS Scraper",
    url: createPageUrl("AmeosScraper"),
    icon: FlaskConical,
    description: "Specialized Agent"
  }
];

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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Custom Sidebar */}
        <Sidebar className="border-r border-slate-200/60 backdrop-blur-sm bg-white/95">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">MedMatch</h2>
                <p className="text-sm text-slate-500">Medical Recruiting Platform</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`group hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl px-3 py-3 ${
                          location.pathname === item.url ? 'bg-blue-50 text-blue-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                          <div className="flex-1">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-slate-500 group-hover:text-blue-600">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-3">
                Quick Stats
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-2 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-600">Active Doctors</div>
                      <div className="font-semibold text-slate-900">{stats.activeDoctors}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-600">Total Hospitals</div>
                      <div className="font-semibold text-slate-900">{stats.totalHospitals}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-600">Open Positions</div>
                      <div className="font-semibold text-slate-900">{stats.openPositions}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-slate-600">Applications Sent</div>
                      <div className="font-semibold text-slate-900">{stats.applicationsSent}</div>
                    </div>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/60 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {currentUser?.full_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">
                  {currentUser?.full_name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser?.email || 'Loading...'}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main content area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-slate-900">MedMatch</h1>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

