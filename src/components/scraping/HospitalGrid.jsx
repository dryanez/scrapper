
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, ExternalLink, Briefcase } from "lucide-react";

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
  
  return 'https://placehold.co/120x60/6366F1/FFFFFF?text=HOSPITAL';
};

export default function HospitalGrid({ hospitals, onHospitalSelect }) {
  return (
    <div className="space-y-6">
      {hospitals.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No hospitals found</h3>
          <p className="text-slate-500">Start scraping URLs to discover hospitals and their job openings</p>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Discovered Hospitals ({hospitals.length})
            </h2>
            <Badge variant="outline" className="text-sm">
              Total Jobs: {hospitals.reduce((sum, h) => sum + h.jobCount, 0)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-200 bg-white cursor-pointer hover:border-blue-400"
                onClick={() => onHospitalSelect(hospital)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src={hospital.logo || getHospitalLogo(hospital.name)}
                        alt={`${hospital.name} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = getHospitalLogo(hospital.name);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2 line-clamp-2">
                        {hospital.name}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-slate-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{hospital.city}, {GERMAN_STATES[hospital.state] || hospital.state}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="secondary" 
                        className="bg-blue-100 text-blue-800 flex items-center gap-1"
                      >
                        <Briefcase className="w-3 h-3" />
                        {hospital.jobCount} {hospital.jobCount === 1 ? 'Position' : 'Positions'}
                      </Badge>
                      
                      {hospital.website && (
                        <a
                          href={hospital.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      Latest job: {new Date(hospital.latestJob).toLocaleDateString()}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-sm font-medium text-slate-700 mb-2">Hospital Type</div>
                      <Badge variant="outline" className="text-xs">
                        {hospital.name.toLowerCase().includes('universitätsklinikum') || 
                         hospital.name.toLowerCase().includes('uniklinik') ? 
                         'University Hospital' : 
                         hospital.name.toLowerCase().includes('klinikum') ? 
                         'General Hospital' : 
                         'Medical Facility'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
