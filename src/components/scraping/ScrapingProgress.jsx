import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Globe } from "lucide-react";

export default function ScrapingProgress({ progress, currentUrl }) {
  return (
    <Card className="mb-8 bg-blue-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">Scraping in Progress</h3>
            {currentUrl && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Globe className="w-4 h-4" />
                <span className="truncate">Processing: {currentUrl.url}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</div>
            <div className="text-xs text-slate-500">Complete</div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </CardContent>
    </Card>
  );
}