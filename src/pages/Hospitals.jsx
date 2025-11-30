
import React, { useState, useEffect } from "react";
import { Hospital } from "@/api/entities";
import { Job } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Building2, MapPin, RefreshCw, BrainCircuit, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Trash2 } from "lucide-react";

import HospitalForm from "../components/hospitals/HospitalForm";
import HospitalCsvUploader from "../components/hospitals/HospitalCsvUploader";
import HospitalCard from "../components/hospitals/HospitalCard";
import { classifySpecialty } from "../components/utils/SpecialtyClassifier";

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

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [hospitalJobCounts, setHospitalJobCounts] = useState({}); // Keep for backward compatibility or if needed elsewhere
  const [activeTab, setActiveTab] = useState("list");
  const [alert, setAlert] = useState(null);
  
  // State for single hospital scanning
  const [scanningHospitalId, setScanningHospitalId] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanActivity, setCurrentScanActivity] = useState("");

  // New state for expanding state lists
  const [expandedStates, setExpandedStates] = useState({});

  // New state for deletion
  const [isDeleting, setIsDeleting] = useState(false);
  const [stateToDelete, setStateToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    setIsLoading(true);
    try {
      const [hospitalData, jobData] = await Promise.all([
        Hospital.list("-updated_date"),
        Job.list("-created_date", 1000) // Increased limit to get more jobs
      ]);
      
      const jobCounts = {};
      jobData.forEach(job => {
        const hospitalKey = job.hospitalId || job.hospitalName;
        if (hospitalKey) {
          jobCounts[hospitalKey] = (jobCounts[hospitalKey] || 0) + 1;
        }
      });
      
      const hospitalsWithJobData = hospitalData.map(h => {
        const jobsForHospital = jobData.filter(j => j.hospitalId === h.id || j.hospitalName === h.name);
        const latestJobDate = jobsForHospital.length > 0
          ? jobsForHospital.reduce((latest, job) => new Date(job.created_date) > latest ? new Date(job.created_date) : latest, new Date(0))
          : null;

        return {
          ...h,
          jobCount: jobCounts[h.id] || jobCounts[h.name] || 0,
          latestJob: latestJobDate
        };
      });

      setHospitals(hospitalsWithJobData);
      setHospitalJobCounts(jobCounts); // Update the old state for any other components still using it
    } catch (error) {
      console.error("Error loading hospitals:", error);
      setAlert({ type: "error", message: `Error loading hospitals: ${error.message}` });
    }
    setIsLoading(false);
  };
  
  const runBatchScan = async (hospitalsToScan) => {
    if (!hospitalsToScan || hospitalsToScan.length === 0) {
      setAlert({ type: "warning", message: "No hospitals with a career page URL found to scan." });
      return;
    }

    setScanningHospitalId('batch-scan');
    setAlert({ type: "info", message: `Starting AI scan for ${hospitalsToScan.length} hospital(s)...` });
    setScanProgress(0);
    
    const { InvokeLLM } = await import("@/api/integrations");
    let totalJobsSaved = 0;
    let totalJobsUpdated = 0; // Added for deduplication tracking
    let successfulScans = 0;
    let failedScans = 0;

    // Fetch all existing jobs once at the start for deduplication
    const existingJobs = await Job.list("-updated_date", 10000);
    const existingJobsByUrl = {};
    existingJobs.forEach(job => {
      if (job.jobDetailsUrl) {
        existingJobsByUrl[job.jobDetailsUrl] = job;
      }
    });

    for (let i = 0; i < hospitalsToScan.length; i++) {
      const hospital = hospitalsToScan[i];
      const overallProgress = ((i) / hospitalsToScan.length) * 100;
      setCurrentScanActivity(`Scanning ${i + 1}/${hospitalsToScan.length}: ${hospital.name}`);
      setScanProgress(overallProgress);

      if (!hospital.careerPageUrl) {
          console.log(`Skipping ${hospital.name} - no career page URL.`);
          continue;
      }

      try {
        const isAmeos = hospital.careerPageUrl?.toLowerCase().includes('ameos');
        const prompt = isAmeos
          ? `You are an expert web scraper for AMEOS group career portals. Your task is to extract relative paths for "Assistenzarzt" job listings.

**Target URL:** ${hospital.careerPageUrl}

**CRITICAL INSTRUCTIONS:**
1.  **Find "Zur Stellenanzeige":** For each "Assistenzarzt" job, find the link with the exact text "Zur Stellenanzeige".
2.  **Extract ONLY the href:** Get the 'href' attribute from that specific link. It will be a relative path like '/offene-stellen/detail/3039801.3876277'.
3.  **DO NOT INVENT LINKS:** Only return jobs where you can explicitly see and extract the 'href' from the page's HTML. If you find a job title but cannot find a valid 'href' for its "Zur Stellenanzeige" link, **DO NOT** include that job in your output. It is better to return one real job than ten fake ones.
4.  **DO NOT create a full URL.** Only return the raw relative path you extracted.

**Output Format:**
Your response must be a single JSON object.
{ "jobs_found": [ { "title": "Full job title", "href": "/offene-stellen/detail/..." } ] }`
          : `You are an automated web scraper. Your task is to extract job listings from a given URL.

**Target URL:** ${hospital.careerPageUrl}
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
}
If no jobs are found, return an empty array: { "jobs_found": [] }`;
        
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
                  required: ["title", "href"], // Made description optional
                },
              },
            },
            required: ["jobs_found"],
          },
        });

        if (!linkAnalysis?.jobs_found?.length) {
          console.log(`No jobs found for ${hospital.name}`);
          successfulScans++;
          continue;
        }
        
        console.log(`[AMEOS DEBUG] Raw AI Output for ${hospital.name}:`, JSON.stringify(linkAnalysis.jobs_found, null, 2));

        let jobsToSave = [];
        let jobsToUpdate = [];
        
        for (const jobLink of linkAnalysis.jobs_found) {
            if (!jobLink?.href || !jobLink?.title) continue;
            
            let absoluteUrl;
            try {
              // **NEW:** Force construction for AMEOS links from relative paths
              if (isAmeos && jobLink.href.startsWith('/')) {
                absoluteUrl = `https://karriere.ameos.eu${jobLink.href}`;
              } else {
                absoluteUrl = new URL(jobLink.href, hospital.careerPageUrl).href;
              }
              console.log(`[AMEOS DEBUG] Processing link: base='${hospital.careerPageUrl}', href='${jobLink.href}', result='${absoluteUrl}'`);
            } catch (urlError) {
              console.warn(`[AMEOS DEBUG] Invalid URL for job: ${jobLink.href}`);
              continue;
            }
            
            if (absoluteUrl === hospital.careerPageUrl) continue;
            
            const specialty = classifySpecialty(jobLink.title, jobLink.description);
            
            const jobData = {
                title: jobLink.title,
                hospitalId: hospital.id,
                hospitalName: hospital.name,
                city: hospital.city,
                state: hospital.state,
                specialty: specialty,
                seniority: "Assistenzarzt",
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
                data: jobData
              });
            } else {
              // New job, add to create list
              jobsToSave.push(jobData);
              // Add to our local map to prevent duplicates within this scan
              // This is a minimal representation, just enough to mark it as "seen"
              existingJobsByUrl[absoluteUrl] = { jobDetailsUrl: absoluteUrl }; 
            }
        }

        if (jobsToSave.length > 0) {
            console.log(`[AMEOS DEBUG] Saving ${jobsToSave.length} NEW jobs. Data:`, JSON.stringify(jobsToSave, null, 2));
            await Job.bulkCreate(jobsToSave);
            totalJobsSaved += jobsToSave.length;
            console.log(`✅ ${hospital.name}: Created ${jobsToSave.length} new jobs`);
        }

        if (jobsToUpdate.length > 0) {
            console.log(`[AMEOS DEBUG] Updating ${jobsToUpdate.length} EXISTING jobs`);
            await Promise.all(jobsToUpdate.map(({ id, data }) => Job.update(id, data)));
            totalJobsUpdated += jobsToUpdate.length;
            console.log(`✅ ${hospital.name}: Updated ${jobsToUpdate.length} existing jobs`);
        }
        
        successfulScans++;

      } catch (error) {
        console.error(`❌ Scan failed for ${hospital.name}:`, error.message);
        failedScans++;
        
        // Continue to the next hospital instead of stopping
        setAlert({ 
          type: "warning", 
          message: `Scan issues: ${failedScans} failed, ${successfulScans} successful. Continuing...` 
        });
      }
      
      // Increased delay to avoid overwhelming the servers and causing 429 errors
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setScanProgress(100);
    setCurrentScanActivity("Scan complete!");
    
    const summaryMessage = `Batch scan complete! 
✅ ${successfulScans} hospitals scanned successfully
❌ ${failedScans} hospitals failed (network/parsing issues)
📋 ${totalJobsSaved} NEW Assistenzarzt jobs created
🔄 ${totalJobsUpdated} existing jobs updated`;

    setAlert({ 
      type: successfulScans > 0 ? "success" : "warning", 
      message: summaryMessage 
    });

    setTimeout(() => {
        setScanningHospitalId(null);
        setCurrentScanActivity("");
        loadHospitals();
    }, 3000);
  };

  const handleScanHospital = async (hospital) => {
    // The previous implementation was a two-step LLM process, now simplified
    // to use the new batch scan function with a single hospital for consistency.
    if (!hospital.careerPageUrl) {
      setAlert({ type: "error", message: "This hospital has no career page URL to scan for jobs." });
      return;
    }
    runBatchScan([hospital]);
  };
  
  const handleScanAllHospitals = () => {
    const hospitalsToScan = hospitals.filter(h => h.careerPageUrl);
    runBatchScan(hospitalsToScan);
  };
  
  const handleScanStateHospitals = (stateCode) => {
    const hospitalsToScan = hospitals.filter(h => h.state === stateCode && h.careerPageUrl);
    runBatchScan(hospitalsToScan);
  };

  const handleHospitalSubmit = async (hospitalData) => {
    try {
      await Hospital.create(hospitalData);
      setAlert({ type: "success", message: "Hospital added successfully!" });
      loadHospitals();
      setActiveTab("list");
    } catch (error) {
      setAlert({ type: "error", message: `Error adding hospital: ${error.message}` });
    }
  };

  const handleOpenDeleteDialog = (stateCode) => {
    setStateToDelete(stateCode);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteState = async () => {
    if (!stateToDelete) return;
    
    setIsDeleting(true);
    setAlert({ type: "info", message: `Deleting all hospitals from ${GERMAN_STATES[stateToDelete]}...` });

    try {
      const hospitalsToDelete = hospitals.filter(h => h.state === stateToDelete);
      await Promise.all(hospitalsToDelete.map(h => Hospital.delete(h.id)));
      
      setAlert({ type: "success", message: `Successfully deleted ${hospitalsToDelete.length} hospitals from ${GERMAN_STATES[stateToDelete]}.` });
      loadHospitals();
    } catch (error) {
      console.error("Error deleting hospitals:", error);
      setAlert({ type: "error", message: `Error deleting hospitals: ${error.message}` });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setStateToDelete(null);
    }
  };

  const filteredHospitals = hospitals.filter(hospital => {
    const matchesSearch = !searchTerm || 
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = selectedState === "all" || hospital.state === selectedState;
    
    return matchesSearch && matchesState;
  });

  // Group hospitals by state for better organization
  const hospitalsByState = filteredHospitals.reduce((acc, hospital) => {
    const state = hospital.state || 'Unknown';
    if (!acc[state]) acc[state] = [];
    acc[state].push(hospital);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Hospital Management</h1>
            <p className="text-slate-600">Manage hospitals across all German federal states</p>
          </div>
          <Button 
            onClick={handleScanAllHospitals}
            disabled={!!scanningHospitalId || isDeleting || hospitals.filter(h => h.careerPageUrl).length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <BrainCircuit className="w-4 h-4 mr-2" />
            Scan All Hospitals
          </Button>
        </div>
        
        {scanningHospitalId && (
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
            <AlertTitle>{alert.type === 'error' ? 'Error' : alert.type === 'info' ? 'Info' : alert.type === 'warning' ? 'Warning' : 'Success'}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Hospitals ({hospitals.length})
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Hospital
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              CSV Upload
            </TabsTrigger>
            <TabsTrigger value="states" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              By States
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {/* Search and Filter Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search hospitals by name or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-200 h-12"
                />
              </div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-64 bg-white border-slate-200 h-12">
                  <SelectValue placeholder="Filter by state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {Object.entries(GERMAN_STATES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Card className="w-48">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Total</div>
                    <div className="text-xl font-bold text-slate-900">{filteredHospitals.length}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hospital Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <Card className="h-80 bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : filteredHospitals.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {searchTerm || selectedState !== "all" ? 'No matching hospitals' : 'No hospitals yet'}
                </h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm || selectedState !== "all" 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Add hospitals manually or upload via CSV'
                  }
                </p>
                <Button onClick={() => setActiveTab("add")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hospital
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredHospitals.map((hospital) => (
                  <HospitalCard 
                    key={hospital.id} 
                    hospital={hospital}
                    jobCount={hospital.jobCount} // Use the jobCount directly from hospital object
                    latestJob={hospital.latestJob} // Pass latestJob for display
                    onUpdate={loadHospitals}
                    onScan={handleScanHospital}
                    scanningId={scanningHospitalId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add">
            <HospitalForm onSubmit={handleHospitalSubmit} />
          </TabsContent>

          <TabsContent value="upload">
            <HospitalCsvUploader onSuccess={loadHospitals} setAlert={setAlert} />
          </TabsContent>

          <TabsContent value="states">
            <div className="space-y-8">
              {Object.entries(GERMAN_STATES).map(([stateCode, stateName]) => {
                const stateHospitals = hospitals.filter(h => h.state === stateCode);
                if (stateHospitals.length === 0) return null;
                
                const isExpanded = expandedStates[stateCode];
                const displayedHospitals = isExpanded ? stateHospitals : stateHospitals.slice(0, 6);

                return (
                  <div key={stateCode} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-slate-900">{stateName}</h2>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {stateHospitals.length} hospital{stateHospitals.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleScanStateHospitals(stateCode)}
                          disabled={!!scanningHospitalId || isDeleting || stateHospitals.filter(h => h.careerPageUrl).length === 0}
                        >
                          <BrainCircuit className="w-4 h-4 mr-2" />
                          Scan State
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenDeleteDialog(stateCode)}
                          disabled={isDeleting || !!scanningHospitalId}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete State
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {displayedHospitals.map((hospital) => (
                        <HospitalCard 
                          key={hospital.id} 
                          hospital={hospital}
                          jobCount={hospital.jobCount} // Use the jobCount directly from hospital object
                          latestJob={hospital.latestJob} // Pass latestJob for display
                          onUpdate={loadHospitals}
                          onScan={handleScanHospital}
                          scanningId={scanningHospitalId}
                        />
                      ))}
                    </div>
                    {stateHospitals.length > 6 && (
                      <div className="text-center mt-4">
                        <Button 
                          variant="ghost" 
                          onClick={() => setExpandedStates(prev => ({ ...prev, [stateCode]: !isExpanded }))}
                        >
                          {isExpanded ? 'Show Less' : `Show ${stateHospitals.length - 6} More`}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all 
              {' '}<span className="font-bold">{hospitals.filter(h => h.state === stateToDelete).length}</span>{' '}
              hospitals from <span className="font-bold">{GERMAN_STATES[stateToDelete]}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteState}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, delete them"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
