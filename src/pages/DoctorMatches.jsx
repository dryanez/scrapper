import React, { useState, useEffect, useCallback } from "react";
import { Doctor } from "@/api/entities";
import { Job } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Star, Search, Filter, MapPin, Building2, Calendar, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { getAnimalAvatar } from "../components/utils/AvatarGenerator";
import { findMatchingJobs, GERMAN_STATES } from "@/utils/matchingAlgorithm";

export default function DoctorMatches() {
  const [doctor, setDoctor] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [minMatchScore, setMinMatchScore] = useState("40");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const calculateMatches = useCallback((doc, jobs) => {
    // Use centralized matching algorithm
    const matches = findMatchingJobs(doc, jobs, parseInt(minMatchScore));
    setAllMatches(matches);
  }, [minMatchScore]);

  const loadData = useCallback(async (doctorId) => {
    setIsLoading(true);
    try {
      const doctorData = await Doctor.filter({ id: doctorId });
      const currentDoctor = doctorData[0];
      setDoctor(currentDoctor);

      if (!currentDoctor) {
        setIsLoading(false);
        return;
      }

      const allJobs = await Job.filter({ isActive: true }, "-created_date", 500);
      if (allJobs.length > 0) {
        calculateMatches(currentDoctor, allJobs);
      }

    } catch (error) {
      console.error("Error loading doctor matches:", error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateMatches]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const doctorId = urlParams.get('id');
    if (doctorId) {
      loadData(doctorId);
    } else {
      setIsLoading(false);
    }
  }, [loadData]);

  const filteredMatches = allMatches.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = specialtyFilter === "all" || job.specialty === specialtyFilter;
    const matchesState = stateFilter === "all" || job.state === stateFilter;
    
    return matchesSearch && matchesSpecialty && matchesState;
  });

  const getMatchColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 75) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl(`DoctorDetail?id=${doctor.id}`)} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {doctor.firstName}'s Profile
          </Link>
        </div>

        {/* Doctor Summary Header */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  src={doctor.photoUrl || getAnimalAvatar(doctor.id, `${doctor.firstName} ${doctor.lastName}`)} 
                  alt={`${doctor.firstName} ${doctor.lastName}`} 
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-xl">
                  {getInitials(doctor.firstName, doctor.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  <Star className="w-6 h-6 inline text-yellow-500 mr-2" />
                  Job Matches for {doctor.firstName} {doctor.lastName}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {doctor.specialties?.slice(0, 3).map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800">
                      {specialty}
                    </Badge>
                  ))}
                  <Badge variant="outline">
                    {doctor.experienceYears} years experience
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{filteredMatches.length}</div>
                <div className="text-sm text-slate-500">Matching Jobs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search jobs, hospitals, or cities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={minMatchScore} onValueChange={setMinMatchScore}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="40">40%+ Match</SelectItem>
                  <SelectItem value="50">50%+ Match</SelectItem>
                  <SelectItem value="60">60%+ Match</SelectItem>
                  <SelectItem value="75">75%+ Match</SelectItem>
                  <SelectItem value="90">90%+ Match</SelectItem>
                </SelectContent>
              </Select>
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="Innere Medizin">Innere Medizin</SelectItem>
                  <SelectItem value="Chirurgie">Chirurgie</SelectItem>
                  <SelectItem value="Anästhesie">Anästhesie</SelectItem>
                  <SelectItem value="Radiologie">Radiologie</SelectItem>
                  <SelectItem value="Pädiatrie">Pädiatrie</SelectItem>
                  <SelectItem value="Gynäkologie">Gynäkologie</SelectItem>
                  <SelectItem value="Neurologie">Neurologie</SelectItem>
                </SelectContent>
              </Select>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-48">
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
          </CardContent>
        </Card>

        {/* Job Matches */}
        {filteredMatches.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No matching jobs found</h3>
            <p className="text-slate-500">Try adjusting your filters to see more opportunities</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredMatches.map((job) => (
              <Card key={job.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <Link to={createPageUrl(`JobDetails?id=${job.id}`)} className="text-xl font-semibold text-blue-700 hover:underline block mb-2">
                            {job.title}
                          </Link>
                          <div className="text-slate-600 mb-2">
                            <div className="font-medium">{job.hospitalName}</div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4" />
                              <span>{job.city}, {GERMAN_STATES[job.state] || job.state}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {job.specialty}
                            </Badge>
                            <Badge variant="outline">{job.seniority}</Badge>
                            {job.contractType && (
                              <Badge variant="outline" className="text-xs">
                                {job.contractType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <Badge className={`text-lg px-3 py-2 font-semibold ${getMatchColor(job.matchScore)}`}>
                        <Star className="w-4 h-4 mr-1" />
                        {job.matchScore}% Match
                      </Badge>
                      <div className="flex gap-2">
                        <Link to={createPageUrl(`EmailComposer?doctorId=${doctor.id}&jobId=${job.id}`)}>
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Apply Now
                          </Button>
                        </Link>
                        {job.jobDetailsUrl && (
                          <a href={job.jobDetailsUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  {job.matchReasons && Object.keys(job.matchReasons).length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-4 mt-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Why this is a great match:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-700">
                        {Object.entries(job.matchReasons).map(([key, reason]) => (
                          <div key={key} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-slate-500 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Posted: {(() => {
                          const dateValue = job.postedAt || job.posted_at || job.created_at || job.created_date || job.scraped_at;
                          if (dateValue) {
                            try {
                              const date = new Date(dateValue);
                              if (!isNaN(date.getTime())) {
                                return format(date, 'MMM d, yyyy');
                              }
                            } catch (e) {}
                          }
                          return 'Recently';
                        })()}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {job.source}
                    </Badge>
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