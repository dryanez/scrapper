import React, { useState } from 'react';
import { Application } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Target, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const STATUS_OPTIONS = [
  { value: 'APPLIED', label: 'Applied', icon: <Users className="w-4 h-4" />, color: "bg-slate-100 text-slate-800" },
  { value: 'INTERVIEWING', label: 'Interviewing', icon: <Users className="w-4 h-4" />, color: "bg-blue-100 text-blue-800" },
  { value: 'OFFERED', label: 'Offered', icon: <Target className="w-4 h-4" />, color: "bg-purple-100 text-purple-800" },
  { value: 'REJECTED', label: 'Rejected', icon: <XCircle className="w-4 h-4" />, color: "bg-gray-100 text-gray-700" },
  { value: 'HIRED', label: 'Hired', icon: <CheckCircle className="w-4 h-4" />, color: "bg-green-100 text-green-800" },
  { value: 'WITHDRAWN', label: 'Withdrawn', icon: <XCircle className="w-4 h-4" />, color: "bg-red-100 text-red-800" }
];

export default function ApplicationStatusDialog({ application, doctor, open, onOpenChange, onSuccess }) {
  const [selectedStatus, setSelectedStatus] = useState(application?.status || 'APPLIED');
  const [notes, setNotes] = useState(application?.details?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!application || !doctor) return;
    
    setIsSaving(true);
    try {
      const doctorId = application.doctorId || application.doctor_id;
      const jobId = application.jobId || application.job_id;
      
      if (application.type === 'manual') {
        // Update existing manual application
        await Application.update(application.id, {
          status: selectedStatus,
          notes: notes
        });
      } else if (application.type === 'email') {
        // For email applications, check if a manual Application record exists
        const existingApps = await Application.filter({ 
          doctorId: doctorId, 
          jobId: jobId 
        });
        
        if (existingApps.length > 0) {
          // Update existing application record
          await Application.update(existingApps[0].id, {
            status: selectedStatus,
            notes: notes
          });
        } else {
          // Create new application record (only valid columns)
          await Application.create({
            doctorId: doctorId,
            jobId: jobId,
            appliedAt: application.date ? application.date.toISOString() : new Date().toISOString(),
            status: selectedStatus,
            notes: notes
          });
        }
      }

      toast({
        title: "Status Updated",
        description: `Application status changed to ${selectedStatus.toLowerCase()}.`,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Failed to update application status:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: `Could not update status. ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const currentStatusInfo = STATUS_OPTIONS.find(s => s.value === selectedStatus);
  
  // Handle snake_case field names
  const doctorFirstName = doctor?.firstName || doctor?.first_name || '';
  const doctorLastName = doctor?.lastName || doctor?.last_name || '';
  const jobTitle = application?.jobTitle || application?.job_title || 'Unknown Position';
  const hospitalName = application?.hospitalName || application?.hospital_name || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Application Status</DialogTitle>
          <DialogDescription>
            Track the progress of this application through the hiring process.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Application Details</Label>
            <div className="p-3 bg-slate-50 rounded-md text-sm">
              <div className="font-semibold">{doctorFirstName} {doctorLastName} → {jobTitle}</div>
              <div className="text-slate-600">{hospitalName}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="flex items-center gap-2">
              <Badge className={currentStatusInfo?.color}>
                {currentStatusInfo?.icon}
                <span className="ml-1">{currentStatusInfo?.label}</span>
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-select">Update Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      {status.icon}
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea 
              id="notes"
              placeholder="e.g., Interview scheduled for next Tuesday, salary negotiation in progress..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}