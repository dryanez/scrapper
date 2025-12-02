import React, { useState, useEffect, useCallback } from "react";
import { Application } from "@/api/entities";
import { Doctor } from "@/api/entities";
import { Job } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, BellRing, Search, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { subDays, formatDistanceToNow } from "date-fns";
import { getAnimalAvatar } from "../components/utils/AvatarGenerator";
import ApplicationStatusDialog from "../components/applications/ApplicationStatusDialog";

export default function FollowUpNeeded() {
  const [staleApplications, setStaleApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [applicationsData, doctorsData, jobsData] = await Promise.all([
        Application.list("-updated_date", 1000),
        Doctor.list("-updated_date", 1000),
        Job.filter({ isActive: true }, "-created_date", 1000)
      ]);

      const activeStatuses = ['APPLIED', 'INTERVIEWING', 'OFFERED'];
      const sevenDaysAgo = subDays(new Date(), 7);

      const stale = applicationsData
        .filter(app => activeStatuses.includes(app.status) && new Date(app.updated_date) < sevenDaysAgo)
        .map(app => ({
          ...app,
          doctor: doctorsData.find(d => d.id === app.doctorId),
          job: jobsData.find(j => j.id === app.jobId)
        }))
        .filter(app => app.doctor && app.job)
        .sort((a, b) => new Date(a.updated_date) - new Date(b.updated_date)); // Oldest first

      setStaleApplications(stale);
    } catch (error) {
      console.error("Error loading stale applications:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusUpdate = () => {
    setIsStatusDialogOpen(false);
    setSelectedApplication(null);
    loadData();
  };

  const filteredApplications = staleApplications.filter(app =>
    !searchTerm ||
    `${app.doctor.firstName} ${app.doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.job.hospitalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const daysSinceUpdate = (updatedDate) => {
    return Math.floor((new Date() - new Date(updatedDate)) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl("Doctors")} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Action Center
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-orange-600 mb-2 flex items-center gap-3">
              <BellRing className="w-8 h-8" />
              Follow-Up Needed
            </h1>
            <p className="text-slate-600">Applications that haven't been updated in over 7 days</p>
            <p className="text-sm text-slate-500 mt-1">{filteredApplications.length} applications need attention</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search doctors, positions, or hospitals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-24 bg-slate-100" />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <Card className="p-12 text-center">
            <BellRing className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm ? 'No matching applications found' : 'All applications are up-to-date!'}
            </h3>
            <p className="text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Great job staying on top of your candidates'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.map(app => {
              const doctorFirstName = app.doctor?.firstName || app.doctor?.first_name || '';
              const doctorLastName = app.doctor?.lastName || app.doctor?.last_name || '';
              const photoUrl = app.doctor?.photoUrl || app.doctor?.photo_url || '';
              const updatedDate = app.updated_date || app.updated_at;
              const lastUpdate = updatedDate ? new Date(updatedDate) : null;
              const isValidDate = lastUpdate && !isNaN(lastUpdate.getTime());
              const jobHospitalName = app.job?.hospitalName || app.job?.hospital_name || '';
              const jobCity = app.job?.city || '';
              
              return (
                <Card key={app.id} className="hover:shadow-md transition-shadow cursor-pointer border-orange-200"
                  onClick={() => {
                    setSelectedApplication({ ...app, type: 'manual' });
                    setIsStatusDialogOpen(true);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={photoUrl || getAnimalAvatar(app.doctor?.id, `${doctorFirstName} ${doctorLastName}`)} />
                        <AvatarFallback>{doctorFirstName[0] || '?'}{doctorLastName[0] || '?'}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-lg text-slate-900">
                            {doctorFirstName} {doctorLastName} → {app.job?.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              {app.status}
                            </Badge>
                            <Badge variant="outline" className={`${daysSinceUpdate(updatedDate) > 14 ? 'border-red-300 text-red-700' : 'border-orange-300 text-orange-700'}`}>
                              {daysSinceUpdate(updatedDate)} days ago
                            </Badge>
                          </div>
                        </div>

                        <div className="text-slate-600 mb-3">
                          <div className="font-medium">{jobHospitalName}</div>
                          <div className="text-sm">{jobCity}</div>
                        </div>

                        {isValidDate && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="w-4 h-4" />
                            <span>Last updated: {formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
                          </div>
                        )}

                        {app.notes && (
                          <div className="mt-3 p-2 bg-slate-50 rounded text-sm text-slate-700">
                            <strong>Note:</strong> {app.notes}
                          </div>
                        )}

                        <div className="mt-4">
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            Update Status
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {selectedApplication && (
          <ApplicationStatusDialog
            application={selectedApplication}
            doctor={selectedApplication.doctor}
            open={isStatusDialogOpen}
            onOpenChange={setIsStatusDialogOpen}
            onSuccess={handleStatusUpdate}
          />
        )}
      </div>
    </div>
  );
}