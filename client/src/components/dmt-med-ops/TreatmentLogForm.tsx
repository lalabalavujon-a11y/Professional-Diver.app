/**
 * Treatment/Intervention Log Form
 * 
 * Document all medical treatments and interventions provided
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, Save, Download, Plus, Trash2 } from "lucide-react";

interface TreatmentEntry {
  id: string;
  time: string;
  treatment: string;
  medication?: string;
  dosage?: string;
  route?: string;
  provider: string;
  response: string;
  notes?: string;
}

export default function TreatmentLogForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    logDate: new Date().toISOString().split("T")[0],
    patientName: "",
    patientId: "",
    incidentId: "",
    chiefComplaint: "",
    treatments: [] as TreatmentEntry[],
    overallResponse: "",
    disposition: "",
    notes: "",
  });

  const [newTreatment, setNewTreatment] = useState<Omit<TreatmentEntry, "id">>({
    time: new Date().toTimeString().slice(0, 5),
    treatment: "",
    medication: "",
    dosage: "",
    route: "",
    provider: "",
    response: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: Date.now().toString(), ...data }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmt-med-ops/treatment-logs"] });
      toast({
        title: "Success",
        description: "Treatment log saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save treatment log",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleAddTreatment = () => {
    if (!newTreatment.treatment || !newTreatment.provider) {
      toast({
        title: "Incomplete",
        description: "Treatment and provider are required",
        variant: "destructive",
      });
      return;
    }

    setFormData({
      ...formData,
      treatments: [
        ...formData.treatments,
        { ...newTreatment, id: Date.now().toString() },
      ],
    });

    setNewTreatment({
      time: new Date().toTimeString().slice(0, 5),
      treatment: "",
      medication: "",
      dosage: "",
      route: "",
      provider: "",
      response: "",
      notes: "",
    });
  };

  const handleRemoveTreatment = (id: string) => {
    setFormData({
      ...formData,
      treatments: formData.treatments.filter((t) => t.id !== id),
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `treatment_log_${formData.logDate}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Treatment log exported successfully" });
  };

  const TREATMENT_TYPES = [
    "Oxygen Therapy",
    "IV Fluid Administration",
    "Medication Administration",
    "Wound Care",
    "Splinting/Immobilization",
    "Airway Management",
    "CPR",
    "Defibrillation",
    "Pain Management",
    "Other",
  ];

  const ROUTES = [
    "Oral",
    "IV",
    "IM",
    "Subcutaneous",
    "Intranasal",
    "Inhalation",
    "Topical",
    "Other",
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5" />
              <span>Treatment/Intervention Log</span>
            </CardTitle>
            <CardDescription>
              Document all medical treatments and interventions provided
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Log"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Patient Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logDate">Date</Label>
                <Input
                  id="logDate"
                  type="date"
                  value={formData.logDate}
                  onChange={(e) => setFormData({ ...formData, logDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentId">Incident ID (if applicable)</Label>
                <Input
                  id="incidentId"
                  value={formData.incidentId}
                  onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-3">
                <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                <Input
                  id="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  placeholder="Primary reason for treatment"
                />
              </div>
            </div>
          </div>

          {/* Treatment Entries */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Treatment Entries</h3>
            
            {/* Existing Treatments */}
            {formData.treatments.length > 0 && (
              <div className="space-y-3">
                {formData.treatments.map((treatment) => (
                  <Card key={treatment.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium">Time: {treatment.time}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Treatment: {treatment.treatment}</span>
                        </div>
                        {treatment.medication && (
                          <div>
                            <span className="text-sm">Medication: {treatment.medication}</span>
                            {treatment.dosage && <span className="text-sm"> - {treatment.dosage}</span>}
                          </div>
                        )}
                        <div>
                          <span className="text-sm">Provider: {treatment.provider}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm">Response: {treatment.response}</span>
                        </div>
                        {treatment.notes && (
                          <div className="col-span-2">
                            <span className="text-sm">Notes: {treatment.notes}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTreatment(treatment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add New Treatment */}
            <Card className="p-4 border-dashed">
              <h4 className="font-semibold mb-4">Add New Treatment</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="treatmentTime">Time</Label>
                    <Input
                      id="treatmentTime"
                      type="time"
                      value={newTreatment.time}
                      onChange={(e) => setNewTreatment({ ...newTreatment, time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatmentType">
                      Treatment Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newTreatment.treatment}
                      onValueChange={(value) => setNewTreatment({ ...newTreatment, treatment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        {TREATMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider">
                      Provider <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="provider"
                      value={newTreatment.provider}
                      onChange={(e) => setNewTreatment({ ...newTreatment, provider: e.target.value })}
                      placeholder="Provider name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medication">Medication (if applicable)</Label>
                    <Input
                      id="medication"
                      value={newTreatment.medication}
                      onChange={(e) => setNewTreatment({ ...newTreatment, medication: e.target.value })}
                      placeholder="Medication name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      value={newTreatment.dosage}
                      onChange={(e) => setNewTreatment({ ...newTreatment, dosage: e.target.value })}
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="route">Route</Label>
                    <Select
                      value={newTreatment.route}
                      onValueChange={(value) => setNewTreatment({ ...newTreatment, route: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROUTES.map((route) => (
                          <SelectItem key={route} value={route}>
                            {route}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="response">Patient Response</Label>
                  <Textarea
                    id="response"
                    value={newTreatment.response}
                    onChange={(e) => setNewTreatment({ ...newTreatment, response: e.target.value })}
                    rows={2}
                    placeholder="Describe patient response to treatment..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="treatmentNotes">Notes</Label>
                  <Textarea
                    id="treatmentNotes"
                    value={newTreatment.notes}
                    onChange={(e) => setNewTreatment({ ...newTreatment, notes: e.target.value })}
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>
                <Button type="button" onClick={handleAddTreatment} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Treatment Entry
                </Button>
              </div>
            </Card>
          </div>

          {/* Overall Assessment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Overall Assessment</h3>
            <div className="space-y-2">
              <Label htmlFor="overallResponse">Overall Patient Response</Label>
              <Textarea
                id="overallResponse"
                value={formData.overallResponse}
                onChange={(e) => setFormData({ ...formData, overallResponse: e.target.value })}
                rows={3}
                placeholder="Summarize overall patient response to all treatments..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disposition">Disposition</Label>
              <Select
                value={formData.disposition}
                onValueChange={(value) => setFormData({ ...formData, disposition: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select disposition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discharged">Discharged</SelectItem>
                  <SelectItem value="transferred">Transferred to Hospital</SelectItem>
                  <SelectItem value="monitoring">Continued Monitoring</SelectItem>
                  <SelectItem value="hyperbaric">Referred for Hyperbaric Treatment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes or comments..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Treatment Log"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

