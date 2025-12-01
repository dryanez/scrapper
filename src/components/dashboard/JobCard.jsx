
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, ExternalLink, Building2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";

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

// Same logo helper as in HospitalGrid
const getHospitalLogo = (hospitalName) => {
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

export default function JobCard({ job, isSelected, onClick }) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
        isSelected 
          ? 'border-primary shadow-lg bg-primary/10' 
          : 'border-border hover:border-primary/50 bg-card'
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link 
              to={createPageUrl(`JobDetails?id=${job.id}`)}
              className="block hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()} // Prevent card onClick when clicking the link
            >
              <h3 className={`text-lg font-semibold mb-3 ${
                isSelected ? 'text-primary' : 'text-foreground'
              }`}>
                {job.title}
              </h3>
            </Link>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={job.hospitalLogo || getHospitalLogo(job.hospitalName)}
                  alt={`${job.hospitalName} logo`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = getHospitalLogo(job.hospitalName);
                  }}
                />
              </div>
              <div>
                <div className="font-medium text-foreground">{job.hospitalName}</div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="w-3 h-3" />
                  <span>{job.city}, {GERMAN_STATES[job.state] || job.state}</span>
                </div>
              </div>
            </div>
          </div>
          {(job.jobDetailsUrl || job.sourceUrl) && (
            <a
              href={job.jobDetailsUrl || job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()} // Prevent card onClick when clicking the external link
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge 
            variant="secondary" 
            className={`${
              isSelected 
                ? 'bg-primary/20 text-primary' 
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {job.specialty}
          </Badge>
          <Badge 
            variant="outline"
            className={isSelected ? 'border-primary/50 text-primary' : 'border-border'}
          >
            {job.seniority}
          </Badge>
          {job.contractType && (
            <Badge 
              variant="outline" 
              className={`text-xs ${
                isSelected ? 'border-primary/50 text-primary' : 'text-muted-foreground border-border'
              }`}
            >
              {job.contractType}
            </Badge>
          )}
        </div>

        {job.salaryRange && (
          <div className={`text-sm font-medium mb-2 ${
            isSelected ? 'text-primary' : 'text-foreground'
          }`}>
            {job.salaryRange}
          </div>
        )}

        {/* Show description from scraped jobs */}
        {job.description && (
          <div 
            className={`text-sm line-clamp-2 mb-3 ${
              isSelected ? 'text-primary/80' : 'text-muted-foreground'
            }`}
          >
            {job.description}
          </div>
        )}

        {/* Show descriptionHtml for manually created jobs */}
        {!job.description && job.descriptionHtml && (
          <div 
            className={`text-sm line-clamp-2 mb-3 ${
              isSelected ? 'text-primary/80' : 'text-muted-foreground'
            }`}
            dangerouslySetInnerHTML={{ 
              __html: job.descriptionHtml.substring(0, 120) + '...' 
            }}
          />
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {job.postedAt 
                ? format(new Date(job.postedAt), 'MMM d, yyyy')
                : format(new Date(job.created_date), 'MMM d, yyyy')
              }
            </span>
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${
              job.source === 'ai-scan' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-secondary text-muted-foreground border-border'
            }`}
          >
            {job.source}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
