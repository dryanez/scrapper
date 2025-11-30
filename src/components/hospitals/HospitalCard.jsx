
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ExternalLink, Briefcase, RefreshCw, BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";
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

const getHospitalLogo = (hospital) => {
  if (hospital.logoUrl) return hospital.logoUrl;
  
  const name = hospital.name.toLowerCase();
  if (name.includes('charité') || name.includes('charite')) {
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Charite_logo.svg/200px-Charite_logo.svg.png';
  }
  if (name.includes('universitätsklinikum') || name.includes('uniklinik')) {
    return 'https://placehold.co/120x60/1E40AF/FFFFFF?text=UNI';
  }
  if (name.includes('klinikum')) {
    return 'https://placehold.co/120x60/059669/FFFFFF?text=KLINIK';
  }
  return 'https://placehold.co/120x60/6366F1/FFFFFF?text=HOSPITAL';
};

export default function HospitalCard({ hospital, jobCount, onUpdate, onScan, scanningId }) {
  const isScanning = scanningId === hospital.id;

  return (
    <Link to={createPageUrl(`HospitalDetail?id=${hospital.id}`)}>
      <Card className="hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur-sm border-slate-200 flex flex-col cursor-pointer hover:border-blue-300">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
              <img
                src={getHospitalLogo(hospital)}
                alt={`${hospital.name} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = getHospitalLogo(hospital);
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1">
                {hospital.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{hospital.city}, {GERMAN_STATES[hospital.state] || hospital.state}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className="bg-blue-100 text-blue-800 flex items-center gap-1"
            >
              <Briefcase className="w-3 h-3" />
              {jobCount} Job{jobCount !== 1 ? 's' : ''}
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              {hospital.type?.replace('_', ' ') || 'Medical Facility'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-grow flex flex-col">
          <div className="space-y-2 mb-4 text-sm flex-grow">
            {hospital.specialties?.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Specialties</div>
                <div className="flex flex-wrap gap-1">
                  {hospital.specialties.slice(0, 2).map((specialty, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {hospital.specialties.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{hospital.specialties.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {hospital.bedCount && (
              <div className="text-slate-600">
                <span className="text-xs text-slate-500">Beds:</span> {hospital.bedCount}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onScan(hospital);
              }}
              disabled={!!scanningId || !hospital.careerPageUrl}
            >
              {isScanning ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Scanning...</>
              ) : (
                <><BrainCircuit className="w-4 h-4 mr-2" />Scan for Jobs</>
              )}
            </Button>
            
            <div className="flex gap-1">
              {hospital.websiteUrl && (
                <a 
                  href={hospital.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="outline" size="sm" aria-label="Visit Website">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
