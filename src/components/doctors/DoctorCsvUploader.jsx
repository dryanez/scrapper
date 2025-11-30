
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, RefreshCw } from "lucide-react";
import { Doctor } from "@/api/entities";

// Define constants for parsing
const DOCTOR_SPECIALTIES = [
  "Allgemeinmedizin", "Anästhesie und Intensivmedizin", "Anästhesie", "Innere Medizin",
  "Orthopädie und Unfallchirurgie", "Orthopädie", "Unfallchirurgie", "Chirurgie",
  "Radiologie", "Gynäkologie", "Pädiatrie", "Neurologie", "Urologie", "Dermatologie",
  "HNO", "Psychiatrie"
];

const GERMAN_STATES = {
  "Baden-Württemberg": "BW", "Bayern": "BY", "Berlin": "BE", "Brandenburg": "BB",
  "Bremen": "HB", "Hamburg": "HH", "Hessen": "HE", "Mecklenburg-Vorpommern": "MV",
  "Niedersachsen": "NI", "Nordrhein-Westfalen": "NW", "Rheinland-Pfalz": "RP",
  "Saarland": "SL", "Sachsen": "SN", "Sachsen-Anhalt": "ST",
  "Schleswig-Holstein": "SH", "Thüringen": "TH"
};
const ALL_STATE_CODES = Object.values(GERMAN_STATES);
const STATE_NAMES_REGEX = new RegExp(Object.keys(GERMAN_STATES).join('|'), 'gi');


