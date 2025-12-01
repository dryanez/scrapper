
import React, { useState, useEffect, useCallback } from "react";
import { Job } from "@/api/entities";
import { Doctor } from "@/api/entities";
import { Match } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Search, Filter, Users, Briefcase, Star, Mail, Phone } from "lucide-react";

import JobCard from "../components/dashboard/JobCard";
import DoctorMatch from "../components/dashboard/DoctorMatch";

const GERMAN_STATES = {
  "BW": "Baden-Württemberg",
  "BY": "Bayern",
  "BE": "Berlin",
  "BB": "Brandenburg",
  "HB": "Bremen",
  "HH": "Hamburg",
  "HE": "Hessen",
  "MV": "Mecklenburg-Vorpommern",
  "NI": "Niedersachsen",
  "NW": "Nordrhein-Westfalen",
  "RP": "Rheinland-Pfalz",
  "SL": "Saarland",
  "SN": "Sachsen",
  "ST": "Sachsen-Anhalt",
  "SH": "Schleswig-Holstein",
  "TH": "Thüringen"
};

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedStates, setSelectedStates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  // Changed initial state for filters to null to correctly align with SelectItem value={null} for "All" options
  const [specialtyFilter, setSpecialtyFilter] = useState(null);
  const [seniorityFilter, setSeniorityFilter] = useState(null); // Changed to null to support "All Levels"
  const [isLoading, setIsLoading] = useState(true);
  
  // New pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalJobs, setTotalJobs] = useState(0);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Don't use server-side seniority filter - filter client-side for more permissive matching
      const filters = { isActive: true };
      if (specialtyFilter) filters.specialty = specialtyFilter;
      // Removed: if (seniorityFilter) filters.seniority = seniorityFilter;
      
      // Fetch jobs with maximum allowed limit of 10000 based on server-side filters
      // For search and state, we'll filter client-side since the API filter syntax is unclear for complex queries
      const allJobs = await Job.filter(filters, "-created_date", 10000);
      
      // Apply client-side filtering for search, states, and seniority
      let filteredJobs = allJobs;
      
      if (searchTerm) {
        filteredJobs = filteredJobs.filter(job => {
          const title = job.title || '';
          const hospitalName = job.hospitalName || job.hospital_name || '';
          const city = job.city || '';
          return (
            title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            city.toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
      }
      
      if (selectedStates.length > 0) {
        filteredJobs = filteredJobs.filter(job => selectedStates.includes(job.state));
      }

      // Permissive seniority filtering - search in title text, not just seniority field
      if (seniorityFilter) {
        filteredJobs = filteredJobs.filter(job => {
          const titleLower = job.title?.toLowerCase() || '';
          const seniorityLower = job.seniority?.toLowerCase() || '';
          const filterLower = seniorityFilter.toLowerCase();
          
          // Check if seniority field matches (including combined like "Assistenzarzt/Facharzt")
          if (seniorityLower.includes(filterLower)) return true;
          
          // Also check title text for more permissive matching
          switch (seniorityFilter) {
            case 'Assistenzarzt':
              return titleLower.includes('assistenzarzt') || titleLower.includes('assistenzärztin') ||
                     titleLower.includes('arzt in weiterbildung') || titleLower.includes('ärztin in weiterbildung');
            case 'Facharzt':
              return titleLower.includes('facharzt') || titleLower.includes('fachärztin');
            case 'Oberarzt':
              return titleLower.includes('oberarzt') || titleLower.includes('oberärztin');
            case 'Chefarzt':
              return titleLower.includes('chefarzt') || titleLower.includes('chefärztin');
            default:
              return true;
          }
        });
      }

      const limit = itemsPerPage === 'all' ? filteredJobs.length : parseInt(itemsPerPage);
      const offset = itemsPerPage === 'all' ? 0 : (currentPage - 1) * parseInt(itemsPerPage);
      const jobsData = filteredJobs.slice(offset, offset + limit);

      setJobs(jobsData);
      setTotalJobs(filteredJobs.length); // Set total based on the client-side filtered count

      const [doctorsData] = await Promise.all([
        Doctor.list("-updated_date", 100),
      ]);
      
      setDoctors(doctorsData);
      
      if (jobsData.length > 0) {
        // If there's a selected job, try to keep it. If not, select the first one.
        const currentSelectedJobStillVisible = jobsData.some(j => j.id === selectedJob?.id);
        if (!currentSelectedJobStillVisible) {
             setSelectedJob(jobsData[0]);
        }
      } else {
        setSelectedJob(null);
      }

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  }, [itemsPerPage, currentPage, specialtyFilter, seniorityFilter, searchTerm, selectedStates, selectedJob?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedJob) {
      loadMatches(selectedJob.id);
    }
  }, [selectedJob]);

  const loadMatches = async (jobId) => {
    try {
      const jobMatches = await Match.filter({ jobId }, "-score", 20);
      setMatches(jobMatches);
    } catch (error) {
      console.error("Error loading matches:", error);
    }
  };

  // Handler functions for filter changes
  const handleSpecialtyChange = (value) => {
    setSpecialtyFilter(value === "all" ? null : value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSeniorityChange = (value) => {
    setSeniorityFilter(value === "all" ? null : value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // The 'jobs' state variable now holds the currently paginated and filtered jobs.
  const filteredJobs = jobs; 

  const getMatchedDoctors = () => {
    if (!selectedJob) return [];
    
    // Get existing matches from database
    const existingMatches = matches
      .map(match => {
        const doctor = doctors.find(d => d.id === match.doctorId);
        return doctor ? { ...doctor, matchScore: match.score, matchReasons: match.reasons } : null;
      })
      .filter(Boolean);

    // If we have existing matches, return them
    if (existingMatches.length > 0) {
      return existingMatches.sort((a, b) => b.matchScore - a.matchScore);
    }

    // Otherwise, calculate matches on the fly based on job requirements
    const potentialMatches = doctors
      .map(doctor => {
        let score = 0;
        const reasons = {};

        // 1. Specialty Match (up to 50 points)
        if (doctor.specialties?.some(spec => 
          selectedJob.specialty?.toLowerCase().includes(spec.toLowerCase()) ||
          spec.toLowerCase().includes(selectedJob.specialty?.toLowerCase())
        )) {
          score += 50;
          reasons.specialty = `Perfect specialty match: ${selectedJob.specialty}`;
        }

        // 2. Location Match (up to 30 points)
        const jobState = selectedJob.state;
        if (doctor.currentState === jobState) {
          score += 30;
          reasons.location = `Currently lives in ${GERMAN_STATES[jobState]}`;
        } else if (doctor.desiredStates?.includes(jobState)) {
          score += 25;
          reasons.location = `Wants to work in ${GERMAN_STATES[jobState]}`;
        } else if (doctor.willingToRelocate) {
          score += 10;
          reasons.location = "Willing to relocate";
        }

        // 3. Experience & Seniority Match (up to 15 points)
        if (doctor.experienceYears) {
          const exp = doctor.experienceYears;
          switch (selectedJob.seniority) {
            case "Assistenzarzt":
              if (exp >= 0 && exp <= 5) { score += 15; reasons.experience = "Ideal experience for Assistenzarzt"; }
              else if (exp > 5) { score += 5; reasons.experience = "Overqualified, but could be a fit"; }
              break;
            case "Facharzt":
              if (exp >= 3 && exp <= 10) { score += 15; reasons.experience = "Ideal experience for Facharzt"; }
              else if (exp > 10) { score += 10; reasons.experience = "Very experienced Facharzt"; }
              else if (exp >= 1) { score += 5; reasons.experience = "Approaching Facharzt level"; }
              break;
            case "Oberarzt":
               if (exp >= 7) { score += 15; reasons.experience = "Sufficient experience for Oberarzt"; }
               else if (exp >= 5) { score += 10; reasons.experience = "Nearing Oberarzt level"; }
               break;
            default:
              score += 5; // Generic bonus for having experience data
              break;
          }
        }

        // 4. Work Permit Status (up to 5 points)
        if (doctor.workPermitStatus === "EU_CITIZEN") {
          score += 5;
          reasons.permits = "EU citizen";
        } else if (doctor.workPermitStatus === "WORK_PERMIT") {
          score += 3;
          reasons.permits = "Has valid work permit";
        }

        return {
          ...doctor,
          matchScore: Math.min(score, 100), // Cap at 100
          matchReasons: reasons
        };
      })
      .filter(doctor => doctor.matchScore >= 40) // Only show doctors with a reasonable match score
      .sort((a, b) => b.matchScore - a.matchScore);

    return potentialMatches;
  };

  // Pagination logic
  const currentJobs = filteredJobs; // The 'jobs' state already contains the paginated and filtered jobs.
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalJobs / parseInt(itemsPerPage));

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedJob(null); // Reset selected job when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    setSelectedJob(null);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content - Job List */}
      <div className="flex-1 flex flex-col">
        {/* Jobs Header */}
        <div className="p-6 bg-card/80 backdrop-blur-sm border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Available Positions ({totalJobs})
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {selectedStates.length > 0 ?
                  `Filtered by ${selectedStates.map(s => GERMAN_STATES[s]).join(', ')}` :
                  'All regions'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, hospitals..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Filters</h4>
                      <p className="text-sm text-muted-foreground">
                        Refine your job search.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <label htmlFor="specialty-filter" className="text-sm font-medium">Specialty</label>
                        <Select 
                          value={specialtyFilter ?? "all"} 
                          onValueChange={handleSpecialtyChange} 
                        >
                          <SelectTrigger className="col-span-2">
                            <SelectValue placeholder="All Specialties" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Specialties</SelectItem>
                            <SelectItem value="Innere Medizin">Innere Medizin</SelectItem>
                            <SelectItem value="Chirurgie">Chirurgie</SelectItem>
                            <SelectItem value="Anästhesie">Anästhesie</SelectItem>
                            <SelectItem value="Radiologie">Radiologie</SelectItem>
                            <SelectItem value="Pädiatrie">Pädiatrie</SelectItem>
                            <SelectItem value="Orthopädie/Unfallchirurgie">Orthopädie</SelectItem>
                            <SelectItem value="Gynäkologie">Gynäkologie</SelectItem>
                            <SelectItem value="Neurologie">Neurologie</SelectItem>
                            <SelectItem value="Urologie">Urologie</SelectItem>
                            <SelectItem value="Dermatologie">Dermatologie</SelectItem>
                            <SelectItem value="HNO">HNO</SelectItem>
                            <SelectItem value="Psychiatrie">Psychiatrie</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <label htmlFor="seniority-filter" className="text-sm font-medium">Seniority</label>
                        <Select 
                          value={seniorityFilter ?? "all"} 
                          onValueChange={handleSeniorityChange}
                        >
                          <SelectTrigger className="col-span-2">
                            <SelectValue placeholder="All Levels" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="Assistenzarzt">Assistenzarzt</SelectItem>
                            <SelectItem value="Facharzt">Facharzt</SelectItem>
                            <SelectItem value="Oberarzt">Oberarzt</SelectItem>
                            <SelectItem value="Chefarzt">Chefarzt</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 items-center gap-4">
                        <label htmlFor="state-filter" className="text-sm font-medium">States</label>
                        <Select 
                          value={selectedStates.length > 0 ? selectedStates[0] : "all"}
                          onValueChange={(value) => {
                            if (value === "all") {
                              setSelectedStates([]);
                            } else {
                              setSelectedStates([value]);
                            }
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="col-span-2">
                            <SelectValue placeholder="All States" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All States</SelectItem>
                            {Object.entries(GERMAN_STATES).map(([code, name]) => (
                              <SelectItem key={code} value={code}>{name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Selected States Display */}
          {selectedStates.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedStates.map(state => (
                  <Badge
                    key={state}
                    variant="secondary"
                    className="bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
                    onClick={() => setSelectedStates(prev => prev.filter(s => s !== state))}
                  >
                    {GERMAN_STATES[state]}
                    <span className="ml-1 font-bold">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Items per page and pagination controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Show:</span>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(value) => handleItemsPerPageChange(value === 'all' ? 'all' : parseInt(value))}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="150">150</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">jobs</span>
              </div>

              {itemsPerPage !== 'all' && (
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * parseInt(itemsPerPage) + 1}-{Math.min(currentPage * parseInt(itemsPerPage), totalJobs)} of {totalJobs}
                </div>
              )}
            </div>

            {itemsPerPage !== 'all' && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Job Cards */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <Card className="h-40 bg-secondary/50 mb-4" />
              </div>
            ))
          ) : currentJobs.length === 0 ? (
            <Card className="p-12 text-center bg-card border-border">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No jobs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </Card>
          ) : (
            currentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={selectedJob?.id === job.id}
                onClick={() => setSelectedJob(job)}
              />
            ))
          )}
        </div>

        {/* Bottom pagination (if needed) */}
        {itemsPerPage !== 'all' && totalPages > 1 && currentJobs.length > 0 && (
          <div className="p-4 bg-card/80 backdrop-blur-sm border-t border-border/50">
            <div className="flex items-center justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground px-4">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Matching Doctors */}
      <div className="w-96 border-l border-border/50 bg-card/80 backdrop-blur-sm flex flex-col">
        {selectedJob ? (
          <>
            {/* Job Summary */}
            <div className="p-6 border-b border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {selectedJob.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-3">{selectedJob.hospitalName}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {selectedJob.city}, {GERMAN_STATES[selectedJob.state]}
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {selectedJob.specialty}
                </Badge>
                <Badge variant="outline" className="border-border">
                  {selectedJob.seniority}
                </Badge>
              </div>
            </div>

            {/* Matching Doctors Header */}
            <div className="p-4 border-b border-border/50 bg-secondary/30">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Matching Doctors ({getMatchedDoctors().length})
              </h4>
              <p className="text-xs text-muted-foreground mt-1">Ranked by compatibility</p>
            </div>

            {/* Doctors List */}
            <div className="flex-1 overflow-y-auto">
              {getMatchedDoctors().length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">No matching doctors found</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {getMatchedDoctors().map((doctor) => (
                    <DoctorMatch
                      key={doctor.id}
                      doctor={doctor}
                      job={selectedJob}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a Job</h3>
              <p className="text-muted-foreground text-sm">
                Choose a position to see matching doctors
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
