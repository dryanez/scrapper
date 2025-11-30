
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Mail, Phone, Star, Globe, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getAnimalAvatar } from "../utils/AvatarGenerator";

export default function DoctorMatch({ doctor, job }) {
  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-slate-600';
  };

  const getMatchBg = (score) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 75) return 'bg-blue-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-slate-100';
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-slate-200">
      <CardContent className="p-4">
        {/* Header with avatar and match score */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="w-12 h-12">
            <AvatarImage 
              src={doctor.photoUrl || getAnimalAvatar(doctor.id, `${doctor.firstName} ${doctor.lastName}`)} 
              alt={`${doctor.firstName} ${doctor.lastName}`} 
            />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
              {getInitials(doctor.firstName, doctor.lastName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 mb-1 truncate">
              {doctor.firstName} {doctor.lastName}
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                getMatchBg(doctor.matchScore)
              } ${getMatchColor(doctor.matchScore)}`}>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {doctor.matchScore}% match
                </div>
              </div>
            </div>
            <Progress 
              value={doctor.matchScore} 
              className={`h-2 ${
                doctor.matchScore >= 90 ? '[&>div]:bg-green-500' :
                doctor.matchScore >= 75 ? '[&>div]:bg-blue-500' :
                doctor.matchScore >= 60 ? '[&>div]:bg-yellow-500' :
                '[&>div]:bg-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
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
        </div>

        {/* Key info */}
        <div className="space-y-1 mb-3 text-xs text-slate-600">
          {doctor.experienceYears && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{doctor.experienceYears} years experience</span>
            </div>
          )}
          {doctor.languages?.length > 0 && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>{doctor.languages.slice(0, 2).join(', ')}</span>
            </div>
          )}
          {doctor.desiredRegions?.length > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>Willing to work in {doctor.desiredRegions.slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link 
            to={createPageUrl(`EmailComposer?doctorId=${doctor.id}&jobId=${job.id}`)}
            className="flex-1"
          >
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
              <Mail className="w-3 h-3 mr-1" />
              Send Email
            </Button>
          </Link>
          <Link to={createPageUrl(`DoctorDetail?id=${doctor.id}`)}>
            <Button size="sm" variant="outline">
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