export default function DoctorCsvUploader({ onSuccess, setAlert }) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

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
      file.type === "text/csv" || file.name.endsWith('.csv')
    );

    if (csvFile) {
      handleCsvUpload(csvFile);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCsvUpload(file);
    }
  };
  
  const parseCSV = (text) => {
    // Remove BOM (Byte Order Mark) if present at the start of the file
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.substring(1);
    }
    
    const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error("CSV file is empty or has only a header.");

    // Auto-detect delimiter: check tabs, semicolons, and commas
    const firstLine = lines[0];
    let delimiter = ','; // default
    const tabCount = firstLine.split('\t').length;
    const semicolonCount = firstLine.split(';').length;
    const commaCount = firstLine.split(',').length;
    
    // Choose the delimiter that creates the most columns
    if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = '\t';
    } else if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ';';
    } else {
      delimiter = ',';
    }
    
    console.log("DEBUG: First line:", JSON.stringify(firstLine));
    console.log("DEBUG: Tab count:", tabCount, "Semicolon count:", semicolonCount, "Comma count:", commaCount);
    console.log("DEBUG: Detected delimiter:", delimiter === '\t' ? 'TAB' : delimiter === ';' ? 'SEMICOLON' : 'COMMA');
    
    // Split headers and clean them up
    const rawHeaders = firstLine.split(delimiter);
    console.log("DEBUG: Raw headers:", rawHeaders.map(h => `"${h}"`));
    
    const cleanHeaders = rawHeaders.map(h => h.trim().toLowerCase()).filter(h => h.length > 0);
    console.log("DEBUG: Clean headers:", cleanHeaders);

    // Create header mapping
    const headerMap = {};
    cleanHeaders.forEach((header, index) => {
      console.log(`DEBUG: Processing header ${index}: "${header}"`);
      
      if (header === 'name') {
        headerMap.name = index;
        console.log("DEBUG: Found 'name' header at index", index);
      }
      if (header === 'kategorien' || header === 'specialties' || header === 'fachrichtungen') {
        headerMap.specialties = index;
        console.log("DEBUG: Found specialties header at index", index);
      }
      if (header === 'wunschposition' || header === 'desiredstates' || header === 'bundesländer') {
        headerMap.desiredStates = index;
        console.log("DEBUG: Found desired states header at index", index);
      }
      if (header === 'e-mail' || header === 'email') {
        headerMap.email = index;
        console.log("DEBUG: Found email header at index", index);
      }
      if (header === 'firstname' || header === 'vorname') {
        headerMap.firstName = index;
        console.log("DEBUG: Found firstName header at index", index);
      }
      if (header === 'lastname' || header === 'nachname') {
        headerMap.lastName = index;
        console.log("DEBUG: Found lastName header at index", index);
      }
    });

    console.log("DEBUG: Final header map:", headerMap);

    const hasEmailHeader = headerMap.email !== undefined;
    const hasFullNameHeader = headerMap.name !== undefined;
    const hasFirstAndLastNameHeaders = headerMap.firstName !== undefined && headerMap.lastName !== undefined;

    console.log("DEBUG: hasEmailHeader:", hasEmailHeader);
    console.log("DEBUG: hasFullNameHeader:", hasFullNameHeader);
    console.log("DEBUG: hasFirstAndLastNameHeaders:", hasFirstAndLastNameHeaders);

    if (!hasEmailHeader || (!hasFullNameHeader && !hasFirstAndLastNameHeaders)) {
        throw new Error(`CSV must contain a valid email header (e.g., 'E-Mail', 'email') and name headers (e.g., 'Name' or 'firstName' and 'lastName'). Found headers: ${cleanHeaders.join(', ')}`);
    }

    // Smart parsing functions
    const parseConcatenatedString = (str, dictionary) => {
        if (!str) return [];
        const foundItems = new Set();
        let remainingStr = str.replace(/\s+/g, '').toLowerCase();

        const preparedDictionary = dictionary.map(item => ({
            original: item,
            normalized: item.replace(/\s+/g, '').toLowerCase()
        })).sort((a, b) => b.normalized.length - a.normalized.length);

        while (remainingStr.length > 0) {
            let matchFound = false;
            for (const dictItem of preparedDictionary) {
                if (remainingStr.startsWith(dictItem.normalized)) {
                    foundItems.add(dictItem.original);
                    remainingStr = remainingStr.substring(dictItem.normalized.length);
                    matchFound = true;
                    break; 
                }
            }
            if (!matchFound) {
                remainingStr = remainingStr.substring(1);
            }
        }
        return Array.from(foundItems);
    };
    
    const parseDesiredStates = (str) => {
      if (!str) return [];
      const lowerStr = str.toLowerCase();
      if (lowerStr.includes('bundesweit') || lowerStr.includes('deutschlandweit')) {
        return ALL_STATE_CODES;
      }
      const matches = [...new Set((str.match(STATE_NAMES_REGEX) || []).map(name => name.trim()))];
      return matches.map(name => GERMAN_STATES[name]).filter(Boolean);
    };
    
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim());
        const record = {};

        // Name parsing
        let firstName = '', lastName = '';
        if (hasFullNameHeader) {
          const nameValue = values[headerMap.name] || '';
          const nameParts = nameValue.split(',').map(p => p.trim());
          
          if (nameParts.length === 2) { 
            lastName = nameParts[0];
            firstName = nameParts[1];
          } else { 
            const nameWords = nameValue.split(' ').filter(Boolean);
            if (nameWords.length > 1) {
              lastName = nameWords.pop();
              firstName = nameWords.join(' ');
            } else {
              lastName = nameWords[0] || '';
            }
          }
        }
        
        if (hasFirstAndLastNameHeaders) {
          firstName = values[headerMap.firstName] || firstName;
          lastName = values[headerMap.lastName] || lastName;
        }
        
        record.firstName = firstName;
        record.lastName = lastName;
        record.email = values[headerMap.email] || '';

        // Specialty parsing
        const rawSpecialties = headerMap.specialties !== undefined ? (values[headerMap.specialties] || '') : '';
        record.specialties = parseConcatenatedString(rawSpecialties, DOCTOR_SPECIALTIES);
        
        // Desired states parsing
        const rawDesiredStates = headerMap.desiredStates !== undefined ? (values[headerMap.desiredStates] || '') : '';
        record.desiredStates = parseDesiredStates(rawDesiredStates);
        
        // Only push valid records that have required fields
        if (record.email && record.firstName && record.lastName) {
          records.push(record);
        }
    }
    return records;
  };

  const handleCsvUpload = async (file) => {
    setIsUploading(true);
    setAlert(null);
    setProcessingMessage("Reading CSV file...");

    try {
      const text = await file.text();
      const doctorsToCreate = parseCSV(text);

      if (doctorsToCreate.length > 0) {
        setProcessingMessage(`Saving ${doctorsToCreate.length} doctors to the database...`);
        await Doctor.bulkCreate(doctorsToCreate);
        onSuccess();
        setAlert({ type: "success", message: `Successfully uploaded and created ${doctorsToCreate.length} doctor profiles.` });
      } else {
        throw new Error("No valid doctor data found in the CSV file after parsing. Ensure required fields (Name/First & Last Name, E-Mail) are present and correctly formatted.");
      }
      
    } catch (error) {
      console.error("Full CSV Upload Error:", error);
      setAlert({ type: "error", message: `CSV Upload Error: ${error.message}` });
    } finally {
      setIsUploading(false);
      setProcessingMessage("");
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-green-600" />
          Bulk Upload Doctors via CSV
        </CardTitle>
        <p className="text-sm text-slate-600">
          Intelligently parses complex formats for specialties and desired locations.
        </p>
      </CardHeader>
      <CardContent>
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
            dragActive ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"
          }`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div className="text-center">
            {isUploading ? (
              <>
                <RefreshCw className="w-12 h-12 mx-auto mb-4 text-slate-400 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Processing...</h3>
                <p className="text-sm text-slate-500 mb-4">{processingMessage}</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-semibold mb-2">Drop your CSV file here</h3>
                <p className="text-sm text-slate-500 mb-4">Or click to browse</p>
                <Button variant="outline" disabled={isUploading} className="pointer-events-none">
                  Select CSV File
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">CSV Format Guide</h4>
          <div className="text-sm text-blue-800 space-y-2">
            <p>Your CSV file's first row must contain headers.</p>
            <p>
              The system now automatically detects if your file is comma-separated, semicolon-separated or tab-separated.
            </p>
            <p>
              <strong>Required Headers:</strong> <code className="bg-white p-1 rounded">Name</code> (e.g., "Lastname, Firstname" or "Firstname Lastname") or separate <code className="bg-white p-1 rounded">firstName</code> and <code className="bg-white p-1 rounded">lastName</code>, and <code className="bg-white p-1 rounded">E-Mail</code> (or <code className="bg-white p-1 rounded">email</code>).
            </p>
            <p>
              <strong>Optional Headers:</strong> <code className="bg-white p-1 rounded">Kategorien</code> (for specialties, also <code className="bg-white p-1 rounded">specialties</code>, <code className="bg-white p-1 rounded">fachrichtungen</code>), <code className="bg-white p-1 rounded">Wunschposition</code> (for desired states, also <code className="bg-white p-1 rounded">desiredstates</code>, <code className="bg-white p-1 rounded">bundesländer</code>).
            </p>
            <p>
              The system can now parse concatenated specialties (e.g., "InnereMedizinChirurgie") and recognizes German state names (e.g., "Sachsen Bayern") or "bundesweit" for desired locations.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
