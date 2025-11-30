import React, { useState, useEffect, useCallback } from "react";
import { Application } from "@/api/entities";
import { Doctor } from "@/api/entities";
import { Job } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, FileClock, Search, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getAnimalAvatar } from "../components/utils/AvatarGenerator";

export default function ActiveCandidates() {
  const [activeCandidates, setActiveCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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
      const activeApplications = applicationsData.filter(app => activeStatuses.includes(app.status));
      
      const activeDoctorIds = [...new Set(activeApplications.map(app => app.doctorId))];
      const candidates = activeDoctorIds.map(doctorId => {
        const doctor = doctorsData.find(d => d.id === doctorId);
        const apps = activeApplications
          .filter(app => app.doctorId === doctorId)
          .map(app => ({
            ...app,
            job: jobsData.find(j => j.id === app.jobId)
          }))
          .filter(app => app.job)
          .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
        
        return { doctor, applications: apps };
      })
      .filter(c => c.doctor && c.applications.length > 0)
      .sort((a, b) => b.applications.length - a.applications.length); // Most applications first

      setActiveCandidates(candidates);
    } catch (error) {
      console.error("Error loading active candidates:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCandidates = activeCandidates.filter(candidate =>
    !searchTerm ||
    `${candidate.doctor.firstName} ${candidate.doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.applications.some(app => 
      app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job.hospitalName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPLIED': return 'bg-slate-100 text-slate-800';
      case 'INTERVIEWING': return 'bg-blue-100 text-blue-800';
      case 'OFFERED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <h1 className="text-3xl font-bold text-blue-600 mb-2 flex items-center gap-3">
              <FileClock className="w-8 h-8" />
              Active Candidates
            </h1>
            <p className="text-slate-600">Doctors with ongoing applications in the hiring pipeline</p>
            <p className="text-sm text-slate-500 mt-1">{filteredCandidates.length} candidates active</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search candidates or positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-32 bg-slate-100" />
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <Card className="p-12 text-center">
            <FileClock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm ? 'No matching candidates found' : 'No active candidates'}
            </h3>
            <p className="text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Start applying candidates to positions to see them here'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredCandidates.map(({ doctor, applications }) => (
              <Card key={doctor.id} className="border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={doctor.photoUrl || getAnimalAvatar(doctor.id, `${doctor.firstName} ${doctor.lastName}`)} />
                      <AvatarFallback className="text-lg">{doctor.firstName[0]}{doctor.lastName[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <Link to={createPageUrl(`DoctorDetail?id=${doctor.id}`)} className="text-xl font-semibold text-blue-700 hover:underline">
                            {doctor.firstName} {doctor.lastName}
                          </Link>
                          <div className="text-slate-600 mt-1">
                            {doctor.specialties?.join(', ') || 'No specialties listed'}
                            {doctor.experienceYears && <span> • {doctor.experienceYears} years experience</span>}
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          {applications.length} Active Application{applications.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {applications.map(app => (
                          <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex-1">
                              <Link to={createPageUrl(`JobDetails?id=${app.jobId}`)} className="font-medium text-slate-900 hover:text-blue-600">
                                {app.job.title}
                              </Link>
                              <div className="text-sm text-slate-600">
                                {app.job.hospitalName} • {app.job.city}
                              </div>
                              {app.notes && (
                                <div className="text-xs text-slate-500 mt-1">Note: {app.notes}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(app.status)}>
                                {app.status}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(app.updated_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Link to={createPageUrl(`DoctorDetail?id=${doctor.id}`)}>
                          <Button size="sm" variant="outline">
                            View Profile
                          </Button>
                        </Link>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Briefcase className="w-4 h-4 mr-1" />
                          Find More Jobs
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}