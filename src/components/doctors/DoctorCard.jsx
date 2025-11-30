
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Globe, MapPin, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getAnimalAvatar } from "../utils/AvatarGenerator";

export default function DoctorCard({ doctor }) {
  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const workPermitStyles = {
    EU_CITIZEN: "bg-green-100 text-green-800 border-green-200",
    WORK_PERMIT: "bg-blue-100 text-blue-800 border-blue-200",
    VISA_REQUIRED: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PENDING: "bg-slate-100 text-slate-800 border-slate-200"
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur-sm border-slate-200 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-12 h-12 border-2 border-white shadow-md">
            <AvatarImage 
              src={doctor.photoUrl || getAnimalAvatar(doctor.id, `${doctor.firstName} ${doctor.lastName}`)} 
              alt={`${doctor.firstName} ${doctor.lastName}`} 
            />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
              {getInitials(doctor.firstName, doctor.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">
              {doctor.firstName} {doctor.lastName}
            </h3>
            <p className="text-sm text-slate-500 truncate">{doctor.email}</p>
          </div>
        </div>
        
        {/* Specialties */}
        <div className="flex flex-wrap gap-1 mb-3">
          {doctor.specialties?.slice(0, 2).map((specialty, idx) => (
            <Badge 
              key={idx} 
              variant="secondary" 
              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
            >
              {specialty}
            </Badge>
          ))}
          {doctor.specialties?.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{doctor.specialties.length - 2}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-grow flex flex-col justify-between">
        <div className="space-y-2 mb-4 text-sm">
          {doctor.experienceYears != null && (
            <div className="flex items-center gap-2 text-slate-600">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{doctor.experienceYears} year{doctor.experienceYears !== 1 ? 's' : ''} experience</span>
            </div>
          )}
          
          {doctor.desiredStates?.length > 0 && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="truncate">Wants: {doctor.desiredStates.join(', ')}</span>
            </div>
          )}
          
          {doctor.workPermitStatus && (
            <div className="flex items-center gap-2">
              <Badge 
                className={`text-xs ${workPermitStyles[doctor.workPermitStatus]}`}
              >
                {doctor.workPermitStatus.replace('_', ' ')}
              </Badge>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link to={createPageUrl(`DoctorDetail?id=${doctor.id}`)} className="w-full">
            <Button variant="outline" size="sm" className="w-full">
              View Full Profile
            </Button>
          </Link>
          <div className="flex gap-2">
            <a href={`mailto:${doctor.email}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Mail className="w-4 h-4" />
              </Button>
            </a>
            {doctor.phone && (
              <a href={`tel:${doctor.phone}`} className="flex-1">
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
}
