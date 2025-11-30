
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { Hospital } from "@/api/entities";

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

export default function HospitalCsvUploader({ onSuccess, setAlert }) {
  const [selectedState, setSelectedState] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSummary, setUploadSummary] = useState(null);

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
      file.type === "text/csv" || file.type === "text/plain" || file.name.endsWith('.csv') || file.name.endsWith('.txt')
    );

    if (csvFile && selectedState) {
      handleCsvUpload(csvFile);
    } else if (!selectedState) {
      setAlert({ type: "error", message: "Please select a state before uploading." });
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file && selectedState) {
      handleCsvUpload(file);
    } else if (!selectedState) {
      setAlert({ type: "error", message: "Please select a state before uploading." });
    }
  };

  // Helper function to validate if a string is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return string.startsWith('http://') || string.startsWith('https://');
    } catch (_) {
      return false;
    }
  };
  
  // Simple but robust CSV parser
  const parseCSVLine = (line, delimiter = ',') => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote (double quotes within quoted field)
          current += '"';
          i++; // Skip next quote
        } else {
          // Start or end of quoted field
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator found outside quotes
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  };

  // Auto-detect delimiter from the first data line
  const detectDelimiter = (line) => {
    // Count delimiters outside of quotes
    let inQuotes = false;
    let tabCount = 0;
    let commaCount = 0;
    let semicolonCount = 0;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (!inQuotes) {
        if (char === '\t') tabCount++;
        else if (char === ',') commaCount++;
        else if (char === ';') semicolonCount++;
      }
    }
    
    console.log('Delimiter counts (outside quotes):', { tabCount, commaCount, semicolonCount });
    
    // Return the delimiter with the highest count, preferring tab, then comma, then semicolon if counts are equal
    // or if a common delimiter has 0 count.
    // If all are 0, it suggests a single column or incorrect detection. Default to tab.
    if (commaCount > tabCount && commaCount > semicolonCount) return ',';
    if (tabCount > semicolonCount && tabCount >= commaCount) return '\t'; // Prioritize tab if it's equal or higher than comma
    if (semicolonCount > 0 && semicolonCount >= tabCount && semicolonCount >= commaCount) return ';';
    
    // Fallback if no clear winner, or all counts are zero (e.g., single column CSV)
    if (tabCount > 0) return '\t';
    if (commaCount > 0) return ',';
    if (semicolonCount > 0) return ';';

    return '\t'; // Default to tab if no delimiter found (e.g., single column without quotes)
  };


  const handleCsvUpload = async (file) => {
    if (!selectedState) {
      setAlert({ type: "error", message: "Please select a federal state first." });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setAlert(null);
    setUploadSummary(null);
    
    try {
      console.log("=== CSV UPLOAD DEBUGGING START ===");
      setProcessingMessage("Reading CSV file...");
      setUploadProgress(10);
      
      const text = await file.text();
      console.log('Raw CSV first 300 chars:', text.substring(0, 300) + (text.length > 300 ? '...' : ''));
      
      // Split into lines
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      console.log(`Found ${lines.length} non-empty lines`);
      
      if (lines.length < 1) throw new Error("CSV file is empty.");

      // Detect delimiter from first line (assuming first line is representative or header)
      const delimiter = detectDelimiter(lines[0]);
      console.log(`Detected delimiter: "${delimiter === '\t' ? 'TAB' : delimiter === ',' ? 'COMMA' : delimiter === ';' ? 'SEMICOLON' : delimiter}"`);
      
      // Parse first line to check structure
      const firstLineParsed = parseCSVLine(lines[0], delimiter);
      console.log("First line split into", firstLineParsed.length, "fields:");
      firstLineParsed.forEach((field, idx) => {
        console.log(`  Column ${idx}: "${field.substring(0, 50)}${field.length > 50 ? '...' : ''}"`);
      });
      
      // Check if first line is a header
      const isHeaderRow = firstLineParsed.some(cell => 
        cell.toLowerCase().includes('klinik') || 
        cell.toLowerCase().includes('name') ||
        cell.toLowerCase().includes('website') ||
        cell.toLowerCase().includes('stellenlink') ||
        cell.toLowerCase().includes('kontak')
      );
      
      const dataStartIndex = isHeaderRow ? 1 : 0;
      console.log(`Header detected: ${isHeaderRow}, data starts at line: ${dataStartIndex + 1}`);

      if (lines.length <= dataStartIndex) throw new Error("CSV file has no data rows.");

      setProcessingMessage("Fetching existing hospitals...");
      setUploadProgress(15); // Adjust progress slightly earlier for fetching hospitals
      const existingHospitals = await Hospital.list("-created_date", 10000); 
      const existingNames = new Set(existingHospitals.map(h => h.name.toLowerCase().trim()));
      console.log(`Found ${existingNames.size} existing hospital names for duplicate check.`);
      
      const hospitalsToCreate = [];
      const skippedDuplicates = [];
      const invalidRows = [];
      const totalRows = lines.length - dataStartIndex;

      console.log(`Processing ${totalRows} data rows...`);
      setProcessingMessage(`Processing ${totalRows} hospital records...`);
      
      for (let i = dataStartIndex; i < lines.length; i++) {
        const rowNum = i - dataStartIndex + 1;
        const progress = 20 + ((rowNum / totalRows) * 70); // Adjusted range 20-90%
        setUploadProgress(progress);
        
        const values = parseCSVLine(lines[i], delimiter);
        
        console.log(`\n--- ROW ${rowNum} DEBUG ---`);
        console.log('Raw line:', lines[i].substring(0, 150) + (lines[i].length > 150 ? '...' : ''));
        console.log('Parsed into', values.length, 'fields:');
        values.slice(0, 4).forEach((val, idx) => {
          console.log(`  Field ${idx}: "${val.substring(0, 80)}${val.length > 80 ? '...' : ''}"`);
        });
        
        // Map to expected columns (adjust based on your actual CSV structure)
        const name = values[0]?.trim() || '';
        const websiteUrl = values[1]?.trim() || '';
        const careerPageUrl = values[2]?.trim() || '';
        const contactInfo = values[3]?.trim() || '';
        
        if (!name || name.length < 3) {
          console.log(`❌ REJECTED: Invalid name: "${name}"`);
          invalidRows.push(`Row ${rowNum}: Invalid name`);
          continue;
        }
        
        if (existingNames.has(name.toLowerCase().trim())) {
          skippedDuplicates.push(name);
          console.log(`⏭️  SKIPPED: Duplicate: "${name}"`);
          continue;
        }

        const validWebsiteUrl = isValidUrl(websiteUrl) ? websiteUrl : '';
        const validCareerPageUrl = isValidUrl(careerPageUrl) ? careerPageUrl : '';

        const newHospital = {
          name: name,
          city: '',
          state: selectedState,
          logoUrl: '',
          websiteUrl: validWebsiteUrl,
          careerPageUrl: validCareerPageUrl,
          isActive: true,
          notes: contactInfo
        };
        
        hospitalsToCreate.push(newHospital);
        existingNames.add(name.toLowerCase().trim()); // Add to existing names to prevent duplicates within the same file upload
        
        console.log(`✅ PREPARED: "${name}" -> Website: "${validWebsiteUrl}" -> Career: "${validCareerPageUrl}"`);
      }

      console.log(`\n=== FINAL SUMMARY ===`);
      console.log(`Created: ${hospitalsToCreate.length}, Skipped: ${skippedDuplicates.length}, Invalid: ${invalidRows.length}`);

      if (hospitalsToCreate.length > 0) {
        setProcessingMessage(`Saving ${hospitalsToCreate.length} hospitals...`);
        setUploadProgress(95);
        await Hospital.bulkCreate(hospitalsToCreate);
      }
      
      setUploadProgress(100);
      setProcessingMessage("Upload complete!");
      setUploadSummary({
        newCount: hospitalsToCreate.length,
        skippedCount: skippedDuplicates.length,
        invalidCount: invalidRows.length,
        skippedNames: skippedDuplicates.slice(0, 10),
        invalidNames: invalidRows.slice(0, 10)
      });
      
      onSuccess();
      
    } catch (error) {
      console.error("CSV Upload Error:", error);
      setAlert({ type: "error", message: `CSV Upload Error: ${error.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* State Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Federal State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="state">Federal State (Bundesland) *</Label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger>
                <SelectValue placeholder="Select the federal state for these hospitals" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GERMAN_STATES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-500">
              All hospitals in the CSV will be assigned to this state.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {isUploading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <div className="font-semibold text-blue-900">{processingMessage}</div>
                <div className="text-sm text-blue-700">{Math.round(uploadProgress)}% complete</div>
              </div>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Upload Summary Card */}
      {uploadSummary && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="w-5 h-5" />
              Upload Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-around text-center">
              <div>
                <div className="text-3xl font-bold text-green-700">{uploadSummary.newCount}</div>
                <div className="text-sm text-green-800">New Hospitals Added</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">{uploadSummary.skippedCount}</div>
                <div className="text-sm text-orange-800">Duplicates Skipped</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{uploadSummary.invalidCount}</div>
                <div className="text-sm text-red-800">Invalid Rows</div>
              </div>
            </div>
            {uploadSummary.skippedCount > 0 && (
              <div className="p-3 bg-white rounded-lg border">
                <h4 className="font-semibold text-slate-800 mb-2">Skipped Duplicates:</h4>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                  {uploadSummary.skippedNames.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                  {uploadSummary.skippedCount > 10 && <li>... and {uploadSummary.skippedCount - 10} more.</li>}
                </ul>
              </div>
            )}

            {uploadSummary.invalidCount > 0 && (
              <div className="p-3 bg-white rounded-lg border border-red-200">
                <h4 className="font-semibold text-slate-800 mb-2">Examples of Invalid Rows:</h4>
                <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                  {uploadSummary.invalidNames.map((name, i) => (
                    <li key={i}>{name}</li>
                  ))}
                  {uploadSummary.invalidCount > 10 && <li>... and {uploadSummary.invalidCount - 10} more.</li>}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CSV Upload */}
      <Card className="border-dashed border-2 border-slate-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Upload Hospital CSV (Fast Import)
          </CardTitle>
          <p className="text-sm text-slate-600">
            This tool efficiently imports hospital data. It handles quoted fields, 
            skips duplicates, and processes based on a fixed tab-separated format.
          </p>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
              dragActive 
                ? "border-blue-400 bg-blue-50" 
                : selectedState
                  ? "border-slate-200 hover:border-slate-300"
                  : "border-slate-200 bg-slate-50 opacity-50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading || !selectedState}
            />
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {isUploading ? "Processing..." : "Drop your CSV/text file here"}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {selectedState 
                  ? "Or click to browse and select your file"
                  : "Please select a state first"
                }
              </p>
              <Button 
                variant="outline" 
                disabled={!selectedState || isUploading}
                className="pointer-events-none"
              >
                {isUploading ? "Processing..." : "Select File"}
              </Button>
            </div>
          </div>

          {/* Updated format instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Expected Format & Column Mapping:</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <div className="bg-white p-2 rounded border font-mono text-xs">
                "Klinik name"[DELIMITER]"klinik website"[DELIMITER]"Stellenlink"[DELIMITER]"Kontak"
              </div>
              <div className="text-xs text-blue-600 space-y-1">
                <p>✅ <strong>Delimiter:</strong> Auto-detected (Tab, Comma, or Semicolon).</p>
                <p>✅ <strong>Column 1:</strong> Hospital Name (Required, minimum 3 characters)</p>
                <p>✅ <strong>Column 2:</strong> Website URL (Optional)</p>
                <p>✅ <strong>Column 3:</strong> Career Page URL (Optional)</p>
                <p>✅ <strong>Column 4:</strong> Contact Info (Optional - saved in 'notes' field)</p>
                <p>✅ Multi-line fields are supported if enclosed in double-quotes (but only within a single physical line).</p>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                📝 All hospitals will be assigned to <strong>{selectedState ? GERMAN_STATES[selectedState] : '[Selected State]'}</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
