import React, { useState, useEffect } from 'react';
import { Doctor } from '@/api/entities';
import { Application } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { ChevronsUpDown, Check, UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function LogApplicationDialog({ job, open, onOpenChange, onSuccess }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isComboOpen, setIsComboOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const fetchDoctors = async () => {
        const doctorsData = await Doctor.list("-updated_date", 500);
        setDoctors(doctorsData);
      };
      fetchDoctors();
      // Reset form on open
      setSelectedDoctor(null);
      setNotes("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedDoctor || !job) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a doctor.",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await Application.create({
        jobId: job.id,
        doctorId: selectedDoctor.id,
        jobTitle: job.title,
        hospitalName: job.hospitalName,
        appliedAt: new Date().toISOString(),
        status: "APPLIED",
        notes: notes,
      });

      toast({
        title: "Application Logged",
        description: `Logged application for ${selectedDoctor.firstName} ${selectedDoctor.lastName} to "${job.title}".`,
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to log application:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: `Could not log application. ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Manual Application</DialogTitle>
          <DialogDescription>
            Record that you have contacted a hospital about a doctor for this job.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Job</label>
            <p className="p-2 bg-slate-100 rounded-md text-sm text-slate-800">{job?.title}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="doctor-combo" className="text-sm font-medium">Doctor *</label>
            <Popover open={isComboOpen} onOpenChange={setIsComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isComboOpen}
                  className="w-full justify-between"
                  id="doctor-combo"
                >
                  {selectedDoctor
                    ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}`
                    : "Select a doctor..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search doctor..." />
                  <CommandEmpty>No doctor found.</CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-y-auto">
                    {doctors.map((doctor) => (
                      <CommandItem
                        key={doctor.id}
                        value={`${doctor.firstName} ${doctor.lastName} ${doctor.email}`}
                        onSelect={() => {
                          setSelectedDoctor(doctor);
                          setIsComboOpen(false);
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${selectedDoctor?.id === doctor.id ? "opacity-100" : "opacity-0"}`}
                        />
                        {doctor.firstName} {doctor.lastName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">Notes</label>
            <Textarea 
              id="notes"
              placeholder="e.g., Emailed HR department, mentioned candidate's availability..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !selectedDoctor}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Log Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}