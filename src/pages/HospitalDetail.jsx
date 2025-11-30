
import React, { useState, useEffect, useCallback } from "react";
import { Hospital } from "@/api/entities";
import { Job } from "@/api/entities";
import { SeedUrl } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, ExternalLink, Mail, Phone, MapPin, Globe, Building2, Briefcase, Users, BrainCircuit, RefreshCw, CheckCircle, AlertCircle, ChevronsUpDown, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import JobCard from "../components/dashboard/JobCard";
import HospitalEditDialog from "../components/hospitals/HospitalEditDialog";
import { classifySpecialty } from "../components/utils/SpecialtyClassifier"; // Added import

const GERMAN_STATES = {
  "BW": "Baden-Württemberg", "BY": "Bayern", "BE": "Berlin", "BB": "Brandenburg", "HB": "Bremen",
  "HH": "Hamburg", "HE": "Hessen", "MV": "Mecklenburg-Vorpommern", "NI": "Niedersachsen",
  "NW": "Nordrhein-Westfalen", "RP": "Rheinland-Pfalz", "SL": "Saarland", "SN": "Sachsen",
  "ST": "Sachsen-Anhalt", "SH": "Schleswig-Holstein", "TH": "Thüringen"
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

export default function HospitalDetail() {
  const [hospital, setHospital] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [careerUrl, setCareerUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanActivity, setCurrentScanActivity] = useState("");
  const [alert, setAlert] = useState(null);
  const [otherJobsOpen, setOtherJobsOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const loadData = useCallback(async (hospitalId) => {
    setIsLoading(true);
    try {
      const [hospitalData] = await Hospital.filter({ id: hospitalId });
      setHospital(hospitalData);
      setCareerUrl(null);

      if (hospitalData) {
        const [jobsByName, jobsById] = await Promise.all([
          Job.filter({ hospitalName: hospitalData.name }, "-created_date", 100),
          hospitalData.id ? Job.filter({ hospitalId: hospitalData.id }, "-created_date", 100) : Promise.resolve([])
        ]);

        const existingIds = new Set(jobsByName.map(j => j.id));
        const uniqueJobsById = jobsById.filter(j => !existingIds.has(j.id));
        const allJobs = [...jobsByName, ...uniqueJobsById];
        
        setJobs(allJobs);

        if (hospitalData.careerPageUrl) {
            setCareerUrl(hospitalData.careerPageUrl);
        } else {
            const matchingSeeds = await SeedUrl.filter({ hospitalName: hospitalData.name });
            if (matchingSeeds.length > 0) {
                setCareerUrl(matchingSeeds[0].url);
            }
        }
      }
    } catch (error) {
      console.error("Error loading hospital details:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hospitalId = urlParams.get('id');
    if (hospitalId) {
      loadData(hospitalId);
    } else {
      setIsLoading(false);
    }
  }, [loadData]);
  
  const determineSeniority = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('chefarzt') || titleLower.includes('chefarztin')) return 'Chefarzt';
    if (titleLower.includes('oberarzt') || titleLower.includes('oberärztin')) return 'Oberarzt';
    if (titleLower.includes('facharzt') || titleLower.includes('fachärztin')) return 'Facharzt';
    if (titleLower.includes('assistenzarzt') || titleLower.includes('assistenzärztin')) return 'Assistenzarzt';
    return 'Other';
  };

  const handleScanHospital = async () => {
    const urlToScan = hospital.careerPageUrl;
    if (!urlToScan) {
      setAlert({ type: "error", message: "This hospital has no Career Page URL set. Please edit the hospital to add one." });
      return;
    }
    
    setIsScanning(true);
    setAlert({ type: "info", message: `Starting scan for individual job postings at ${hospital.name}...` });
    setScanProgress(0);
    setCurrentScanActivity("Initiating scan...");

    const { InvokeLLM } = await import("@/api/integrations");

    // Fetch existing jobs for deduplication
    const existingJobs = await Job.list("-updated_date", 10000); // Fetch a recent set of jobs for deduplication
    const existingJobsByUrl = {};
    existingJobs.forEach(job => {
      if (job.jobDetailsUrl) {
        existingJobsByUrl[job.jobDetailsUrl] = job;
      }
    });

    try {
      setCurrentScanActivity(`Scanning ${new URL(urlToScan).hostname} for Assistenzarzt jobs...`);
      setScanProgress(25);
      
      const isAmeos = urlToScan.toLowerCase().includes('ameos');
      const prompt = isAmeos
        ? `You are an expert web scraper for AMEOS group career portals. Your task is to extract relative paths for "Assistenzarzt" job listings.

**Target URL:** ${urlToScan}

**CRITICAL INSTRUCTIONS:**
1.  **Find "Zur Stellenanzeige":** For each "Assistenzarzt" job, find the link with the exact text "Zur Stellenanzeige".
2.  **Extract ONLY the href:** Get the 'href' attribute from that specific link. It will be a relative path like '/offene-stellen/detail/3039801.3876277'.
3.  **DO NOT INVENT LINKS:** Only return jobs where you can explicitly see and extract the 'href' from the page's HTML. If you find a job title but cannot find a valid 'href' for its "Zur Stellenanzeige" link, **DO NOT** include that job in your output. It is better to return one real job than ten fake ones.
4.  **DO NOT create a full URL.** Only return the raw relative path you extracted.

**Output Format:**
Your response must be a single JSON object.
{ "jobs_found": [ { "title": "Full job title", "href": "/offene-stellen/detail/..." } ] }`
        : `You are an automated web scraper. Your task is to extract job listings from a given URL.

**Target URL:** ${urlToScan}
**Keyword:** Assistenzarzt

**Instructions:**
1. Access the URL and find all job listings that include the keyword "Assistenzarzt" in the title.
2. For each matching job, extract the following information:
   - \`title\`: The full job title.
   - \`href\`: The direct, absolute URL to the job's detail page.
   - \`description\`: A brief summary of the job. If no summary is available, this field can be omitted.

**Output Format:**
Your entire response must be a single JSON object. Do not include any text, explanations, or code formatting before or after the JSON. The JSON structure must be:
{
  "jobs_found": [
    {
      "title": "Full job title",
      "href": "https://.../direct-link-to-job",
      "description": "Brief job summary..."
    }
  ]
}`;
      
      const linkAnalysis = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            jobs_found: {
              type: "array",
              items: {
                type: "object",
                properties: { 
                  title: { type: "string" }, 
                  href: { type: "string" },
                  description: { type: "string" }
                },
                required: ["title", "href"],
              },
            },
          },
          required: ["jobs_found"],
        },
      });

      const doctorJobs = linkAnalysis?.jobs_found || [];
      console.log(`[AMEOS DEBUG] Raw AI Output for ${hospital.name}:`, JSON.stringify(doctorJobs, null, 2));
      setScanProgress(75);

      let jobsToSave = [];
      let jobsToUpdate = [];
      
      for (let j = 0; j < doctorJobs.length; j++) {
        const jobLink = doctorJobs[j];
        if (!jobLink?.href || !jobLink?.title) {
          console.warn("Skipping job entry with missing href or title.", jobLink);
          continue;
        }

        let absoluteUrl;
        try {
          // NEW: Force construction for AMEOS links from relative paths
          if (isAmeos && jobLink.href.startsWith('/')) {
            absoluteUrl = `https://karriere.ameos.eu${jobLink.href}`;
          } else {
            absoluteUrl = new URL(jobLink.href, urlToScan).href;
          }
          console.log(`[AMEOS DEBUG] Processing link: base='${urlToScan}', href='${jobLink.href}', result='${absoluteUrl}'`);
        } catch (e) {
          console.warn(`[AMEOS DEBUG] Invalid URL construction for href: "${jobLink.href}". Error: ${e.message}`);
          continue;
        }

        if (absoluteUrl === urlToScan) {
            console.log(`Skipping a link that is identical to the seed URL: ${absoluteUrl}`);
            continue;
        }

        setCurrentScanActivity(`Processing job ${j + 1}/${doctorJobs.length}: ${jobLink.title.substring(0, 50)}...`);
        setScanProgress(75 + ((j + 1) / doctorJobs.length) * 20); // Progress from 75% to 95%

        const specialty = classifySpecialty(jobLink.title, jobLink.description);
        const seniority = determineSeniority(jobLink.title);
        
        const jobData = {
          title: jobLink.title,
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          city: hospital.city,
          state: hospital.state,
          specialty: specialty,
          seniority: seniority,
          descriptionHtml: jobLink.description || "",
          jobDetailsUrl: absoluteUrl,
          source: 'ai-scan',
          postedAt: new Date().toISOString(),
        };

        // Check if job already exists
        if (existingJobsByUrl[absoluteUrl]) {
          // Job exists, add to update list
          jobsToUpdate.push({
            id: existingJobsByUrl[absoluteUrl].id,
            data: jobData // jobData includes updated postedAt
          });
        } else {
          // New job, add to create list
          jobsToSave.push(jobData);
          // Add to local map to prevent duplicates within this scan
          // A minimal object is sufficient to mark presence for deduplication during this specific scan.
          existingJobsByUrl[absoluteUrl] = { jobDetailsUrl: absoluteUrl }; 
        }
      }
      
      if (jobsToSave.length > 0) {
        console.log(`[AMEOS DEBUG] Saving ${jobsToSave.length} NEW jobs. Data:`, JSON.stringify(jobsToSave, null, 2));
        await Job.bulkCreate(jobsToSave);
      }

      if (jobsToUpdate.length > 0) {
        console.log(`[AMEOS DEBUG] Updating ${jobsToUpdate.length} EXISTING jobs`);
        await Promise.all(jobsToUpdate.map(({ id, data }) => Job.update(id, data)));
      }

      const totalProcessed = jobsToSave.length + jobsToUpdate.length;
      
      if (totalProcessed > 0) {
        setAlert({ 
          type: "success", 
          message: `Scan complete! ${jobsToSave.length} new jobs created, ${jobsToUpdate.length} existing jobs updated for ${hospital.name}.` 
        });
        loadData(hospital.id);
      } else {
        setAlert({ type: "warning", message: `Scan complete. No new "Assistenzarzt" positions were found for ${hospital.name}.` });
      }

    } catch (error) {
      console.error("Scan failed:", error);
      let errorMessage = `Scan failed for ${hospital.name}: `;
      
      if (error.message?.includes('Network Error')) {
        errorMessage += "Network connection issue. The website may be slow or blocking requests.";
      } else if (error.message?.includes('JSON')) {
        errorMessage += "Data parsing issue. The AI model might have returned malformed JSON, or the website structure changed.";
      } else {
        errorMessage += error.message;
      }
      
      setAlert({ type: "error", message: errorMessage });
    } finally {
      setScanProgress(100);
      setTimeout(() => {
        setIsScanning(false);
        setCurrentScanActivity("");
      }, 2000);
    }
  };

  const handleSaveHospital = async (hospitalData) => {
    try {
      await Hospital.update(hospital.id, hospitalData);
      setAlert({ type: "success", message: "Hospital information updated successfully!" });
      setShowEditDialog(false);
      loadData(hospital.id);
    } catch (error) {
      setAlert({ type: "error", message: `Error updating hospital: ${error.message}` });
    }
  };

  // Function to make emails clickable while preserving all other text
  const renderContactInfo = (text) => {
    if (!text) return null;
    
    // Split by email pattern but keep the emails
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const parts = text.split(emailRegex);
    
    return parts.map((part, index) => {
      // Check if this part is an email
      if (emailRegex.test(part)) {
        return (
          <a
            key={index}
            href={`mailto:${part}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {part}
          </a>
        );
      }
      // Return regular text
      return part;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Hospital Not Found</h1>
        <Link to={createPageUrl("Hospitals")}>
          <Button>Back to Hospitals</Button>
        </Link>
      </div>
    );
  }

  const mainJobs = jobs.filter(job => job.seniority !== 'Other');
  const otherJobs = jobs.filter(job => job.seniority === 'Other');
  
  const hospitalForEdit = hospital ? {
    ...hospital,
    careerPageUrl: careerUrl || hospital.careerPageUrl || ''
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to={createPageUrl("Hospitals")} className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hospitals
          </Link>
        </div>

        {isScanning && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <div>
                  <div className="font-semibold text-blue-900">{currentScanActivity}</div>
                  <div className="text-sm text-blue-700">{Math.round(scanProgress)}% complete</div>
                </div>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {alert && (
          <Alert className={`mb-6 ${alert.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : alert.type === 'info' ? 'border-blue-200 bg-blue-50 text-blue-800' : alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50 text-yellow-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
            {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : alert.type === 'warning' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertTitle>{alert.type === 'error' ? 'Error' : alert.type === 'warning' ? 'Warning' : alert.type === 'info' ? 'Info' : 'Success'}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:col-span-3 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
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
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{hospital.name}</CardTitle>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span>{hospital.city}, {GERMAN_STATES[hospital.state]}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3">
                  {hospital.websiteUrl && (
                    <a href={hospital.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                      <Globe className="w-4 h-4" />
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {careerUrl && (
                    <a href={careerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 hover:text-green-800 font-medium">
                      <Briefcase className="w-4 h-4" />
                      View Career Page
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {hospital.type && (
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <Badge variant="outline">{hospital.type.replace('_', ' ')}</Badge>
                  </div>
                )}

                {hospital.specialties && hospital.specialties.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-900 mb-2">Specialties</div>
                    <div className="flex flex-wrap gap-1">
                      {hospital.specialties.map((specialty, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {hospital.bedCount && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">{hospital.bedCount} beds</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleScanHospital}
                    disabled={isScanning || !hospital.careerPageUrl}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isScanning ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Scanning...</>
                    ) : (
                      <><BrainCircuit className="w-4 h-4 mr-2" />Scan for New Jobs</>
                    )}
                  </Button>

                  <Button 
                    onClick={() => setShowEditDialog(true)}
                    variant="outline"
                    size="icon"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {hospital.notes && (
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-800 whitespace-pre-wrap font-mono overflow-x-auto">
                    {renderContactInfo(hospital.notes)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Open Positions ({mainJobs.length})
                  </div>
                  <Badge variant="outline">
                    Latest: {jobs.length > 0 ? format(new Date(jobs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0].created_date), 'MMM d') : 'None'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mainJobs.length === 0 && otherJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Jobs Found</h3>
                    <p className="text-slate-500 mb-4">Try scanning for jobs to discover new positions</p>
                    <Button onClick={handleScanHospital} disabled={isScanning || !hospital.careerPageUrl}>
                      <BrainCircuit className="w-4 h-4 mr-2" />
                      Scan Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mainJobs.length > 0 ? (
                      mainJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          isSelected={false}
                          onClick={() => {}}
                        />
                      ))
                    ) : (
                      <p className="text-center text-slate-500 py-4">No positions found for main seniority levels.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {otherJobs.length > 0 && (
              <Collapsible open={otherJobsOpen} onOpenChange={setOtherJobsOpen}>
                <Card className="bg-white/90 backdrop-blur-sm">
                  <CollapsibleTrigger asChild>
                    <div className="p-4 border-b flex justify-between items-center cursor-pointer hover:bg-slate-50">
                      <CardTitle className="text-base flex items-center gap-2">
                        Other Positions ({otherJobs.length})
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-4 space-y-4">
                      {otherJobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          isSelected={false}
                          onClick={() => {}}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
          </div>
        </div>

        {hospitalForEdit && (
          <HospitalEditDialog 
            hospital={hospitalForEdit}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSave={handleSaveHospital}
          />
        )}
      </div>
    </div>
  );
}
