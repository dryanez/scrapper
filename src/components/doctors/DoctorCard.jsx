
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Globe, MapPin, Briefcase, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getAnimalAvatar } from "../utils/AvatarGenerator";

export default function DoctorCard({ doctor, onDelete, showDelete = false }) {
  // Handle both camelCase and snake_case field names from Supabase
  const firstName = doctor.firstName || doctor.first_name || '';
  const lastName = doctor.lastName || doctor.last_name || '';
  const email = doctor.email || '';
  const phone = doctor.phone || '';
  const photoUrl = doctor.photoUrl || doctor.photo_url;
  const specialties = doctor.specialties || [];
  const experienceYears = doctor.experienceYears ?? doctor.experience_years;
  const desiredStates = doctor.desiredStates || doctor.desired_states || [];
  const workPermitStatus = doctor.workPermitStatus || doctor.work_permit_status;

  const getInitials = (first, last) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  const workPermitStyles = {
    EU_CITIZEN: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    WORK_PERMIT: "bg-primary/20 text-primary border-primary/30",
    VISA_REQUIRED: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    PENDING: "bg-secondary text-muted-foreground border-border"
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 bg-card backdrop-blur-sm border-border hover:border-primary/50 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-12 h-12 border-2 border-border shadow-md">
            <AvatarImage 
              src={photoUrl || getAnimalAvatar(doctor.id, `${firstName} ${lastName}`)} 
              alt={`${firstName} ${lastName}`} 
            />
            <AvatarFallback className="bg-gradient-to-r from-primary to-violet-500 text-primary-foreground font-semibold">
              {getInitials(firstName, lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {firstName} {lastName}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
          </div>
        </div>
        
        {/* Specialties */}
        <div className="flex flex-wrap gap-1 mb-3">
          {specialties?.slice(0, 2).map((specialty, idx) => (
            <Badge 
              key={idx} 
              variant="secondary" 
              className="text-xs bg-primary/10 text-primary border-primary/20"
            >
              {specialty}
            </Badge>
          ))}
          {specialties?.length > 2 && (
            <Badge variant="outline" className="text-xs border-border">
              +{specialties.length - 2}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-grow flex flex-col justify-between">
        <div className="space-y-2 mb-4 text-sm">
          {experienceYears != null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase className="w-4 h-4" />
              <span>{experienceYears} year{experienceYears !== 1 ? 's' : ''} experience</span>
            </div>
          )}
          
          {desiredStates?.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="truncate">Wants: {desiredStates.join(', ')}</span>
            </div>
          )}
          
          {workPermitStatus && (
            <div className="flex items-center gap-2">
              <Badge 
                className={`text-xs ${workPermitStyles[workPermitStatus]}`}
              >
                {workPermitStatus.replace('_', ' ')}
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
            {showDelete && onDelete && (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(doctor.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
