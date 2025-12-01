import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Pause, Play, X, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  getScrapingState,
  subscribeToScrapingState,
  pauseScraping,
  resumeScraping,
  stopScraping,
  getScrapingProgress
} from "@/services/scrapingService";

export default function ScrapingStatusBar() {
  const [state, setState] = useState(getScrapingState());

  useEffect(() => {
    // Initial state
    setState(getScrapingState());
    
    // Subscribe to changes
    const unsubscribe = subscribeToScrapingState((newState) => {
      setState(newState);
    });

    // Poll for updates (in case events are missed)
    const interval = setInterval(() => {
      setState(getScrapingState());
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Don't show if not running
  if (!state.isRunning) {
    return null;
  }

  const progress = getScrapingProgress();
  let currentHostname = '';
  try {
    currentHostname = state.currentUrl ? new URL(state.currentUrl).hostname : '';
  } catch {
    currentHostname = state.currentUrl || '';
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${!state.isPaused ? 'animate-spin' : ''}`} />
          <span className="font-semibold text-white text-sm">
            {state.isPaused ? 'Scraping Paused' : 'Scraping in Progress'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {state.isPaused ? (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700"
              onClick={resumeScraping}
            >
              <Play className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-7 w-7 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-slate-700"
              onClick={pauseScraping}
            >
              <Pause className="w-4 h-4" />
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-slate-700"
            onClick={stopScraping}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Progress</span>
          <span className="text-white font-medium">
            {state.currentIndex} / {state.totalUrls} URLs
          </span>
        </div>
        
        <Progress value={progress} className="h-2 bg-slate-700" />

        {/* Current URL */}
        {state.currentUrl && !state.isPaused && (
          <div className="text-xs text-slate-400 truncate">
            Scanning: <span className="text-slate-300">{currentHostname}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-slate-300">{state.completedUrls.length} done</span>
            </div>
            {state.failedUrls.length > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-400" />
                <span className="text-xs text-slate-300">{state.failedUrls.length} failed</span>
              </div>
            )}
          </div>
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 text-xs">
            {state.jobsSaved} jobs saved
          </Badge>
        </div>

        {/* Link to scraping page */}
        <Link to={createPageUrl("Scraping")}>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
