import React, { useState, useEffect } from "react";
import { Hospital } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Download, Upload } from "lucide-react";

export default function HospitalCount() {
  const [hospitalCount, setHospitalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHospitalCount();
  }, []);

  const loadHospitalCount = async () => {
    setIsLoading(true);
    try {
      const hospitals = await Hospital.list("-created_date", 10000);
      setHospitalCount(hospitals.length);
    } catch (error) {
      console.error("Error loading hospitals:", error);
    }
    setIsLoading(false);
  };

  const generateCSVTemplate = () => {
    const csvData = `Hospital/Clinic Name,City,Direct Link to Job Listings,Logo URL,Website URL
"Universitätsklinikum Freiburg Bad Krotzingen und Freiburg",Freiburg,https://www.uniklinik-freiburg.de/karriere/stellenangebote.html,,https://www.uniklinik-freiburg.de/de.html
Universitätsklinikum Tübingen,Tübingen,https://jobs.medizin.uni-tuebingen.de/Jobs?jobProfiles=%C3%84rztin/Arzt%7C%C3%84rztlicher%20Dienst%20Sonstiges%7CAssistenz%C3%A4rztin/Assistenzarzt%7CFach%C3%A4rztin/Facharzt,,https://www.medizin.uni-tuebingen.de/de/
Universitätsklinikum Heidelberg: Campus,Heidelberg,https://karriere.klinikum.uni-heidelberg.de/index.php?ac=search_result&search_criterion_keyword%5B%5D=Arzt%20in%20Weiterbildung&search_criterion_activity_level%5B%5D=1001#skip-to-search-result-heading,,https://www.klinikum.uni-heidelberg.de/`;
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'baden_wuerttemberg_hospitals.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Current Hospital Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading hospital count...</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-blue-600 mb-4">{hospitalCount}</div>
                <p className="text-xl text-slate-700 mb-6">Hospitals currently in the system</p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3">Baden-Württemberg Data Ready</h3>
                  <p className="text-blue-800 mb-4">
                    You have approximately <strong>270+ hospitals</strong> from Baden-Württemberg ready to upload.
                  </p>
                  <p className="text-sm text-blue-700 mb-4">
                    <span className="text-red-600 font-semibold">Red entries</span> indicate missing job listing URLs that need to be added manually.
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button onClick={generateCSVTemplate} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Sample CSV Format
                  </Button>
                  <Button onClick={() => window.open('/Hospitals', '_blank')} className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Go to Hospital Upload
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions for Uploading Baden-Württemberg Hospitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="bg-amber-50 border border-amber-200 rounded p-4">
                <h4 className="font-semibold text-amber-800 mb-2">Missing Job URLs (Red Entries)</h4>
                <p className="text-amber-700">
                  Some hospitals in your list don't have job listing URLs. These will need to be added manually later 
                  or you can research and add them before uploading.
                </p>
              </div>
              
              <ol className="list-decimal list-inside space-y-2 text-slate-700">
                <li>Format your data as CSV with columns: <code>Hospital/Clinic Name,City,Direct Link to Job Listings,Logo URL,Website URL</code></li>
                <li>Go to the <strong>Hospitals</strong> page → <strong>CSV Upload</strong> tab</li>
                <li>Select Baden-Württemberg (BW) as the state</li>
                <li>Upload your CSV file</li>
                <li>The system will automatically scan for logos and process all hospitals</li>
              </ol>

              <div className="bg-green-50 border border-green-200 rounded p-4">
                <h4 className="font-semibold text-green-800 mb-2">After Upload</h4>
                <p className="text-green-700">
                  Your total hospitals will increase from <strong>{hospitalCount}</strong> to approximately <strong>{hospitalCount + 270}+</strong> hospitals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}