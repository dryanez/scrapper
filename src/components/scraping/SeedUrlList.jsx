
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeedUrl } from "@/api/entities";
import { 
  Globe, 
  ExternalLink, 
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  BrainCircuit,
} from "lucide-react";
import { format } from "date-fns";

export default function SeedUrlList({ seedUrls, onUpdate, onScanUrl, isScanning }) {
  const toggleUrlEnabled = async (seedUrl) => {
    try {
      await SeedUrl.update(seedUrl.id, { enabled: !seedUrl.enabled });
      onUpdate();
    } catch (error) {
      console.error("Error updating seed URL:", error);
    }
  };

  const deleteUrl = async (seedUrl) => {
    if (confirm(`Are you sure you want to delete this URL: ${seedUrl.url}?`)) {
      try {
        await SeedUrl.delete(seedUrl.id);
        onUpdate();
      } catch (error) {
        console.error("Error deleting seed URL:", error);
      }
    }
  };

  const getHostname = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-4">
      {seedUrls.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No URLs configured</h3>
          <p className="text-slate-500">Upload a CSV file or add URLs manually to get started</p>
        </Card>
      ) : (
        seedUrls.map((seedUrl) => (
          <Card key={seedUrl.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg mb-2 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <span className="truncate">{getHostname(seedUrl.url)}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <a
                      href={seedUrl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate"
                    >
                      {seedUrl.url}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                  {seedUrl.notes && (
                    <p className="text-sm text-slate-600">{seedUrl.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Badge 
                    variant={seedUrl.enabled ? "default" : "secondary"}
                    className={seedUrl.enabled ? "bg-green-100 text-green-800" : ""}
                  >
                    {seedUrl.enabled ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Disabled
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  {seedUrl.lastScrapedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Last scanned: {format(new Date(seedUrl.lastScrapedAt), 'MMM d, HH:mm')}</span>
                    </div>
                  )}
                  {seedUrl.jobsFound > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {seedUrl.jobsFound} jobs found
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onScanUrl(seedUrl)}
                    disabled={isScanning}
                  >
                    <BrainCircuit className="w-4 h-4 mr-2" />
                    Scan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleUrlEnabled(seedUrl)}
                    disabled={isScanning}
                  >
                    {seedUrl.enabled ? "Disable" : "Enable"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteUrl(seedUrl)}
                    className="text-red-600 hover:text-red-800"
                    disabled={isScanning}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
