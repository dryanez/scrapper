
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileSpreadsheet, Plus, Link as LinkIcon } from "lucide-react";

export default function CsvUploader({ onUpload, isUploading, onManualAdd }) {
  const [dragActive, setDragActive] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => 
      file.type === "text/csv" ||
      file.name.endsWith('.csv')
    );

    if (csvFile) {
      onUpload(csvFile);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualUrl) {
      onManualAdd({
        url: manualUrl,
        notes: manualNotes,
        enabled: true
      });
      setManualUrl("");
      setManualNotes("");
    }
  };

  return (
    <div className="space-y-8">
      {/* CSV Upload */}
      <Card className="border-dashed border-2 border-slate-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Upload CSV File with Hospital URLs & Logos
          </CardTitle>
          <p className="text-sm text-slate-600">
            Upload a CSV file containing hospital career page URLs with logos.
          </p>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
              dragActive 
                ? "border-blue-400 bg-blue-50" 
                : "border-slate-200 hover:border-slate-300"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {isUploading ? "Processing..." : "Drop your CSV file here"}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Or click to browse and select your file
              </p>
              <Button 
                variant="outline" 
                disabled={isUploading}
                className="pointer-events-none"
              >
                {isUploading ? "Processing..." : "Select CSV File"}
              </Button>
            </div>
          </div>

          {/* Updated format info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Required CSV Format:</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>Your CSV file must have exactly these column headers in the first row:</p>
              <div className="bg-white p-2 rounded border font-mono text-xs">
                Direct Link to Job Listings,City,Hospital/Group Name,Logo URL
              </div>
              <div className="text-xs text-blue-600 space-y-1">
                <p>✅ Column A: Direct Link to Job Listings (required)</p>
                <p>✅ Column B: City (optional)</p>
                <p>✅ Column C: Hospital/Group Name (required)</p>
                <p>✅ Column D: Logo URL (optional)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual URL Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Add Individual URL
          </CardTitle>
          <p className="text-sm text-slate-600">
            Manually add a single hospital career page URL
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <Label htmlFor="url">Hospital Career Page URL</Label>
              <div className="relative mt-1">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.rkh-karriere.de/stellenangebote/stellenanzeigen"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Hospital Name & Notes</Label>
              <Textarea
                id="notes"
                placeholder="RKH Kliniken - Stuttgart"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add URL
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
