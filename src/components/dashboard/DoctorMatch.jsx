
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
  // Handle both camelCase and snake_case field names from Supabase
  const firstName = doctor.firstName || doctor.first_name || '';
  const lastName = doctor.lastName || doctor.last_name || '';
  const photoUrl = doctor.photoUrl || doctor.photo_url;
  const specialties = doctor.specialties || [];
  const experienceYears = doctor.experienceYears ?? doctor.experience_years;
  const languages = doctor.languages || [];
  const desiredRegions = doctor.desiredRegions || doctor.desired_regions || [];
  const desiredStates = doctor.desiredStates || doctor.desired_states || [];
  const matchScore = doctor.matchScore || doctor.match_score || 0;

  const getInitials = (first, last) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
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
              src={photoUrl || getAnimalAvatar(doctor.id, `${firstName} ${lastName}`)} 
              alt={`${firstName} ${lastName}`} 
            />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
              {getInitials(firstName, lastName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 mb-1 truncate">
              {firstName} {lastName}
            </h4>
            <div className="flex items-center gap-2 mb-2">
              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                getMatchBg(matchScore)
              } ${getMatchColor(matchScore)}`}>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {matchScore}% match
                </div>
              </div>
            </div>
            <Progress 
              value={matchScore} 
              className={`h-2 ${
                matchScore >= 90 ? '[&>div]:bg-green-500' :
                matchScore >= 75 ? '[&>div]:bg-blue-500' :
                matchScore >= 60 ? '[&>div]:bg-yellow-500' :
                '[&>div]:bg-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {specialties?.slice(0, 2).map((specialty, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                {specialty}
              </Badge>
            ))}
            {specialties?.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{specialties.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Key info */}
        <div className="space-y-1 mb-3 text-xs text-slate-600">
          {experienceYears && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{experienceYears} years experience</span>
            </div>
          )}
          {languages?.length > 0 && (
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>{languages.slice(0, 2).join(', ')}</span>
            </div>
          )}
          {(desiredStates?.length > 0 || desiredRegions?.length > 0) && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>Wants: {(desiredStates?.length > 0 ? desiredStates : desiredRegions).slice(0, 2).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link 
            to={createPageUrl(`EmailComposer?doctorId=${doctor.id}&jobId=${job?.id || ''}`)}
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
