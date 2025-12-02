
import React, { useState, useEffect, useCallback } from "react";
import { Job } from "@/api/entities";
import { Doctor } from "@/api/entities";
import { Match } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, MapPin, Calendar, Building2, User, DollarSign, Clock, Briefcase, Users, UserPlus, FileClock, CornerDownRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import DoctorMatch from "../components/dashboard/DoctorMatch";
import HospitalJobsDialog from "../components/hospitals/HospitalJobsDialog";
import LogApplicationDialog from "../components/applications/LogApplicationDialog";
import JobCard from "../components/dashboard/JobCard";
import { Application } from "@/api/entities";
import { findMatchingDoctors, GERMAN_STATES } from "@/utils/matchingAlgorithm";

const getHospitalLogo = (hospitalName) => {
  if (!hospitalName) return 'https://placehold.co/120x60/6366F1/FFFFFF?text=H';
  const name = hospitalName.toLowerCase();
  
  if (name.includes('charité') || name.includes('charite')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Charite_logo.svg/200px-Charite_logo.svg.png';
  }
  if (name.includes('uksh') || name.includes('schleswig-holstein')) {
    return 'https://www.uksh.de/uksh_media/Universit%C3%A4tsklinikum+Schleswig_Holstein-p-5047/Logo/UKSH_Logo-p-132213.png';
  }
  if (name.includes('uniklinik') || name.includes('universitätsklinikum')) {
    return 'https://placehold.co/120x60/1E40AF/FFFFFF?text=UNI';
  }
  if (name.includes('klinikum')) {
    return 'https://placehold.co/120x60/059669/FFFFFF?text=KLINIK';
  }
  
  return 'https://placehold.co/120x60/6366F1/FFFFFF?text=H';
};

