import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Globe,
  Briefcase,
  Building2,
  ExternalLink,
  Save,
  MapPin,
  Pause
} from "lucide-react";
import { scrapeMultipleHospitals } from "@/services/jobScraper";
import { 
  saveJobsInBackground, 
  subscribeToSaveProgress, 
  getSaveState,
  cancelSave 
} from "@/services/backgroundJobSaver";
import { 
  getScrapingState, 
  startScrapingSession, 
  updateScrapingProgress, 
  addScrapingResult,
  pauseScraping as pauseScrapingService,
  resumeScraping as resumeScrapingService,
  stopScraping,
  subscribeToScrapingState
} from "@/services/scrapingService";

export default function HospitalJobScanner({ hospitals, onJobsScraped }) {
  const [isScanning, setIsScanning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [currentMessage, setCurrentMessage] = useState('');
  const [results, setResults] = useState([]);
  const [selectedHospitals, setSelectedHospitals] = useState(new Set());
  const [allJobs, setAllJobs] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);
  const [previewJob, setPreviewJob] = useState(null);

  // Filter hospitals that have career URLs
  const scrapableHospitals = hospitals.filter(h => h.career_page_url || h.careerPageUrl);
  
  // Hospitals without URLs
  const hospitalsWithoutUrl = hospitals.filter(h => !h.career_page_url && !h.careerPageUrl);

  // Resume state from localStorage on mount
  useEffect(() => {
    const state = getScrapingState();
    if (state && state.isRunning) {
      setIsScanning(true);
      setIsPaused(state.isPaused);
      setProgress({
        current: state.currentIndex,
        total: state.totalUrls,
        percentage: state.totalUrls > 0 ? Math.round((state.currentIndex / state.totalUrls) * 100) : 0
      });
      setCurrentMessage(state.currentUrl ? `Scanning ${state.currentUrl}...` : '');
    }
    
    // Check if there's a save in progress
    const saveState = getSaveState();
    if (saveState && saveState.isRunning) {
      setIsSaving(true);
      setSaveProgress(saveState);
    }
  }, []);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribeToScrapingState((state) => {
      if (state) {
        setIsScanning(state.isRunning);
        setIsPaused(state.isPaused);
        setProgress({
          current: state.currentIndex,
          total: state.totalUrls,
          percentage: state.totalUrls > 0 ? Math.round((state.currentIndex / state.totalUrls) * 100) : 0
        });
        
        if (!state.isRunning) {
          setCurrentMessage('Scan complete!');
        }
      }
    });
    
    return unsubscribe;
  }, []);

  // Subscribe to save progress
  useEffect(() => {
    const unsubscribe = subscribeToSaveProgress((state) => {
      setSaveProgress(state);
      setIsSaving(state.isRunning);
      
      if (!state.isRunning && state.savedCount > 0) {
        // Save completed
        setCurrentMessage(`Saved ${state.savedCount} new, ${state.updatedCount} updated, ${state.skippedCount} skipped`);
      }
    });
    
    return unsubscribe;
  }, []);

  const toggleHospital = (hospitalId) => {
    const newSelected = new Set(selectedHospitals);
    if (newSelected.has(hospitalId)) {
      newSelected.delete(hospitalId);
    } else {
      newSelected.add(hospitalId);
    }
    setSelectedHospitals(newSelected);
  };

  const selectAll = () => {
    setSelectedHospitals(new Set(scrapableHospitals.map(h => h.id)));
  };

  const selectNone = () => {
    setSelectedHospitals(new Set());
  };

  const startScan = async () => {
    const hospitalsToScan = scrapableHospitals.filter(h => selectedHospitals.has(h.id));
    
    if (hospitalsToScan.length === 0) {
      alert('Please select at least one hospital to scan');
      return;
    }

    setIsScanning(true);
    setIsPaused(false);
    setResults([]);
    setAllJobs([]);

    // Initialize persistent state - pass URLs for the queue
    const urls = hospitalsToScan.map(h => ({
      url: h.career_page_url || h.careerPageUrl,
      hospitalName: h.name,
      hospitalId: h.id
    }));
    startScrapingSession(urls);

    try {
      const scanResults = await scrapeMultipleHospitals(
        hospitalsToScan,
        (progressInfo) => {
          setProgress(progressInfo);
          setCurrentMessage(progressInfo.message || `Scanning ${progressInfo.hospitalName}...`);
          
          // Update persistent state
          updateScrapingProgress({
            currentIndex: progressInfo.current,
            currentUrl: progressInfo.hospitalName
          });
        },
        (result) => {
          setResults(prev => [...prev, result]);
          if (result.jobs.length > 0) {
            setAllJobs(prev => {
              const newJobs = [...prev, ...result.jobs];
              // Add jobs to persistent state
              result.jobs.forEach(job => addScrapingResult(job));
              return newJobs;
            });
          }
        },
        // Pass a check function to see if we should continue
        () => {
          const state = getScrapingState();
          return state && state.isRunning && !state.isPaused;
        }
      );

      console.log('Scan complete:', scanResults);
      stopScraping();
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
      setCurrentMessage('Scan complete!');
    }
  };

  const pauseScan = () => {
    setIsPaused(true);
    pauseScrapingService();
  };

  const resumeScan = () => {
    setIsPaused(false);
    resumeScrapingService();
  };

  const stopScanHandler = () => {
    setIsScanning(false);
    setIsPaused(false);
    stopScraping();
    setCurrentMessage('Scan stopped');
  };

  const saveAllJobs = async () => {
    if (allJobs.length === 0) return;
    
    // Use background saver - this continues even when navigating away
    setIsSaving(true);
    setCurrentMessage(`Saving ${allJobs.length} jobs in background...`);
    
    // Start the background save (don't await - let it run in background)
    saveJobsInBackground(allJobs, hospitals).then((result) => {
      if (result) {
        onJobsScraped?.(result.saved);
        // Clear the jobs list after saving
        setAllJobs([]);
      }
    });
  };

  const handleCancelSave = () => {
    cancelSave();
    setIsSaving(false);
    setCurrentMessage('Save cancelled');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'no_jobs_found':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'external_portal':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'error':
      case 'empty_response':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'no_url':
        return <Globe className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (result) => {
    const { status, jobs, warning, portalType } = result;
    const jobCount = jobs?.length || 0;
    
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">{jobCount} jobs found</Badge>;
      case 'no_jobs_found':
        return <Badge variant="outline" className="text-yellow-600">No medical jobs</Badge>;
      case 'external_portal':
        return (
          <Badge className="bg-orange-100 text-orange-800 whitespace-nowrap">
            ⚠️ Manual check needed
          </Badge>
        );
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'empty_response':
        return <Badge variant="outline" className="text-red-600">No response</Badge>;
      case 'no_url':
        return <Badge variant="outline">No URL</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: results.length,
    success: results.filter(r => r.status === 'success').length,
    noJobs: results.filter(r => r.status === 'no_jobs_found').length,
    errors: results.filter(r => r.status === 'error' || r.status === 'empty_response').length,
    externalPortals: results.filter(r => r.status === 'external_portal').length,
    totalJobs: allJobs.length
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Hospital Job Scanner
          </CardTitle>
          <CardDescription>
            Scan hospital career pages to find doctor positions. Select hospitals below and click Start Scan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {!isScanning ? (
              <Button onClick={startScan} disabled={selectedHospitals.size === 0}>
                <Play className="h-4 w-4 mr-2" />
                Start Scan ({selectedHospitals.size} selected)
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button onClick={resumeScan} className="bg-green-600 hover:bg-green-700">
                    <Play className="h-4 w-4 mr-2" />
                    Resume Scan
                  </Button>
                ) : (
                  <Button variant="outline" onClick={pauseScan}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Scan
                  </Button>
                )}
                <Button variant="destructive" onClick={stopScanHandler}>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Scan
                </Button>
              </>
            )}
            
            <Button variant="outline" onClick={selectAll} disabled={isScanning}>
              Select All ({scrapableHospitals.length})
            </Button>
            
            <Button variant="outline" onClick={selectNone} disabled={isScanning}>
              Clear Selection
            </Button>

            {allJobs.length > 0 && (
              <div className="flex items-center gap-2">
                <Button onClick={saveAllJobs} disabled={isSaving || backgroundSaveState.isRunning} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Starting...' : backgroundSaveState.isRunning ? `Saving ${saveProgress.current}/${saveProgress.total}` : `Save ${allJobs.length} Jobs`}
                </Button>
                {backgroundSaveState.isRunning && (
                  <span className="text-xs text-muted-foreground">
                    (Saves in background - you can navigate away)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Progress */}
          {isScanning && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <Pause className="h-4 w-4 text-yellow-500" />
                ) : (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}
                <span className="text-sm">
                  {isPaused ? 'Paused - ' : ''}{currentMessage}
                </span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress.current} of {progress.total} hospitals scanned
                {isPaused && ' (paused - you can leave this page and come back)'}
              </p>
            </div>
          )}

          {/* Stats */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <div className="p-2 bg-slate-100 rounded text-center">
                <div className="text-lg font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Scanned</div>
              </div>
              <div className="p-2 bg-green-100 rounded text-center">
                <div className="text-lg font-bold text-green-700">{stats.success}</div>
                <div className="text-xs text-green-600">With Jobs</div>
              </div>
              <div className="p-2 bg-yellow-100 rounded text-center">
                <div className="text-lg font-bold text-yellow-700">{stats.noJobs}</div>
                <div className="text-xs text-yellow-600">No Jobs</div>
              </div>
              <div className="p-2 bg-orange-100 rounded text-center">
                <div className="text-lg font-bold text-orange-700">{stats.externalPortals}</div>
                <div className="text-xs text-orange-600">Manual Check</div>
              </div>
              <div className="p-2 bg-red-100 rounded text-center">
                <div className="text-lg font-bold text-red-700">{stats.errors}</div>
                <div className="text-xs text-red-600">Errors</div>
              </div>
              <div className="p-2 bg-blue-100 rounded text-center">
                <div className="text-lg font-bold text-blue-700">{stats.totalJobs}</div>
                <div className="text-xs text-blue-600">Total Jobs</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hospital Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Hospitals to Scan
          </CardTitle>
          <CardDescription>
            {scrapableHospitals.length} hospitals with career page URLs available
            {hospitalsWithoutUrl.length > 0 && (
              <span className="text-red-500 ml-2">
                • {hospitalsWithoutUrl.length} without URL (skipped)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {/* Hospitals without URLs - shown first with red badge */}
              {hospitalsWithoutUrl.map((hospital) => (
                <div 
                  key={hospital.id} 
                  className="flex flex-col gap-1 p-3 rounded-lg border border-red-200 bg-red-50/50 opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={false}
                      disabled={true}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center gap-2">
                        {hospital.name}
                        <Badge className="bg-red-100 text-red-700 text-xs border-red-300">
                          No URL
                        </Badge>
                      </div>
                      <div className="text-xs text-red-500">
                        No career page URL configured - will be skipped
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Hospitals with URLs - can be selected */}
              {scrapableHospitals.map((hospital) => {
                const result = results.find(r => r.hospital.id === hospital.id);
                const portalType = hospital.portal_type?.toLowerCase() || '';
                const isExternalPortal = ['dvinci', 'd.vinci', 'bite-api', 'b-ite', 'connectoor', 
                  'smartrecruiters', 'oracle', 'oracle-taleo', 'taleo', 'workday', 'greenhouse', 
                  'js-rendered'].includes(portalType) || portalType.startsWith('external-');
                
                // Get warning message for portal type
                const getPortalWarning = (type) => {
                  const warnings = {
                    'dvinci': 'Uses d.vinci widget - jobs loaded via JavaScript',
                    'd.vinci': 'Uses d.vinci widget - jobs loaded via JavaScript',
                    'bite-api': 'Uses B-ITE API - jobs loaded dynamically',
                    'b-ite': 'Uses B-ITE API - jobs loaded dynamically',
                    'connectoor': 'Uses Connectoor widget - external API',
                    'smartrecruiters': 'Uses SmartRecruiters - external widget',
                    'oracle': 'Uses Oracle/Taleo - external system',
                    'oracle-taleo': 'Uses Oracle/Taleo - external system',
                    'taleo': 'Uses Oracle/Taleo - external system',
                    'js-rendered': 'JavaScript rendered - may not work'
                  };
                  return warnings[type] || 'External portal - check manually';
                };
                
                return (
                  <div 
                    key={hospital.id} 
                    className={`flex flex-col gap-1 p-3 rounded-lg border ${
                      result ? 'bg-slate-50' : ''
                    } ${isExternalPortal ? 'border-orange-300 bg-orange-50/50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedHospitals.has(hospital.id)}
                        onCheckedChange={() => toggleHospital(hospital.id)}
                        disabled={isScanning}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center gap-2">
                          {hospital.name}
                          {isExternalPortal && (
                            <Badge className="bg-orange-100 text-orange-700 text-xs border-orange-300">
                              ⚠️ API
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {hospital.career_page_url || hospital.careerPageUrl}
                        </div>
                        
                        {/* Always show warning for external portals */}
                        {isExternalPortal && !result && (
                          <div className="mt-1 text-xs text-orange-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {getPortalWarning(portalType)} - check career page manually
                          </div>
                        )}
                      </div>
                      
                      {result && (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          {getStatusBadge(result)}
                        </div>
                      )}
                      
                      <a 
                        href={hospital.career_page_url || hospital.careerPageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 p-1 border rounded hover:bg-blue-50"
                        title="Open career page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    
                    {/* Show warning for external portals after scan */}
                    {result?.status === 'external_portal' && result.warning && (
                      <div className="ml-7 text-xs text-orange-700 bg-orange-100 p-2 rounded border border-orange-200">
                        ⚠️ {result.warning}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Found Jobs */}
      {allJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Found Jobs ({allJobs.length})
            </CardTitle>
            <CardDescription>
              Job descriptions shown inline. Use the external link to view the original posting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {allJobs.map((job, index) => (
                  <div 
                    key={index} 
                    className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-lg text-slate-900">{job.title}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" />
                          {job.hospitalName}
                        </div>
                        {job.location && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </div>
                        )}
                      </div>
                      {job.link && (
                        <a 
                          href={job.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 p-2 border rounded hover:bg-blue-50"
                          title="View original posting"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    
                    {/* Inline Description */}
                    {job.description && (
                      <div className="mt-2 p-3 bg-slate-50 rounded text-sm text-slate-700 border-l-4 border-blue-400">
                        {job.description}
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline">{job.specialty}</Badge>
                      <Badge variant="secondary" className="text-xs">{job.portalType || 'generic'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Job Preview Dialog */}
      <Dialog open={!!previewJob} onOpenChange={() => setPreviewJob(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{previewJob?.title}</DialogTitle>
            <DialogDescription>
              Job preview - this job will be saved to the database when you click "Save Jobs"
            </DialogDescription>
          </DialogHeader>
          
          {previewJob && (
            <div className="space-y-4">
              {/* Hospital Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Building2 className="h-8 w-8 text-slate-400" />
                <div>
                  <div className="font-semibold">{previewJob.hospitalName}</div>
                  {previewJob.location && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {previewJob.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Specialty</div>
                  <Badge className="mt-1">{previewJob.specialty}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Portal Type</div>
                  <Badge variant="outline" className="mt-1">{previewJob.portalType || 'generic'}</Badge>
                </div>
              </div>

              {/* Job Description */}
              {previewJob.description && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Description</div>
                  <div className="text-sm p-3 bg-slate-50 rounded-lg">
                    {previewJob.description}
                  </div>
                </div>
              )}

              {/* Source URL */}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Source</div>
                <div className="text-sm break-all text-blue-600">
                  {previewJob.source_url}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {previewJob.link && (
                  <Button asChild className="flex-1">
                    <a href={previewJob.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original Job Posting
                    </a>
                  </Button>
                )}
                <Button variant="outline" onClick={() => setPreviewJob(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
