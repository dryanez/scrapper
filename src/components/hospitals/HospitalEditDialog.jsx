
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

const GERMAN_STATES = {
  "BW": "Baden-Württemberg", "BY": "Bayern", "BE": "Berlin", "BB": "Brandenburg", "HB": "Bremen",
  "HH": "Hamburg", "HE": "Hessen", "MV": "Mecklenburg-Vorpommern", "NI": "Niedersachsen",
  "NW": "Nordrhein-Westfalen", "RP": "Rheinland-Pfalz", "SL": "Saarland", "SN": "Sachsen",
  "ST": "Sachsen-Anhalt", "SH": "Schleswig-Holstein", "TH": "Thüringen"
};

const HOSPITAL_TYPES = [
  { value: "university_hospital", label: "University Hospital" },
  { value: "general_hospital", label: "General Hospital" },
  { value: "specialty_clinic", label: "Specialty Clinic" },
  { value: "medical_center", label: "Medical Center" },
  { value: "rehabilitation_center", label: "Rehabilitation Center" },
  { value: "other", label: "Other" }
];

const MEDICAL_SPECIALTIES = [
  "Innere Medizin", "Chirurgie", "Orthopädie/Unfallchirurgie", "Anästhesie", 
  "Radiologie", "Gynäkologie", "Pädiatrie", "Neurologie", "Urologie", 
  "Dermatologie", "HNO", "Psychiatrie", "Allgemeinmedizin"
];

export default function HospitalEditDialog({ hospital, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    websiteUrl: '',
    careerPageUrl: '',
    city: '',
    state: '',
    address: '',
    phone: '',
    email: '',
    type: 'general_hospital',
    specialties: [],
    bedCount: '',
    notes: ''
  });

  const [currentSpecialty, setCurrentSpecialty] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // When the dialog opens or the hospital data changes, populate the form
    if (hospital) {
        setFormData({
            name: hospital.name || '',
            logoUrl: hospital.logoUrl || '',
            websiteUrl: hospital.websiteUrl || '',
            careerPageUrl: hospital.careerPageUrl || '',
            city: hospital.city || '',
            state: hospital.state || '',
            address: hospital.address || '',
            phone: hospital.phone || '',
            email: hospital.email || '',
            type: hospital.type || 'general_hospital',
            specialties: hospital.specialties || [],
            bedCount: hospital.bedCount || '',
            notes: hospital.notes || ''
        });
    } else {
      // Optionally reset form if hospital becomes null/undefined (e.g., for 'add new')
      setFormData({
        name: '',
        logoUrl: '',
        websiteUrl: '',
        careerPageUrl: '',
        city: '',
        state: '',
        address: '',
        phone: '',
        email: '',
        type: 'general_hospital',
        specialties: [],
        bedCount: '',
        notes: ''
      });
    }
  }, [hospital, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const hospitalData = {
        ...formData,
        bedCount: formData.bedCount ? parseInt(formData.bedCount) : null,
      };
      
      await onSave(hospitalData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving hospital:", error);
    }
    setIsSaving(false);
  };

  const addSpecialty = () => {
    if (currentSpecialty && !formData.specialties.includes(currentSpecialty)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, currentSpecialty]
      });
      setCurrentSpecialty('');
    }
  };

  const removeSpecialty = (specialty) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Hospital Information</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Hospital Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Universitätsklinikum Heidelberg"
              />
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="e.g. Heidelberg"
              />
            </div>

            <div>
              <Label htmlFor="state">Federal State *</Label>
              <Select value={formData.state} onValueChange={(value) => setFormData({...formData, state: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GERMAN_STATES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Hospital Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hospital type" />
                </SelectTrigger>
                <SelectContent>
                  {HOSPITAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bedCount">Number of Beds</Label>
              <Input
                id="bedCount"
                type="number"
                value={formData.bedCount}
                onChange={(e) => setFormData({...formData, bedCount: e.target.value})}
                placeholder="e.g. 1500"
              />
            </div>
          </div>

          {/* Contact & URLs */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                placeholder="https://www.hospital.de"
              />
            </div>

            <div>
              <Label htmlFor="careerPageUrl">Career Page URL</Label>
              <Input
                id="careerPageUrl"
                type="url"
                value={formData.careerPageUrl}
                onChange={(e) => setFormData({...formData, careerPageUrl: e.target.value})}
                placeholder="https://www.hospital.de/careers"
              />
            </div>

            <div>
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="e.g. +49 6221 56-0"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="info@hospital.de"
              />
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div className="space-y-3">
          <Label>Medical Specialties</Label>
          <div className="flex gap-2">
            <Select value={currentSpecialty} onValueChange={setCurrentSpecialty}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add medical specialty" />
              </SelectTrigger>
              <SelectContent>
                {MEDICAL_SPECIALTIES.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={addSpecialty} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                {specialty}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => removeSpecialty(specialty)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes & Contact Information</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Additional information, contact persons, email addresses..."
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