export default function JobDetails() {
  const [job, setJob] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchedDoctors, setMatchedDoctors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHospitalJobs, setShowHospitalJobs] = useState(false);
  const [foundHospitalId, setFoundHospitalId] = useState(null);
  const [isLogApplicationOpen, setIsLogApplicationOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const calculateMatches = useCallback((currentJob, doctorsData, existingMatches) => {
    if (!currentJob) return;
    
    // Get existing matches from database
    const existingMatchedDoctors = existingMatches
      .map(match => {
        const doctor = doctorsData.find(d => d.id === match.doctorId);
        return doctor ? { ...doctor, matchScore: match.score, matchReasons: match.reasons } : null;
      })
      .filter(Boolean);

    // If we have existing matches, use them
    if (existingMatchedDoctors.length > 0) {
      setMatchedDoctors(existingMatchedDoctors.sort((a, b) => b.matchScore - a.matchScore));
      return;
    }

    // Otherwise, use the centralized matching algorithm
    const potentialMatches = findMatchingDoctors(currentJob, doctorsData, 35).slice(0, 10);
    setMatchedDoctors(potentialMatches);
  }, []);

  const calculateSimilarJobs = useCallback((currentJob, allJobs) => {
    if (!currentJob || !allJobs || allJobs.length === 0) return;
    
    const similar = allJobs
      .filter(j => j.id !== currentJob.id) // Exclude current job
      .map(j => {
        let score = 0;
        if (j.specialty && currentJob.specialty && j.specialty.toLowerCase() === currentJob.specialty.toLowerCase()) score += 3;
        if (j.seniority && currentJob.seniority && j.seniority.toLowerCase() === currentJob.seniority.toLowerCase()) score += 2;
        if (j.state && currentJob.state && j.state === currentJob.state) score += 1;
        return { ...j, similarityScore: score };
      })
      .filter(j => j.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5);

    setSimilarJobs(similar);
  }, []);

  const loadJob = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('id');
      
      if (jobId) {
        // Load job data
        const jobData = await Job.filter({ id: jobId });
        if (jobData && jobData.length > 0) {
          const currentJob = jobData[0];
          setJob(currentJob);
          
          // Load doctors, all jobs, matches, and applications
          const [doctorsData, allJobsData, matchesData, applicationsData] = await Promise.all([
            Doctor.list("-updated_date", 500),
            Job.filter({ isActive: true }, "-created_date", 200),
            Match.filter({ jobId }, "-score", 20).catch(() => []),
            Application.filter({ jobId }, "-appliedAt").catch(() => []),
          ]);
          
          setDoctors(doctorsData);
          setMatches(matchesData);
          setApplications(applicationsData);
          
          // Calculate matches and similar jobs
          calculateMatches(currentJob, doctorsData, matchesData);
          calculateSimilarJobs(currentJob, allJobsData);
        }
      }
    } catch (error) {
      console.error("Error loading job:", error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateMatches, calculateSimilarJobs]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    const jobHospitalId = job?.hospitalId || job?.hospital_id;
    const jobHospitalName = job?.hospitalName || job?.hospital_name;
    if (job && !jobHospitalId && jobHospitalName) {
        const findHospital = async () => {
            const { Hospital } = await import('@/api/entities');
            const hospitals = await Hospital.filter({ name: jobHospitalName });
            if (hospitals.length > 0) {
                setFoundHospitalId(hospitals[0].id);
            }
        }
        findHospital();
    }
  }, [job]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Job Not Found</h1>
          <Link to={createPageUrl("Dashboard")}>
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hospitalId = job.hospitalId || job.hospital_id || foundHospitalId;
  const hospitalName = job.hospitalName || job.hospital_name || '';
  const jobUrl = job.jobDetailsUrl || job.job_details_url || job.sourceUrl || job.source_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to={createPageUrl("Dashboard")} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
          
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl text-slate-900 mb-3">{job.title}</CardTitle>
                  
                  <div className="flex items-center gap-4 mb-4">
                    {hospitalId ? (
                      <Link to={createPageUrl(`HospitalDetail?id=${hospitalId}`)} className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                                src={getHospitalLogo(hospitalName)}
                                alt={`${hospitalName} logo`}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                            {hospitalName}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                                src={getHospitalLogo(hospitalName)}
                                alt={`${hospitalName} logo`}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <span className="font-medium text-slate-900">{hospitalName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span>{job.city}, {GERMAN_STATES[job.state] || job.state}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-800">{job.specialty}</Badge>
                    <Badge variant="outline">{job.seniority}</Badge>
                    {job.contractType && (
                      <Badge variant="secondary">{job.contractType}</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Source: {job.source}
                    </Badge>
                  </div>
                </div>

                <div className="ml-6 flex items-center gap-2">
                  <Button
                    onClick={() => setIsPreviewOpen(true)}
                    variant="outline"
                    className="inline-flex items-center gap-2"
                    disabled={!jobUrl}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  {jobUrl && (
                    <a
                      href={jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Original
                    </a>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Briefcase className="w-5 h-5 text-slate-700" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.descriptionHtml ? (
                  <div 
                    className="job-description-content"
                    dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
                    style={{
                      lineHeight: '1.7',
                      color: '#475569'
                    }}
                  />
                ) : (
                  <p className="text-slate-600">No detailed description available.</p>
                )}
                
                <style>{`
                  .job-description-content {
                    font-size: 16px;
                    line-height: 1.7;
                    color: #475569;
                  }
                  
                  .job-description-content p {
                    margin-bottom: 16px;
                    line-height: 1.7;
                  }
                  
                  .job-description-content h1,
                  .job-description-content h2,
                  .job-description-content h3,
                  .job-description-content h4 {
                    font-weight: 600;
                    color: #1e293b;
                    margin-top: 24px;
                    margin-bottom: 12px;
                  }
                  
                  .job-description-content h1 { font-size: 24px; }
                  .job-description-content h2 { font-size: 20px; }
                  .job-description-content h3 { font-size: 18px; }
                  .job-description-content h4 { font-size: 16px; }
                  
                  .job-description-content ul,
                  .job-description-content ol {
                    margin: 16px 0;
                    padding-left: 24px;
                  }
                  
                  .job-description-content li {
                    margin-bottom: 8px;
                    line-height: 1.6;
                  }
                  
                  .job-description-content strong,
                  .job-description-content b {
                    font-weight: 600;
                    color: #334155;
                  }
                  
                  .job-description-content a {
                    color: #2563eb;
                    text-decoration: underline;
                  }
                  
                  .job-description-content a:hover {
                    color: #1d4ed8;
                  }
                  
                  .job-description-content br {
                    line-height: 2;
                  }
                  
                  .job-description-content div {
                    margin-bottom: 12px;
                  }
                  
                  /* Handle text blocks without proper HTML tags */
                  .job-description-content {
                    white-space: pre-line;
                  }
                `}</style>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && (
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-slate max-w-none">
                    {job.requirements}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application History Section */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileClock className="w-5 h-5" />
                  Application History
                </CardTitle>
                <Button onClick={() => setIsLogApplicationOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Log Application
                </Button>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No applications logged for this job yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => {
                      const doctorId = app.doctorId || app.doctor_id;
                      const doctor = doctors.find(d => d.id === doctorId);
                      const doctorFirstName = doctor?.firstName || doctor?.first_name || '';
                      const doctorLastName = doctor?.lastName || doctor?.last_name || '';
                      const appliedAt = app.appliedAt || app.applied_at || app.created_at;
                      const appliedDate = appliedAt ? new Date(appliedAt) : null;
                      const isValidDate = appliedDate && !isNaN(appliedDate.getTime());
                      const hasDoctor = doctorFirstName || doctorLastName;
                      
                      return (
                        <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex-1">
                            {hasDoctor ? (
                              <div className="flex items-center gap-2">
                                <Link to={createPageUrl(`DoctorDetail?id=${doctorId}`)} className="font-semibold text-blue-700 hover:underline">
                                  {`${doctorFirstName} ${doctorLastName}`.trim()}
                                </Link>
                                <Link to={createPageUrl(`Applications?doctorId=${doctorId}`)} className="text-xs text-slate-500 hover:text-blue-600">
                                  (View all applications)
                                </Link>
                              </div>
                            ) : (
                              <span className="font-semibold text-slate-600">Unknown Doctor</span>
                            )}
                            {app.notes && <p className="text-sm text-slate-500 mt-1">{app.notes}</p>}
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium text-slate-800">{app.status}</div>
                            {isValidDate && (
                              <div className="text-slate-500" title={appliedDate.toLocaleString()}>
                                {formatDistanceToNow(appliedDate, { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Matching Doctors Section */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Matching Doctors ({matchedDoctors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchedDoctors.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500">No matching doctors found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchedDoctors.map((doctor) => (
                      <DoctorMatch
                        key={doctor.id}
                        doctor={doctor}
                        job={job}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Position Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.department && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="text-sm text-slate-600">Department</div>
                      <div className="font-medium">{job.department}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-600" />
                  <div>
                    <div className="text-sm text-slate-600">Seniority Level</div>
                    <div className="font-medium">{job.seniority}</div>
                  </div>
                </div>

                {job.salaryRange && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="text-sm text-slate-600">Salary Range</div>
                      <div className="font-medium">{job.salaryRange}</div>
                    </div>
                  </div>
                )}

                {job.contractType && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="text-sm text-slate-600">Contract Type</div>
                      <div className="font-medium">{job.contractType}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <div>
                    <div className="text-sm text-slate-600">Posted</div>
                    <div className="font-medium">
                      {(() => {
                        const dateValue = job.postedAt || job.posted_at || job.createdAt || job.created_at || job.created_date || job.scraped_at;
                        if (dateValue) {
                          try {
                            const date = new Date(dateValue);
                            if (!isNaN(date.getTime())) {
                              return format(date, 'MMM d, yyyy');
                            }
                          } catch (e) {
                            // Fall through
                          }
                        }
                        return 'Recently';
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hospital Info */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Hospital Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-slate-600">Hospital Name</div>
                    <div className="font-medium">{hospitalName}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-slate-600">Location</div>
                    <div className="font-medium">
                      {job.city}, {GERMAN_STATES[job.state] || job.state}
                    </div>
                  </div>
                  
                  {job.hospitalWebsite && (
                    <div>
                      <div className="text-sm text-slate-600">Website</div>
                      <a
                        href={job.hospitalWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => setShowHospitalJobs(true)}
                    variant="outline" 
                    className="w-full mt-3"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    View All Jobs at Hospital
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Link 
                    to={createPageUrl(`EmailComposer?jobId=${job.id}`)}
                    className="w-full"
                  >
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Send to Doctor
                    </Button>
                  </Link>
                  
                  {job.jobDetailsUrl && (
                    <a
                      href={job.jobDetailsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Original Posting
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Jobs Section */}
        {similarJobs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CornerDownRight className="w-6 h-6 text-slate-600" />
                Similar Positions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarJobs.map(similarJob => (
                <JobCard 
                    key={similarJob.id} 
                    job={similarJob} 
                    isSelected={false} 
                    onClick={() => window.location.href = createPageUrl(`JobDetails?id=${similarJob.id}`)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Log Application Dialog */}
        {job && (
          <LogApplicationDialog
            job={job}
            doctors={doctors}
            open={isLogApplicationOpen}
            onOpenChange={setIsLogApplicationOpen}
            onSuccess={() => {
              setIsLogApplicationOpen(false);
              loadJob(); // Reload data to show the new application
            }}
          />
        )}

        {/* Hospital Jobs Dialog */}
        {job && (
          <HospitalJobsDialog 
            hospital={{ name: hospitalName, id: hospitalId }}
            open={showHospitalJobs}
            onOpenChange={setShowHospitalJobs}
          />
        )}

        {/* Job Preview Dialog */}
        {jobUrl && (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-7xl w-[95%] h-[90vh] flex flex-col p-4">
              <DialogHeader className="pb-2 border-b">
                <DialogTitle className="truncate">{job.title}</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Some websites may block being previewed. If the page is blank, please use the link to open it in a new tab.
                  <a href={jobUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 font-medium hover:underline">
                    Open in New Tab <ExternalLink className="inline w-3 h-3" />
                  </a>
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-hidden bg-white">
                <iframe
                  src={jobUrl}
                  title={`Preview of ${job.title}`}
                  className="w-full h-full border-0"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
