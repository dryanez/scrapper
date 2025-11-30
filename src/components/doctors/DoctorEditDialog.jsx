import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, X } from "lucide-react";

const GERMAN_STATES = {
  "BW": "Baden-Württemberg", "BY": "Bayern", "BE": "Berlin", "BB": "Brandenburg", "HB": "Bremen",
  "HH": "Hamburg", "HE": "Hessen", "MV": "Mecklenburg-Vorpommern", "NI": "Niedersachsen",
  "NW": "Nordrhein-Westfalen", "RP": "Rheinland-Pfalz", "SL": "Saarland", "SN": "Sachsen",
  "ST": "Sachsen-Anhalt", "SH": "Schleswig-Holstein", "TH": "Thüringen"
};

const SPECIALTIES = [
  "Innere Medizin", "Chirurgie", "Orthopädie/Unfallchirurgie", "Anästhesie", "Radiologie", 
  "Gynäkologie", "Pädiatrie", "Neurologie", "Urologie", "Dermatologie", "HNO", "Psychiatrie"
];

const WORK_PERMIT_OPTIONS = [
  { value: "EU_CITIZEN", label: "EU Citizen" },
  { value: "WORK_PERMIT", label: "Work Permit" },
  { value: "VISA_REQUIRED", label: "Visa Required" },
  { value: "PENDING", label: "Pending" }
];

export default function DoctorEditDialog({ doctor, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialties: [],
    languages: [],
    currentState: "",
    desiredStates: [],
    willingToRelocate: false,
    workPermitStatus: "",
    experienceYears: "",
    notes: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (doctor && open) {
      setFormData({
        firstName: doctor.firstName || "",
        lastName: doctor.lastName || "",
        email: doctor.email || "",
        phone: doctor.phone || "",
        specialties: doctor.specialties || [],
        languages: doctor.languages || [],
        currentState: doctor.currentState || "",
        desiredStates: doctor.desiredStates || [],
        willingToRelocate: doctor.willingToRelocate || false,
        workPermitStatus: doctor.workPermitStatus || "",
        experienceYears: doctor.experienceYears || "",
        notes: doctor.notes || ""
      });
    }
  }, [doctor, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving doctor:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpecialtyToggle = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleDesiredStateToggle = (state) => {
    setFormData(prev => ({
      ...prev,
      desiredStates: prev.desiredStates.includes(state)
        ? prev.desiredStates.filter(s => s !== state)
        : [...prev.desiredStates, state]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Doctor Profile</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="experienceYears">Years of Experience</Label>
              <Input
                id="experienceYears"
                type="number"
                value={formData.experienceYears}
                onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || "" }))}
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <div>
              <Label>Specialties</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
                {SPECIALTIES.map(specialty => (
                  <div key={specialty} className="flex items-center space-x-2">
                    <Checkbox
                      id={specialty}
                      checked={formData.specialties.includes(specialty)}
                      onCheckedChange={() => handleSpecialtyToggle(specialty)}
                    />
                    <Label htmlFor={specialty} className="text-sm">{specialty}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="currentState">Current State</Label>
              <Select
                value={formData.currentState}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currentState: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select current state" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GERMAN_STATES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Desired States</Label>
              <div className="grid grid-cols-2 gap-1 mt-2 max-h-32 overflow-y-auto text-sm">
                {Object.entries(GERMAN_STATES).map(([code, name]) => (
                  <div key={code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`desired-${code}`}
                      checked={formData.desiredStates.includes(code)}
                      onCheckedChange={() => handleDesiredStateToggle(code)}
                    />
                    <Label htmlFor={`desired-${code}`} className="text-xs">{name}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="workPermitStatus">Work Permit Status</Label>
              <Select
                value={formData.workPermitStatus}
                onValueChange={(value) => setFormData(prev => ({ ...prev, workPermitStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work permit status" />
                </SelectTrigger>
                <SelectContent>
                  {WORK_PERMIT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="willingToRelocate"
                checked={formData.willingToRelocate}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, willingToRelocate: checked }))}
              />
              <Label htmlFor="willingToRelocate">Willing to relocate</Label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="mt-2"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}