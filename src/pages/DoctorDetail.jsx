
import React, { useState, useEffect, useCallback } from "react";
import { Doctor } from "@/api/entities";
import { Job } from "@/api/entities";
import { Application } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, MapPin, Globe, Briefcase, Star, FileText, Building2, CheckCircle, Clock, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, formatDistanceToNow } from "date-fns";
import { getAnimalAvatar } from "../components/utils/AvatarGenerator";
import { findMatchingJobs, GERMAN_STATES } from "@/utils/matchingAlgorithm";

import DoctorEditDialog from "../components/doctors/DoctorEditDialog";

const workPermitStyles = {
  EU_CITIZEN: "bg-green-100 text-green-800 border-green-200",
  WORK_PERMIT: "bg-blue-100 text-blue-800 border-blue-200",
  VISA_REQUIRED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PENDING: "bg-slate-100 text-slate-800 border-slate-200"
};

export default function DoctorDetail() {
  const [doctor, setDoctor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const calculateTopMatches = useCallback((doc, jobs) => {
    // Use centralized matching algorithm
    const matches = findMatchingJobs(doc, jobs, 35);
    setTopMatches(matches);
  }, []);

  const loadData = useCallback(async (doctorId) => {
    setIsLoading(true);
    try {
      // Load doctor data first
      const doctorData = await Doctor.filter({ id: doctorId });
      const currentDoctor = doctorData[0];
      setDoctor(currentDoctor);

      if (!currentDoctor) {
        setIsLoading(false);
        return;
      }

      // Load applications and jobs with error handling
      const [applicationsData, allJobs] = await Promise.all([
        Application.filter({ doctorId }, "-appliedAt").catch(() => {
          console.warn("Could not load applications. Entity might not exist.");
          return [];
        }),
        Job.filter({ isActive: true }, "-created_date", 200).catch(() => {
          console.warn("Could not load jobs.");
          return [];
        })
      ]);

      setApplications(applicationsData);
      
      if (allJobs.length > 0) {
        calculateTopMatches(currentDoctor, allJobs);
      }

    } catch (error) {
      console.error("Error loading doctor details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateTopMatches]);

  const handleDoctorUpdate = async (updatedData) => {
    try {
      if (!doctor || !doctor.id) {
        console.error("Doctor object or ID is missing, cannot update.");
        return;
      }
      await Doctor.update(doctor.id, updatedData);
      const newDoctorState = { ...doctor, ...updatedData };
      setDoctor(newDoctorState);
      setIsEditDialogOpen(false);
      
      // Recalculate matches with updated data
      const allJobs = await Job.filter({ isActive: true }, "-created_date", 200);
      calculateTopMatches(newDoctorState, allJobs);
      
    } catch (error) {
      console.error("Error updating doctor:", error);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('id');
    if (doctorId) {
      loadData(doctorId);
    } else {
      setIsLoading(false);
    }
  }, [loadData]);

  const getInitials = (firstName, lastName) => `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Doctor Not Found</h1>
        <Link to={createPageUrl("Doctors")}>
          <Button>Back to Doctors List</Button>
        </Link>
      </div>
    );
  }

  // Handle both camelCase and snake_case field names from Supabase
  const firstName = doctor.firstName || doctor.first_name || '';
  const lastName = doctor.lastName || doctor.last_name || '';
  const email = doctor.email || '';
  const phone = doctor.phone || '';
  const photoUrl = doctor.photoUrl || doctor.photo_url;
  const cvFileUrl = doctor.cvFileUrl || doctor.cv_file_url;
  const specialties = doctor.specialties || [];
  const experienceYears = doctor.experienceYears ?? doctor.experience_years ?? 0;
  const currentState = doctor.currentState || doctor.current_state;
  const desiredStates = doctor.desiredStates || doctor.desired_states || [];
  const languages = doctor.languages || [];
  const workPermitStatus = doctor.workPermitStatus || doctor.work_permit_status;
  const willingToRelocate = doctor.willingToRelocate ?? doctor.willing_to_relocate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl("Doctors")} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Doctors List
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Doctor Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={photoUrl || getAnimalAvatar(doctor.id, `${firstName} ${lastName}`)} 
                    alt={`${firstName} ${lastName}`} 
                  />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-3xl">
                    {getInitials(firstName, lastName)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{firstName} {lastName}</CardTitle>
                <p className="text-slate-500">{specialties?.[0]}</p>
                
                {/* Add Edit Button */}
                <div className="mt-4">
                  <Button
                    onClick={() => setIsEditDialogOpen(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-2 mb-4">
                  {email && (
                    <a href={`mailto:${email}`}>
                      <Button variant="outline" size="icon"><Mail className="w-4 h-4" /></Button>
                    </a>
                  )}
                  {phone && (
                    <a href={`tel:${phone}`}>
                      <Button variant="outline" size="icon"><Phone className="w-4 h-4" /></Button>
                    </a>
                  )}
                  {cvFileUrl && (
                    <a href={cvFileUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="icon"><FileText className="w-4 h-4" /></Button>
                    </a>
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  <div className="font-semibold text-slate-800">Key Information</div>
                  <div className="flex items-start gap-3"><Briefcase className="w-4 h-4 mt-0.5 text-slate-400" /><div><span className="font-medium">Experience:</span> {experienceYears} years</div></div>
                  <div className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-0.5 text-slate-400" /><div><span className="font-medium">Current State:</span> {GERMAN_STATES[currentState] || currentState || 'N/A'}</div></div>
                  <div className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-0.5 text-slate-400" /><div><span className="font-medium">Desired States:</span> {desiredStates?.length > 0 ? desiredStates.map(stateCode => GERMAN_STATES[stateCode] || stateCode).join(', ') : 'N/A'}</div></div>
                  <div className="flex items-start gap-3"><Globe className="w-4 h-4 mt-0.5 text-slate-400" /><div><span className="font-medium">Languages:</span> {languages?.length > 0 ? languages.join(', ') : 'N/A'}</div></div>
                  {workPermitStatus && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-slate-400" />
                      <Badge className={workPermitStyles[workPermitStatus]}>{workPermitStatus?.replace('_', ' ')}</Badge>
                    </div>
                  )}
                </div >
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Matches and Applications */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Top Job Matches</CardTitle>
              </CardHeader>
              <CardContent>
                {topMatches.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {topMatches.slice(0, 5).map(job => {
                        const jobHospitalName = job.hospitalName || job.hospital_name || '';
                        const jobCity = job.city || '';
                        return (
                          <div key={job.id} className="p-3 border rounded-lg flex justify-between items-center">
                            <div>
                              <Link to={createPageUrl(`JobDetails?id=${job.id}`)} className="font-semibold text-blue-700 hover:underline">{job.title}</Link>
                              <p className="text-sm text-slate-600">{jobHospitalName}{jobCity ? ` - ${jobCity}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-yellow-100 text-yellow-800">{job.matchScore}%</Badge>
                              <Link to={createPageUrl(`EmailComposer?doctorId=${doctor.id}&jobId=${job.id}`)}>
                                <Button size="sm">Apply</Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {topMatches.length > 5 && (
                      <div className="mt-4 text-center">
                        <Link to={createPageUrl(`DoctorMatches?id=${doctor.id}`)}>
                          <Button variant="outline" className="w-full">
                            Show All {topMatches.length} Matching Jobs
                          </Button>
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500">No suitable job matches found at the moment.</p>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600" /> Application History</CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.map(app => {
                      const appJobId = app.jobId || app.job_id;
                      const appJobTitle = app.jobTitle || app.job_title || 'Job Application';
                      const appHospitalName = app.hospitalName || app.hospital_name || '';
                      const appAppliedAt = app.appliedAt || app.applied_at || app.created_at;
                      const appliedDate = appAppliedAt ? new Date(appAppliedAt) : null;
                      const isValidDate = appliedDate && !isNaN(appliedDate.getTime());
                      
                      return (
                        <div key={app.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <Link to={createPageUrl(`JobDetails?id=${appJobId}`)} className="font-semibold text-blue-700 hover:underline">
                                {appJobTitle}
                              </Link>
                              <p className="text-sm text-slate-600 flex items-center gap-1"><Building2 className="w-3 h-3"/>{appHospitalName}</p>
                            </div>
                            <Badge variant={app.status === 'HIRED' ? 'default' : 'secondary'}>{app.status}</Badge>
                          </div>
                          {isValidDate && (
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1" title={appliedDate.toLocaleString()}>
                              <Clock className="w-3 h-3" />Applied {formatDistanceToNow(appliedDate, { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-slate-500">No applications recorded for this doctor yet.</p>}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Doctor Edit Dialog */}
        <DoctorEditDialog
          doctor={doctor}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleDoctorUpdate}
        />
      </div>
    </div>
  );
}
