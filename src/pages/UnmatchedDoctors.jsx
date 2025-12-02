import React, { useState, useEffect, useCallback } from "react";
import { Application } from "@/api/entities";
import { Doctor } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, UserX, Search, Filter, Briefcase, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getAnimalAvatar } from "../components/utils/AvatarGenerator";

const GERMAN_STATES = {
  "BW": "Baden-Württemberg", "BY": "Bayern", "BE": "Berlin", "BB": "Brandenburg", "HB": "Bremen",
  "HH": "Hamburg", "HE": "Hessen", "MV": "Mecklenburg-Vorpommern", "NI": "Niedersachsen",
  "NW": "Nordrhein-Westfalen", "RP": "Rheinland-Pfalz", "SL": "Saarland", "SN": "Sachsen",
  "ST": "Sachsen-Anhalt", "SH": "Schleswig-Holstein", "TH": "Thüringen"
};

export default function UnmatchedDoctors() {
  const [unmatchedDoctors, setUnmatchedDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [applicationsData, doctorsData] = await Promise.all([
        Application.list("-updated_date", 1000),
        Doctor.list("-updated_date", 1000)
      ]);

      const doctorsWithApplications = new Set(applicationsData.map(app => app.doctorId));
      const unmatched = doctorsData
        .filter(doctor => !doctorsWithApplications.has(doctor.id))
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date)); // Newest first

      setUnmatchedDoctors(unmatched);
    } catch (error) {
      console.error("Error loading unmatched doctors:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDoctors = unmatchedDoctors.filter(doctor => {
    const firstName = doctor.firstName || doctor.first_name || '';
    const lastName = doctor.lastName || doctor.last_name || '';
    const email = doctor.email || '';
    const specialties = doctor.specialties || [];
    const currentState = doctor.currentState || doctor.current_state || '';
    const desiredStates = doctor.desiredStates || doctor.desired_states || [];

    const matchesSearch = !searchTerm ||
      `${firstName} ${lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty = specialtyFilter === "all" ||
      specialties.includes(specialtyFilter);

    const matchesState = stateFilter === "all" ||
      currentState === stateFilter ||
      desiredStates.includes(stateFilter);

    return matchesSearch && matchesSpecialty && matchesState;
  });

  const workPermitStyles = {
    EU_CITIZEN: "bg-green-100 text-green-800 border-green-200",
    WORK_PERMIT: "bg-blue-100 text-blue-800 border-blue-200",
    VISA_REQUIRED: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PENDING: "bg-slate-100 text-slate-800 border-slate-200"
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
            <h1 className="text-3xl font-bold text-green-600 mb-2 flex items-center gap-3">
              <UserX className="w-8 h-8" />
              Find a Position
            </h1>
            <p className="text-slate-600">Doctors without any active applications - ready for new opportunities</p>
            <p className="text-sm text-slate-500 mt-1">{filteredDoctors.length} doctors available</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by name, specialty, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by specialty" />
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
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {Object.entries(GERMAN_STATES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i} className="animate-pulse h-64 bg-slate-100" />
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <Card className="p-12 text-center">
            <UserX className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm || specialtyFilter !== "all" || stateFilter !== "all" ? 'No matching doctors found' : 'All doctors have active applications'}
            </h3>
            <p className="text-slate-500">
              {searchTerm || specialtyFilter !== "all" || stateFilter !== "all" ? 'Try adjusting your filters' : 'Great job keeping everyone busy!'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map(doctor => {
              const firstName = doctor.firstName || doctor.first_name || '';
              const lastName = doctor.lastName || doctor.last_name || '';
              const email = doctor.email || '';
              const phone = doctor.phone || '';
              const photoUrl = doctor.photoUrl || doctor.photo_url || '';
              const specialties = doctor.specialties || [];
              const experienceYears = doctor.experienceYears ?? doctor.experience_years;
              const currentState = doctor.currentState || doctor.current_state || '';
              const desiredStates = doctor.desiredStates || doctor.desired_states || [];
              const workPermitStatus = doctor.workPermitStatus || doctor.work_permit_status || '';
              
              return (
                <Card key={doctor.id} className="hover:shadow-lg transition-shadow border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={photoUrl || getAnimalAvatar(doctor.id, `${firstName} ${lastName}`)} />
                        <AvatarFallback>{firstName[0] || '?'}{lastName[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{firstName} {lastName}</h3>
                        <p className="text-sm text-slate-500">{email}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {specialties.slice(0, 2).map((specialty, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              {specialty}
                            </Badge>
                          ))}
                          {specialties.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{specialties.length - 2}</Badge>
                          )}
                        </div>
                      )}

                      <div className="text-sm text-slate-600 space-y-1">
                        {experienceYears && (
                          <div>Experience: {experienceYears} years</div>
                        )}
                        {currentState && (
                          <div>Current: {GERMAN_STATES[currentState]}</div>
                        )}
                        {desiredStates.length > 0 && (
                          <div>Wants: {desiredStates.slice(0, 2).map(s => GERMAN_STATES[s]).join(', ')}</div>
                        )}
                      </div>

                      {workPermitStatus && (
                        <Badge className={`text-xs ${workPermitStyles[workPermitStatus]}`}>
                          {workPermitStatus.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link to={createPageUrl(`DoctorDetail?id=${doctor.id}`)} className="w-full">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          <Briefcase className="w-4 h-4 mr-2" />
                          Find Jobs
                        </Button>
                      </Link>
                      <div className="flex gap-2">
                        {email && (
                          <a href={`mailto:${email}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Mail className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        {phone && (
                          <a href={`tel:${phone}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Phone className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}