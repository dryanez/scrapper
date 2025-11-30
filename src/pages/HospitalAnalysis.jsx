import React, { useState, useEffect } from "react";
import { Hospital } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  AlertTriangle, 
  Trash2, 
  Search,
  BarChart3,
  RefreshCw
} from "lucide-react";

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

export default function HospitalAnalysis() {
  const [hospitals, setHospitals] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    setIsLoading(true);
    try {
      const data = await Hospital.list("-created_date", 10000);
      setHospitals(data);
      
      // Analyze duplicates
      const nameGroups = {};
      data.forEach(hospital => {
        const key = hospital.name.toLowerCase().trim();
        if (!nameGroups[key]) {
          nameGroups[key] = [];
        }
        nameGroups[key].push(hospital);
      });

      const duplicateGroups = Object.entries(nameGroups)
        .filter(([name, hospitals]) => hospitals.length > 1)
        .map(([name, hospitals]) => ({
          name: hospitals[0].name, // Original casing
          count: hospitals.length,
          hospitals: hospitals.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
        }));

      setDuplicates(duplicateGroups);

      // Calculate stats by state
      const stateStats = {};
      data.forEach(hospital => {
        const state = hospital.state || 'Unknown';
        stateStats[state] = (stateStats[state] || 0) + 1;
      });

      setStats(stateStats);
    } catch (error) {
      console.error("Error loading hospitals:", error);
    }
    setIsLoading(false);
  };

  const removeDuplicates = async (duplicateGroup) => {
    if (!confirm(`Remove ${duplicateGroup.count - 1} duplicate entries for "${duplicateGroup.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      // Keep the first (oldest) entry, delete the rest
      const toDelete = duplicateGroup.hospitals.slice(1);
      
      for (const hospital of toDelete) {
        await Hospital.delete(hospital.id);
      }
      
      await loadHospitals(); // Refresh data
    } catch (error) {
      console.error("Error removing duplicates:", error);
      alert(`Error removing duplicates: ${error.message}`);
    }
    setIsDeleting(false);
  };

  const removeAllDuplicates = async () => {
    if (!confirm(`Remove ALL ${duplicates.reduce((sum, d) => sum + d.count - 1, 0)} duplicate entries? This will keep only the oldest entry for each hospital name.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      for (const duplicateGroup of duplicates) {
        const toDelete = duplicateGroup.hospitals.slice(1);
        for (const hospital of toDelete) {
          await Hospital.delete(hospital.id);
        }
      }
      
      await loadHospitals(); // Refresh data
    } catch (error) {
      console.error("Error removing all duplicates:", error);
      alert(`Error removing duplicates: ${error.message}`);
    }
    setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const totalDuplicates = duplicates.reduce((sum, d) => sum + d.count - 1, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Hospital Database Analysis</h1>
          <p className="text-slate-600">Analyze and clean up your hospital database</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{hospitals.length}</div>
                  <div className="text-sm text-slate-600">Total Hospitals</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{duplicates.length}</div>
                  <div className="text-sm text-slate-600">Duplicate Names</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{totalDuplicates}</div>
                  <div className="text-sm text-slate-600">Extra Entries</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{hospitals.length - totalDuplicates}</div>
                  <div className="text-sm text-slate-600">After Cleanup</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* State Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Hospitals by State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Object.entries(stats).map(([state, count]) => (
                <div key={state} className="text-center">
                  <div className="text-lg font-semibold text-slate-900">{count}</div>
                  <div className="text-sm text-slate-600">
                    {GERMAN_STATES[state] || state}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Duplicates Section */}
        {duplicates.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Duplicate Hospitals ({duplicates.length} names, {totalDuplicates} extra entries)
                </CardTitle>
                <Button 
                  onClick={removeAllDuplicates}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Removing...</>
                  ) : (
                    <><Trash2 className="w-4 h-4 mr-2" />Remove All Duplicates</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Found {totalDuplicates} duplicate entries that can be safely removed. 
                  The system will keep the oldest entry for each hospital name.
                </AlertDescription>
              </Alert>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {duplicates.map((duplicate, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{duplicate.name}</h3>
                        <p className="text-sm text-slate-600">
                          {duplicate.count} entries found ({duplicate.count - 1} duplicates)
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeDuplicates(duplicate)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove {duplicate.count - 1} Dupes
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {duplicate.hospitals.map((hospital, hospitalIndex) => (
                        <div key={hospital.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant={hospitalIndex === 0 ? "default" : "secondary"}>
                              {hospitalIndex === 0 ? "KEEP" : "DELETE"}
                            </Badge>
                            <span className="text-slate-600">
                              Created: {new Date(hospital.created_date).toLocaleDateString()}
                            </span>
                            <span className="text-slate-500">
                              State: {GERMAN_STATES[hospital.state] || hospital.state}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {duplicates.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Duplicates Found</h3>
              <p className="text-slate-500">Your hospital database looks clean!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}