
import React, { useState, useEffect, useCallback } from "react";
import { EmailLog } from "@/api/entities";
import { Application } from "@/api/entities";
import { Doctor } from "@/api/entities";
import { Job } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, CheckCircle, XCircle, Clock, Search, Calendar, TrendingUp, Users, Building2, Target, Edit, FilePenLine } from "lucide-react";
import { format, formatDistanceToNow, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getAnimalAvatar } from "../components/utils/AvatarGenerator";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ApplicationStatusDialog from "../components/applications/ApplicationStatusDialog";

export default function ApplicationsPage() {
  const [allApplications, setAllApplications] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    interviewing: 0,
    successRate: 0,
  });

  // Check URL params for doctorId filter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const doctorIdParam = urlParams.get('doctorId');
    if (doctorIdParam) {
      setDoctorFilter(doctorIdParam);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [emailData, applicationData, doctorData, jobData] = await Promise.all([
        EmailLog.list("-created_date", 500),
        Application.list("-appliedAt", 500),
        Doctor.list("-updated_date", 500),
        Job.list("-created_date", 1000)
      ]);
      
      const mappedEmails = emailData.map(e => {
        const createdDate = e.created_date || e.createdDate || e.created_at;
        const emailDate = createdDate ? new Date(createdDate) : null;
        const job = jobData.find(j => j.id === e.jobId);
        const doctorId = e.doctorId || e.doctor_id;
        const jobId = e.jobId || e.job_id;
        
        // Check if there's an Application record for this email (with updated status)
        const linkedApp = applicationData.find(a => 
          (a.doctorId || a.doctor_id) === doctorId && 
          (a.jobId || a.job_id) === jobId
        );
        
        return {
          id: e.id,
          type: 'email',
          doctorId: doctorId,
          jobId: jobId,
          // Use linked application status if exists, otherwise use email status
          status: linkedApp?.status || e.status,
          date: emailDate && !isNaN(emailDate.getTime()) ? emailDate : new Date(),
          details: { subject: e.subject, to: e.toEmail || e.to_email, notes: linkedApp?.notes },
          errorMessage: e.errorMessage || e.error_message,
          jobTitle: job?.title,
          hospitalName: job?.hospitalName || job?.hospital_name,
          linkedApplicationId: linkedApp?.id, // Track the linked application
        };
      });

      // Get IDs of applications that are already linked to emails
      const linkedAppIds = new Set(
        mappedEmails
          .filter(e => e.linkedApplicationId)
          .map(e => e.linkedApplicationId)
      );

      const mappedManualApps = applicationData
        // Filter out applications that are already linked to emails
        .filter(a => !linkedAppIds.has(a.id))
        .map(a => {
          const appliedAt = a.appliedAt || a.applied_at || a.created_at;
          const appDate = appliedAt ? new Date(appliedAt) : null;
          const job = jobData.find(j => j.id === (a.jobId || a.job_id));
          return {
            id: a.id,
            type: 'manual',
            doctorId: a.doctorId || a.doctor_id,
            jobId: a.jobId || a.job_id,
            status: a.status,
            date: appDate && !isNaN(appDate.getTime()) ? appDate : new Date(),
            details: { notes: a.notes },
            jobTitle: job?.title || 'Unknown Position',
            hospitalName: job?.hospitalName || job?.hospital_name || 'Unknown Hospital',
          };
        });

      const combinedData = [...mappedEmails, ...mappedManualApps].sort((a, b) => b.date - a.date);
      
      setAllApplications(combinedData);
      setDoctors(doctorData);
      setJobs(jobData);

      // Calculate stats
      const thisMonthStart = startOfMonth(new Date());
      const thisMonthEnd = endOfMonth(new Date());
      
      const sentEmails = mappedEmails.filter(e => e.status === 'SENT').length;
      const totalEmails = mappedEmails.length;

      setStats({
        total: combinedData.length,
        thisMonth: combinedData.filter(a => a.date >= thisMonthStart && a.date <= thisMonthEnd).length,
        interviewing: combinedData.filter(a => a.status === 'INTERVIEWING').length,
        successRate: totalEmails > 0 ? Math.round((sentEmails / totalEmails) * 100) : 0
      });

    } catch (error) {
      console.error("Error loading application data:", error);
    }
    setIsLoading(false);
  }, []);

  const handleApplicationClick = (app) => {
    // Only allow status updates for non-failed or queued email applications
    // Manual applications can always be updated.
    if (app.type === 'email' && (app.status === 'FAILED' || app.status === 'QUEUED')) {
      return; 
    }
    
    setSelectedApplication(app);
    setIsStatusDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    setIsStatusDialogOpen(false);
    setSelectedApplication(null);
    loadData(); // Reload data to show updated status
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDoctor = (doctorId) => doctors.find(d => d.id === doctorId);

  const filteredApplications = allApplications.filter(app => {
    const doctor = getDoctor(app.doctorId);
    const firstName = doctor?.firstName || doctor?.first_name || '';
    const lastName = doctor?.lastName || doctor?.last_name || '';
    
    const matchesSearch = !searchTerm || 
      `${firstName} ${lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.jobTitle && app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.hospitalName && app.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    const matchesDoctor = doctorFilter === "all" || app.doctorId === doctorFilter;
    
    const appDate = app.date;
    const matchesTime = timeFilter === "all" ||
      (timeFilter === "week" && appDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (timeFilter === "month" && appDate >= startOfMonth(new Date()));
    
    return matchesSearch && matchesStatus && matchesTime && matchesDoctor;
  });

  // Get unique doctors from applications for the filter dropdown
  const doctorsWithApplications = doctors.filter(d => 
    allApplications.some(app => app.doctorId === d.id)
  ).map(d => ({
    id: d.id,
    name: `${d.firstName || d.first_name || ''} ${d.lastName || d.last_name || ''}`.trim()
  })).sort((a, b) => a.name.localeCompare(b.name));

  const getStatusInfo = (app) => {
    const commonStatuses = {
      // Email statuses
      SENT: { icon: <CheckCircle className="w-4 h-4 text-green-600" />, badge: "bg-green-100 text-green-800" },
      FAILED: { icon: <XCircle className="w-4 h-4 text-red-600" />, badge: "bg-red-100 text-red-800" },
      QUEUED: { icon: <Clock className="w-4 h-4 text-yellow-600" />, badge: "bg-yellow-100 text-yellow-800" },
      // Manual/Trackable statuses
      APPLIED: { icon: <FilePenLine className="w-4 h-4 text-slate-600" />, badge: "bg-slate-100 text-slate-800" },
      INTERVIEWING: { icon: <Users className="w-4 h-4 text-blue-600" />, badge: "bg-blue-100 text-blue-800" },
      OFFERED: { icon: <Target className="w-4 h-4 text-purple-600" />, badge: "bg-purple-100 text-purple-800" },
      REJECTED: { icon: <XCircle className="w-4 h-4 text-gray-500" />, badge: "bg-gray-100 text-gray-700" },
      HIRED: { icon: <CheckCircle className="w-4 h-4 text-green-600" />, badge: "bg-green-100 text-green-800" },
      WITHDRAWN: { icon: <XCircle className="w-4 h-4 text-red-600" />, badge: "bg-red-100 text-red-800" },
    };
    return commonStatuses[app.status] || { icon: <Clock className="w-4 h-4" />, badge: "bg-gray-200" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Applications</h1>
            <p className="text-slate-600">Track all your referral emails and manually logged applications</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><Mail className="w-6 h-6 text-blue-600" /></div><div><div className="text-sm text-slate-600">Total Applications</div><div className="text-2xl font-bold text-slate-900">{stats.total}</div></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-600" /></div><div><div className="text-sm text-slate-600">Email Success Rate</div><div className="text-2xl font-bold text-slate-900">{stats.successRate}%</div></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center"><TrendingUp className="w-6 h-6 text-purple-600" /></div><div><div className="text-sm text-slate-600">This Month</div><div className="text-2xl font-bold text-slate-900">{stats.thisMonth}</div></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-orange-600" /></div><div><div className="text-sm text-slate-600">Interviewing</div><div className="text-2xl font-bold text-slate-900">{stats.interviewing}</div></div></div></CardContent></Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input placeholder="Search by doctor, job title, or hospital..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Filter by Doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctorsWithApplications.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name || 'Unknown'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
                  <SelectItem value="OFFERED">Offered</SelectItem>
                  <SelectItem value="HIRED">Hired</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="QUEUED">Queued</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {doctorFilter !== "all" && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  Showing applications for: <strong>{doctorsWithApplications.find(d => d.id === doctorFilter)?.name || 'Selected Doctor'}</strong>
                </span>
                <button 
                  onClick={() => setDoctorFilter("all")} 
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Card key={i} className="animate-pulse h-28" />)
          ) : filteredApplications.length === 0 ? (
            <Card className="p-12 text-center"><Mail className="w-16 h-16 text-slate-400 mx-auto mb-4" /><h3 className="text-lg font-semibold text-slate-900 mb-2">No applications found</h3><p className="text-slate-500">Start sending referral emails or logging applications to see them here</p></Card>
          ) : (
            filteredApplications.map((app) => {
              const doctor = getDoctor(app.doctorId);
              const firstName = doctor?.firstName || doctor?.first_name || '';
              const lastName = doctor?.lastName || doctor?.last_name || '';
              const photoUrl = doctor?.photoUrl || doctor?.photo_url || '';
              const statusInfo = getStatusInfo(app);
              const isClickable = !(app.type === 'email' && (app.status === 'FAILED' || app.status === 'QUEUED'));
              const isValidDate = app.date && !isNaN(app.date.getTime());
              
              return (
                <Card 
                  key={app.id} 
                  className={`transition-shadow ${isClickable ? 'hover:shadow-md cursor-pointer' : ''}`}
                  onClick={isClickable ? () => handleApplicationClick(app) : undefined}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 flex-shrink-0"><AvatarImage src={photoUrl || getAnimalAvatar(app.doctorId, `${firstName} ${lastName}`)} /><AvatarFallback>{firstName[0] || '?'}{lastName[0] || '?'}</AvatarFallback></Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {statusInfo.icon}
                          <Badge className={statusInfo.badge}>{app.status}</Badge>
                          {isValidDate && <span className="text-sm text-slate-500">{formatDistanceToNow(app.date, { addSuffix: true })}</span>}
                          <Badge variant="outline" className="flex items-center gap-1">{app.type === 'email' ? <Mail className="w-3 h-3" /> : <Edit className="w-3 h-3" />} {app.type}</Badge>
                          {isClickable && <span className="text-xs text-slate-400">Click to update status</span>}
                        </div>
                        
                        <h4 className="font-semibold text-slate-900 mb-2">
                           <Link to={createPageUrl(`DoctorDetail?id=${app.doctorId}`)} className="text-blue-700 hover:underline" onClick={(e) => e.stopPropagation()}>{firstName || lastName ? `${firstName} ${lastName}` : 'Unknown Doctor'}</Link> → <Link to={createPageUrl(`JobDetails?id=${app.jobId}`)} className="text-blue-700 hover:underline" onClick={(e) => e.stopPropagation()}>{app.jobTitle || 'Unknown Position'}</Link>
                        </h4>
                        
                        <div className="text-sm text-slate-600 mb-1">
                          <span className="font-medium">{app.hospitalName || 'Unknown Hospital'}</span>
                        </div>
                        
                        {app.type === 'email' && (
                          <div className="text-sm">
                            <div className="font-medium truncate">{app.details.subject}</div>
                            <div className="text-slate-500">To: {app.details.to}</div>
                            {app.details.notes && (
                              <div className="mt-2 p-2 bg-slate-50 border rounded-md text-sm text-slate-700">
                                Note: {app.details.notes}
                              </div>
                            )}
                          </div>
                        )}

                        {app.type === 'manual' && app.details.notes && (
                          <div className="mt-2 p-2 bg-slate-50 border rounded-md text-sm text-slate-700">
                            Note: {app.details.notes}
                          </div>
                        )}
                        
                        {app.errorMessage && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            Error: {app.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Status Update Dialog */}
        {selectedApplication && (
          <ApplicationStatusDialog
            application={selectedApplication}
            doctor={getDoctor(selectedApplication.doctorId)}
            open={isStatusDialogOpen}
            onOpenChange={setIsStatusDialogOpen}
            onSuccess={handleStatusUpdate}
          />
        )}
      </div>
    </div>
  );
}
