/**
 * Medication Administration Record Form
 * 
 * Document all medications administered to patients
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
import { Pill, Save, Download, Plus, Trash2 } from "lucide-react";

interface MedicationEntry {
  id: string;
  date: string;
  time: string;
  medication: string;
  dosage: string;
  route: string;
  frequency?: string;
  indication: string;
  administeredBy: string;
  patientResponse: string;
  notes?: string;
}

export default function MedicationRecordForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    recordDate: new Date().toISOString().split("T")[0],
    patientName: "",
    patientId: "",
    medications: [] as MedicationEntry[],
    allergies: "",
    currentMedications: "",
    notes: "",
  });

  const [newMedication, setNewMedication] = useState<Omit<MedicationEntry, "id">>({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    medication: "",
    dosage: "",
    route: "",
    frequency: "",
    indication: "",
    administeredBy: "",
    patientResponse: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: Date.now().toString(), ...data }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmt-med-ops/medication-records"] });
      toast({
        title: "Success",
        description: "Medication record saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save medication record",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleAddMedication = () => {
    if (!newMedication.medication || !newMedication.dosage || !newMedication.administeredBy) {
      toast({
        title: "Incomplete",
        description: "Medication, dosage, and administrator are required",
        variant: "destructive",
      });
      return;
    }

    setFormData({
      ...formData,
      medications: [
        ...formData.medications,
        { ...newMedication, id: Date.now().toString() },
      ],
    });

    setNewMedication({
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      medication: "",
      dosage: "",
      route: "",
      frequency: "",
      indication: "",
      administeredBy: "",
      patientResponse: "",
      notes: "",
    });
  };

  const handleRemoveMedication = (id: string) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((m) => m.id !== id),
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medication_record_${formData.recordDate}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Medication record exported successfully" });
  };

  const COMMON_MEDICATIONS = [
    "Ibuprofen",
    "Acetaminophen",
    "Aspirin",
    "Diphenhydramine",
    "Epinephrine",
    "Oxygen",
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
    "Rectal",
    "Other",
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Pill className="w-5 h-5" />
              <span>Medication Administration Record</span>
            </CardTitle>
            <CardDescription>
              Document all medications administered to patients
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Record"}
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
                <Label htmlFor="recordDate">Record Date</Label>
                <Input
                  id="recordDate"
                  type="date"
                  value={formData.recordDate}
                  onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
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
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-3">
                <Label htmlFor="allergies">Known Allergies</Label>
                <Input
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="List all known allergies (or 'None known')"
                />
              </div>
              <div className="space-y-2 col-span-3">
                <Label htmlFor="currentMedications">Current Medications</Label>
                <Textarea
                  id="currentMedications"
                  value={formData.currentMedications}
                  onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                  rows={2}
                  placeholder="List current medications patient is taking..."
                />
              </div>
            </div>
          </div>

          {/* Medication Entries */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Medication Administration</h3>
            
            {/* Existing Medications */}
            {formData.medications.length > 0 && (
              <div className="space-y-3">
                {formData.medications.map((medication) => (
                  <Card key={medication.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium">
                            {medication.date} at {medication.time}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Medication: {medication.medication}</span>
                        </div>
                        <div>
                          <span className="text-sm">Dosage: {medication.dosage}</span>
                        </div>
                        <div>
                          <span className="text-sm">Route: {medication.route}</span>
                        </div>
                        <div>
                          <span className="text-sm">Indication: {medication.indication}</span>
                        </div>
                        <div>
                          <span className="text-sm">Administered by: {medication.administeredBy}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm">Response: {medication.patientResponse}</span>
                        </div>
                        {medication.notes && (
                          <div className="col-span-2">
                            <span className="text-sm">Notes: {medication.notes}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMedication(medication.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add New Medication */}
            <Card className="p-4 border-dashed">
              <h4 className="font-semibold mb-4">Add New Medication</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medDate">Date</Label>
                    <Input
                      id="medDate"
                      type="date"
                      value={newMedication.date}
                      onChange={(e) => setNewMedication({ ...newMedication, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medTime">Time</Label>
                    <Input
                      id="medTime"
                      type="time"
                      value={newMedication.time}
                      onChange={(e) => setNewMedication({ ...newMedication, time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medication">
                      Medication <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newMedication.medication}
                      onValueChange={(value) => setNewMedication({ ...newMedication, medication: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medication" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_MEDICATIONS.map((med) => (
                          <SelectItem key={med} value={med}>
                            {med}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dosage">
                      Dosage <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dosage"
                      value={newMedication.dosage}
                      onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                      placeholder="e.g., 500mg, 1 tablet"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="route">
                      Route <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newMedication.route}
                      onValueChange={(value) => setNewMedication({ ...newMedication, route: value })}
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
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Input
                      id="frequency"
                      value={newMedication.frequency}
                      onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                      placeholder="e.g., Every 6 hours"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="indication">Indication</Label>
                    <Input
                      id="indication"
                      value={newMedication.indication}
                      onChange={(e) => setNewMedication({ ...newMedication, indication: e.target.value })}
                      placeholder="Reason for medication"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="administeredBy">
                      Administered By <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="administeredBy"
                      value={newMedication.administeredBy}
                      onChange={(e) => setNewMedication({ ...newMedication, administeredBy: e.target.value })}
                      placeholder="Provider name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientResponse">Patient Response</Label>
                  <Textarea
                    id="patientResponse"
                    value={newMedication.patientResponse}
                    onChange={(e) => setNewMedication({ ...newMedication, patientResponse: e.target.value })}
                    rows={2}
                    placeholder="Describe patient response to medication..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medNotes">Notes</Label>
                  <Textarea
                    id="medNotes"
                    value={newMedication.notes}
                    onChange={(e) => setNewMedication({ ...newMedication, notes: e.target.value })}
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>
                <Button type="button" onClick={handleAddMedication} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication Entry
                </Button>
              </div>
            </Card>
          </div>

          {/* Additional Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes or comments regarding medication administration..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Medication Record"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




