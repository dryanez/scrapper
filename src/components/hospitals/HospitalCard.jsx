
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, ExternalLink, Briefcase, RefreshCw, BrainCircuit, AlertTriangle, Mail, Phone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

// Parse contact info into structured format
const parseContactInfo = (contactStr) => {
  if (!contactStr) return [];
  
  const contacts = [];
  // Split by common patterns that indicate a new contact
  const parts = contactStr.split(/(?=Chefarzt|Oberarzt|Ärztlicher|Ärztliche|Chefärztin|Oberärztin|Direktor|Direktorin|Sekretariat|Personalleitung|Personalstelle|Personal\s|Prof\.\s*Dr\.|Dr\.\s*med\.|Herr\s|Frau\s)/gi);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    // Extract email from this part
    const emailMatch = trimmed.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : null;
    
    // Get the name/title (everything before the email or the whole thing)
    let title = email ? trimmed.replace(email, '').trim() : trimmed;
    title = title.replace(/\s+/g, ' ').trim();
    
    if (title || email) {
      contacts.push({ title, email });
    }
  }
  
  return contacts.slice(0, 3); // Limit to 3 contacts for card view
};

// Simplified - we try to scrape all portals now
const isExternalPortal = () => false;  // Disabled - always try to scrape

// Get portal type display info - simplified
const getPortalTypeInfo = (portalType) => {
  if (!portalType) return null;
  return {
    label: '✓ Scrapeable',
    className: 'bg-green-100 text-green-700 border-green-300',
    tooltip: 'Click Scan to find jobs'
  };
};

export default function HospitalCard({ hospital, jobCount, latestJob, onUpdate, onScan, scanningId }) {
  const navigate = useNavigate();
  const isScanning = scanningId === hospital.id;
  const portalInfo = getPortalTypeInfo(hospital.portal_type);
  const hasCareerUrl = hospital.careerPageUrl || hospital.career_page_url;
  
  // Format last scraped date
  const getLastScrapedText = () => {
    const lastScraped = hospital.last_scraped || hospital.lastScraped;
    if (!lastScraped) return null;
    
    const date = new Date(lastScraped);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('de-DE');
  };
  
  const lastScrapedText = getLastScrapedText();

  const handleCardClick = (e) => {
    // Don't navigate if clicking on interactive elements
    if (e.target.closest('a, button')) return;
    navigate(createPageUrl(`HospitalDetail?id=${hospital.id}`));
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-200 bg-card backdrop-blur-sm flex flex-col cursor-pointer border-border hover:border-primary/50`}
      onClick={handleCardClick}
    >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
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
              <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                {hospital.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{hospital.city}, {GERMAN_STATES[hospital.state] || hospital.state}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Badge 
              variant="secondary" 
              className="bg-primary/20 text-primary flex items-center gap-1"
            >
              <Briefcase className="w-3 h-3" />
              {jobCount} Job{jobCount !== 1 ? 's' : ''}
            </Badge>
            
            {/* No Career URL Badge */}
            {!hasCareerUrl && (
              <Badge 
                variant="outline" 
                className="text-xs bg-red-500/20 text-red-400 border-red-500/30"
                title="No career page URL found during scraping"
              >
                ⚠ No URL
              </Badge>
            )}
            
            {/* Last Scraped Badge */}
            {hasCareerUrl && lastScrapedText && (
              <Badge 
                variant="outline" 
                className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30"
                title={`Last scraped: ${lastScrapedText}`}
              >
                ✓ Scraped {lastScrapedText}
              </Badge>
            )}
            
            {/* Portal Type Badge */}
            {portalInfo && (
              <Badge 
                variant="outline" 
                className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                title={portalInfo.tooltip}
              >
                {portalInfo.label}
              </Badge>
            )}
          </div>
          
          {/* Warning for external portals */}
          {isExternalPortal(hospital.portal_type) && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Jobs loaded via external API - check career page manually</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 flex-grow flex flex-col">
          <div className="space-y-2 mb-4 text-sm flex-grow">
            {/* Contact Info Section */}
            {(hospital.contactEmails || hospital.contact_emails || hospital.contactInfo || hospital.contact_info || hospital.notes) && (
              <div className="space-y-2 p-2 bg-secondary/50 rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kontakt</div>
                {(() => {
                  const contacts = parseContactInfo(hospital.contactInfo || hospital.contact_info || hospital.notes);
                  if (contacts.length > 0) {
                    return (
                      <div className="space-y-1.5">
                        {contacts.slice(0, 2).map((contact, idx) => (
                          <div key={idx} className="text-xs">
                            {contact.title && (
                              <div className="text-muted-foreground font-medium truncate">
                                {contact.title.substring(0, 50)}{contact.title.length > 50 ? '...' : ''}
                              </div>
                            )}
                            {contact.email && (
                              <a 
                                href={`mailto:${contact.email}`}
                                className="text-primary hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Mail className="w-3 h-3" />
                                {contact.email}
                              </a>
                            )}
                          </div>
                        ))}
                        {contacts.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{contacts.length - 2} more contacts
                          </div>
                        )}
                      </div>
                    );
                  } else if (hospital.contactEmails || hospital.contact_emails) {
                    const email = (hospital.contactEmails || hospital.contact_emails).split(',')[0].trim();
                    return (
                      <a 
                        href={`mailto:${email}`}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="w-3 h-3" />
                        {email}
                      </a>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
            
            {hospital.specialties?.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Specialties</div>
                <div className="flex flex-wrap gap-1">
                  {hospital.specialties.slice(0, 2).map((specialty, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-border">
                      {specialty}
                    </Badge>
                  ))}
                  {hospital.specialties.length > 2 && (
                    <Badge variant="outline" className="text-xs border-border">
                      +{hospital.specialties.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {hospital.bedCount && (
              <div className="text-muted-foreground">
                <span className="text-xs text-muted-foreground">Beds:</span> {hospital.bedCount}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onScan(hospital);
              }}
              disabled={!!scanningId || !hasCareerUrl}
            >
              {isScanning ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Scanning...</>
              ) : (
                <><BrainCircuit className="w-4 h-4 mr-2" />Scan for Jobs</>
              )}
            </Button>
            
            <div className="flex gap-1">
              {(hospital.websiteUrl || hospital.website_url) && (
                <a 
                  href={hospital.websiteUrl || hospital.website_url} 
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
          
          {/* Last scraped info */}
          {lastScrapedText && (
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Last scanned: {lastScrapedText}
            </div>
          )}
        </CardContent>
      </Card>
  );
}
