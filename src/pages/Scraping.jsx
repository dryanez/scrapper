
import React, { useState, useEffect } from "react";
import { SeedUrl } from "@/api/entities";
import { Job } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Globe,
  FileSpreadsheet,
  Building2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BrainCircuit,
} from "lucide-react";

import CsvUploader from "../components/scraping/CsvUploader";
import SeedUrlList from "../components/scraping/SeedUrlList";
import HospitalGrid from "../components/scraping/HospitalGrid";
import HospitalJobsDialog from "../components/scraping/HospitalJobsDialog";
import { classifySpecialty } from "../components/utils/SpecialtyClassifier";

export default function Scraping() {
  const [seedUrls, setSeedUrls] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanActivity, setCurrentScanActivity] = useState("");
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState("urls");
  const [selectedHospital, setSelectedHospital] = useState(null);

  useEffect(() => {
    loadSeedUrls();
    loadHospitals();
  }, []);

  const loadSeedUrls = async () => {
    try {
      const data = await SeedUrl.list("-created_date");
      setSeedUrls(data);
    } catch (error) {
      console.error("Error loading seed URLs:", error);
    }
  };

  const loadHospitals = async () => {
    try {
      const { Hospital } = await import("@/api/entities");
      const hospitalData = await Hospital.list("-updated_date");

      const jobs = await Job.list("-created_date", 500);
      const hospitalJobCounts = {};

      jobs.forEach(job => {
        const key = job.hospitalId || job.hospitalName;
        if (key) hospitalJobCounts[key] = (hospitalJobCounts[key] || 0) + 1;
      });

      const hospitalsWithCounts = hospitalData.map(h => ({
        ...h,
        jobCount: hospitalJobCounts[h.id] || hospitalJobCounts[h.name] || 0,
      }));

      setHospitals(hospitalsWithCounts);
    } catch (error) {
      console.error("Error loading hospitals:", error);
    }
  };

  const handleCsvUpload = async (file) => {
    setIsUploading(true);
    setAlert(null);
    try {
        const text = await file.text();
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) throw new Error("CSV file is empty or has only a header.");

        const headers = lines[0].split(',').map(h => h.trim());
        const linkIndex = headers.indexOf("Direct Link to Job Listings");
        const cityIndex = headers.indexOf("City");
        const hospitalIndex = headers.indexOf("Hospital/Group Name");
        const logoIndex = headers.indexOf("Logo URL");
        const stateIndex = headers.indexOf("State");

        if (linkIndex === -1 || hospitalIndex === -1) {
            throw new Error("CSV must contain 'Direct Link to Job Listings' and 'Hospital/Group Name' columns.");
        }

        const urlsToCreate = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const url = values[linkIndex]?.trim();
            if (url) {
                const hospitalName = values[hospitalIndex]?.trim() || '';
                const city = values[cityIndex]?.trim() || '';
                const logoUrl = values[logoIndex]?.trim() || '';
                const state = values[stateIndex]?.trim() || '';

                urlsToCreate.push({
                    url,
                    notes: `${hospitalName}${city ? ` - ${city}` : ''}`,
                    enabled: true,
                    hospitalName: hospitalName,
                    city: city,
                    logoUrl: logoUrl,
                    state: state
                });
            }
        }

        if (urlsToCreate.length > 0) {
            await SeedUrl.bulkCreate(urlsToCreate);
            setAlert({ type: "success", message: `Successfully imported ${urlsToCreate.length} URLs.` });
            loadSeedUrls();
            setActiveTab("urls");
        } else {
            throw new Error("No valid URLs found in the CSV file.");
        }
    } catch(e) {
        setAlert({ type: "error", message: `CSV Upload Error: ${e.message}` });
    } finally {
        setIsUploading(false);
    }
  };

  const handleManualUrlAdd = async (urlData) => {
    try {
      await SeedUrl.create(urlData);
      setAlert({ type: "success", message: "URL added successfully!" });
      loadSeedUrls();
      setActiveTab("urls");
    } catch (error)
 {
      setAlert({ type: "error", message: `Error adding URL: ${error.message}` });
    }
  };

  const determineSeniority = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('chefarzt')) return 'Chefarzt';
    if (titleLower.includes('oberarzt')) return 'Oberarzt';
    if (titleLower.includes('facharzt')) return 'Facharzt';
    if (titleLower.includes('assistenzarzt')) return 'Assistenzarzt';
    return 'Other';
  };

  const runScan = async (urlsToScan) => {
    if (!urlsToScan || urlsToScan.length === 0) {
      setAlert({ type: "warning", message: "No URLs selected to scan." });
      return;
    }

    const { InvokeLLM } = await import("@/api/integrations");

    setIsScanning(true);
    setAlert({ type: "info", message: `Starting AI scan of ${urlsToScan.length} URL(s)...` });
    setScanProgress(0);
    setCurrentScanActivity("");

    let totalJobsSaved = 0;
    let totalJobsUpdated = 0;
    let successfulScans = 0;
    let failedScans = 0;

    // Fetch all existing jobs once for deduplication
    const existingJobs = await Job.list("-updated_date", 10000);
    const existingJobsByUrl = {};
    existingJobs.forEach(job => {
      if (job.jobDetailsUrl) {
        existingJobsByUrl[job.jobDetailsUrl] = job;
      }
    });

    for (let i = 0; i < urlsToScan.length; i++) {
      const seedUrl = urlsToScan[i];
      try {
        setCurrentScanActivity(`Scanning ${i + 1}/${urlsToScan.length}: ${new URL(seedUrl.url).hostname}...`);
        setScanProgress((i / urlsToScan.length) * 100);

        const isAmeos = seedUrl.url.toLowerCase().includes('ameos');
        const prompt = isAmeos
          ? `You are an expert web scraper for AMEOS group career portals. Your task is to extract relative paths for "Assistenzarzt" job listings.

**Target URL:** ${seedUrl.url}

**CRITICAL INSTRUCTIONS:**
1.  **Find "Zur Stellenanzeige":** For each "Assistenzarzt" job, find the link with the exact text "Zur Stellenanzeige".
2.  **Extract ONLY the href:** Get the 'href' attribute from that specific link. It will be a relative path like '/offene-stellen/detail/3039801.3876277'.
3.  **DO NOT INVENT LINKS:** Only return jobs where you can explicitly see and extract the 'href' from the page's HTML. If you find a job title but cannot find a valid 'href' for its "Zur Stellenanzeige" link, **DO NOT** include that job in your output. It is better to return one real job than ten fake ones.
4.  **DO NOT create a full URL.** Only return the raw relative path you extracted.

**Output Format:**
Your response must be a single JSON object.
{ "jobs_found": [ { "title": "Full job title", "href": "/offene-stellen/detail/..." } ] }`
          : `You are an automated web scraper. Your task is to extract job listings from a given URL.

**Target URL:** ${seedUrl.url}
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
                  required: ["title", "href"], 
                },
              },
            },
            required: ["jobs_found"],
          },
        });

        if (!linkAnalysis?.jobs_found?.length) {
          console.log(`No Assistenzarzt jobs found for ${seedUrl.url}.`);
          await SeedUrl.update(seedUrl.id, { lastScrapedAt: new Date().toISOString(), jobsFound: 0 });
          successfulScans++;
          continue;
        }

        const doctorJobs = linkAnalysis.jobs_found;
        console.log(`[AMEOS DEBUG] Raw AI Output for ${seedUrl.url}:`, JSON.stringify(doctorJobs, null, 2));

        const jobsToSave = [];
        const jobsToUpdate = [];

        for (let j = 0; j < doctorJobs.length; j++) {
          const jobLink = doctorJobs[j];
          if (!jobLink?.href || !jobLink?.title) continue;

          let absoluteUrl;
          try {
            // NEW: Force construction for AMEOS links from relative paths
            if (isAmeos && jobLink.href.startsWith('/')) {
                absoluteUrl = `https://karriere.ameos.eu${jobLink.href}`;
            } else {
                absoluteUrl = new URL(jobLink.href, seedUrl.url).href;
            }
            console.log(`[AMEOS DEBUG] Processing link: base='${seedUrl.url}', href='${jobLink.href}', result='${absoluteUrl}'`);
          } catch (e) {
            console.warn(`[AMEOS DEBUG] Invalid URL construction for href: "${jobLink.href}"`);
            continue;
          }

          if (absoluteUrl === seedUrl.url) {
            console.log(`Skipping a link that is identical to the seed URL: ${absoluteUrl}`);
            continue;
          }

          setCurrentScanActivity(`Processing job ${j + 1}/${doctorJobs.length}: ${jobLink.title.substring(0, 40)}...`);
          setScanProgress(((i + (j / doctorJobs.length)) / urlsToScan.length) * 100);
          
          const specialty = classifySpecialty(jobLink.title, jobLink.description);
          const seniority = determineSeniority(jobLink.title);
          
          const jobData = {
            title: jobLink.title,
            hospitalName: seedUrl.hospitalName || 'Unknown Hospital',
            city: seedUrl.city || 'Unknown',
            state: seedUrl.state || 'BE',
            specialty: specialty,
            seniority: seniority,
            descriptionHtml: jobLink.description || 'No description found.',
            jobDetailsUrl: absoluteUrl,
            sourceUrl: seedUrl.url,
            source: 'ai-scan',
            isActive: true,
            postedAt: new Date().toISOString(),
            scrapedAt: new Date().toISOString(),
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
            // Add to local map to prevent duplicates within this scan
            existingJobsByUrl[absoluteUrl] = { jobDetailsUrl: absoluteUrl };
          }
        }

        if (jobsToSave.length > 0) {
          console.log(`[AMEOS DEBUG] Saving ${jobsToSave.length} NEW jobs. Data:`, JSON.stringify(jobsToSave, null, 2));
          await Job.bulkCreate(jobsToSave);
          totalJobsSaved += jobsToSave.length;
          console.log(`✅ Saved ${jobsToSave.length} NEW Assistenzarzt jobs from ${seedUrl.url}`);
        }

        if (jobsToUpdate.length > 0) {
          console.log(`[AMEOS DEBUG] Updating ${jobsToUpdate.length} EXISTING jobs`);
          await Promise.all(jobsToUpdate.map(({ id, data }) => Job.update(id, data)));
          totalJobsUpdated += jobsToUpdate.length;
          console.log(`✅ Updated ${jobsToUpdate.length} existing jobs from ${seedUrl.url}`);
        }

        await SeedUrl.update(seedUrl.id, {
          lastScrapedAt: new Date().toISOString(),
          jobsFound: jobsToSave.length + jobsToUpdate.length,
        });

        successfulScans++;

      } catch (error) {
        console.error(`❌ Error scanning ${seedUrl.url}:`, error);
        failedScans++;
        
        await SeedUrl.update(seedUrl.id, {
          lastScrapedAt: new Date().toISOString(),
          notes: `Scan failed at ${new Date().toLocaleString()}: ${error.message.substring(0, 100)}`
        });
        
        // Continue with next URL instead of stopping
        continue;
      }
      // Add a 2-second delay between requests to avoid rate-limiting
      if (i < urlsToScan.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setScanProgress(100);
    setIsScanning(false);
    setCurrentScanActivity("");
    
    const summaryMessage = `Scan complete! 
✅ ${successfulScans} URLs scanned successfully
❌ ${failedScans} URLs failed (network/parsing issues)  
📋 ${totalJobsSaved} NEW Assistenzarzt positions created
🔄 ${totalJobsUpdated} existing positions updated`;
    
    setAlert({
      type: successfulScans > 0 ? "success" : "warning",
      message: summaryMessage
    });

    loadSeedUrls();
    loadHospitals();
  };

  const handleFullScan = () => {
    const enabledUrls = seedUrls.filter(url => url.enabled);
    runScan(enabledUrls);
  };

  const handleSingleUrlScan = (seedUrl) => {
    runScan([seedUrl]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">URL Management & Scraping</h1>
            <p className="text-slate-600">Manage hospital career page URLs and initiate AI scans.</p>
          </div>
          <Button
            onClick={handleFullScan}
            disabled={isScanning || seedUrls.filter(u => u.enabled).length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4 mr-2" />
                Scan All Enabled ({seedUrls.filter(u => u.enabled).length} URLs)
              </>
            )}
          </Button>
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
          <Alert className={`mb-6 ${alert.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50 text-yellow-800' : alert.type === 'info' ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
            {alert.type === 'error' ? <AlertCircle className="h-4 w-4" /> : alert.type === 'warning' ? <AlertCircle className="h-4 w-4" /> : alert.type === 'info' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertTitle>{alert.type === 'error' ? 'Error' : alert.type === 'warning' ? 'Warning' : alert.type === 'info' ? 'Info' : 'Success'}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" /> Upload URLs
            </TabsTrigger>
            <TabsTrigger value="urls" className="flex items-center gap-2">
              <Globe className="w-4 h-4" /> Manage URLs ({seedUrls.length})
            </TabsTrigger>
            <TabsTrigger value="hospitals" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Hospitals ({hospitals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <CsvUploader onUpload={handleCsvUpload} isUploading={isUploading} onManualAdd={handleManualUrlAdd} />
          </TabsContent>

          <TabsContent value="urls">
            <SeedUrlList
              seedUrls={seedUrls}
              onUpdate={loadSeedUrls}
              onScanUrl={handleSingleUrlScan}
              isScanning={isScanning}
            />
          </TabsContent>

          <TabsContent value="hospitals">
            <HospitalGrid hospitals={hospitals} onHospitalSelect={setSelectedHospital} />
          </TabsContent>
        </Tabs>

        {selectedHospital && (
          <HospitalJobsDialog
            hospital={selectedHospital}
            open={!!selectedHospital}
            onOpenChange={() => setSelectedHospital(null)}
          />
        )}
      </div>
    </div>
  );
}
