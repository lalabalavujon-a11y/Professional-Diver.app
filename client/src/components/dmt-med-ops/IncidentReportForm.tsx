/**
 * Incident Report Form Component
 * 
 * Form for documenting diving incidents, accidents, and medical emergencies
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, Download } from "lucide-react";

const INCIDENT_TYPES = [
  "Diving Incident",
  "Decompression Sickness",
  "Arterial Gas Embolism",
  "Near Drowning",
  "Equipment Failure",
  "Medical Emergency",
  "Trauma",
  "Other",
];

const SEVERITY_LEVELS = [
  { value: "MINOR", label: "Minor - No medical intervention required" },
  { value: "MODERATE", label: "Moderate - Medical attention required" },
  { value: "SEVERE", label: "Severe - Urgent medical care required" },
  { value: "CRITICAL", label: "Critical - Life-threatening" },
];

export default function IncidentReportForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    incidentDate: new Date().toISOString().split("T")[0],
    incidentTime: new Date().toTimeString().slice(0, 5),
    location: "",
    incidentType: "",
    severity: "",
    reporterName: "",
    reporterRole: "",
    diverName: "",
    diverAge: "",
    diverExperience: "",
    diveProfile: {
      maxDepth: "",
      bottomTime: "",
      surfaceInterval: "",
      gasMix: "",
    },
    description: "",
    initialAssessment: "",
    treatmentProvided: "",
    vitalSigns: {
      pulse: "",
      bloodPressure: "",
      respirations: "",
      oxygenSaturation: "",
      temperature: "",
      gcs: "",
    },
    witnesses: "",
    actionsTaken: "",
    outcome: "",
    recommendations: "",
    followUpRequired: false,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Mock API call - in production this would be a real API endpoint
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: Date.now().toString(), ...data }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmt-med-ops/incidents"] });
      toast({
        title: "Success",
        description: "Incident report saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save incident report",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleExport = () => {
    // Create a downloadable JSON/PDF of the form
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `incident_report_${formData.incidentDate}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported",
      description: "Incident report exported successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Incident Report Form</span>
            </CardTitle>
            <CardDescription>
              Document diving incidents, accidents, and medical emergencies
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Incident Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="incidentDate">
                  Incident Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentTime">
                  Incident Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="incidentTime"
                  type="time"
                  value={formData.incidentTime}
                  onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  placeholder="e.g., Offshore Platform - North Sea"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="incidentType">
                  Incident Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.incidentType}
                  onValueChange={(value) => setFormData({ ...formData, incidentType: value })}
                  required
                >
                  <SelectTrigger id="incidentType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="severity">
                Severity Level <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value })}
                required
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reporter Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reporter Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reporterName">
                  Reporter Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reporterName"
                  value={formData.reporterName}
                  onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reporterRole">
                  Reporter Role <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reporterRole"
                  value={formData.reporterRole}
                  onChange={(e) => setFormData({ ...formData, reporterRole: e.target.value })}
                  required
                  placeholder="e.g., DMT, Dive Supervisor"
                />
              </div>
            </div>
          </div>

          {/* Patient/Diver Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Patient/Diver Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diverName">
                  Diver Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="diverName"
                  value={formData.diverName}
                  onChange={(e) => setFormData({ ...formData, diverName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diverAge">Age</Label>
                <Input
                  id="diverAge"
                  type="number"
                  value={formData.diverAge}
                  onChange={(e) => setFormData({ ...formData, diverAge: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diverExperience">Experience Level</Label>
                <Input
                  id="diverExperience"
                  value={formData.diverExperience}
                  onChange={(e) => setFormData({ ...formData, diverExperience: e.target.value })}
                  placeholder="e.g., 5 years commercial"
                />
              </div>
            </div>
          </div>

          {/* Dive Profile */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dive Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDepth">Maximum Depth (m)</Label>
                <Input
                  id="maxDepth"
                  type="number"
                  value={formData.diveProfile.maxDepth}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diveProfile: { ...formData.diveProfile, maxDepth: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bottomTime">Bottom Time (minutes)</Label>
                <Input
                  id="bottomTime"
                  type="number"
                  value={formData.diveProfile.bottomTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diveProfile: { ...formData.diveProfile, bottomTime: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surfaceInterval">Surface Interval</Label>
                <Input
                  id="surfaceInterval"
                  value={formData.diveProfile.surfaceInterval}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diveProfile: { ...formData.diveProfile, surfaceInterval: e.target.value },
                    })
                  }
                  placeholder="e.g., 2 hours"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gasMix">Gas Mix</Label>
                <Input
                  id="gasMix"
                  value={formData.diveProfile.gasMix}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diveProfile: { ...formData.diveProfile, gasMix: e.target.value },
                    })
                  }
                  placeholder="e.g., Air, Nitrox 32"
                />
              </div>
            </div>
          </div>

          {/* Incident Description */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Incident Description</h3>
            <div className="space-y-2">
              <Label htmlFor="description">
                Description of Incident <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                placeholder="Provide a detailed description of what happened..."
              />
            </div>
          </div>

          {/* Medical Assessment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Medical Assessment</h3>
            <div className="space-y-2">
              <Label htmlFor="initialAssessment">Initial Assessment</Label>
              <Textarea
                id="initialAssessment"
                value={formData.initialAssessment}
                onChange={(e) => setFormData({ ...formData, initialAssessment: e.target.value })}
                rows={3}
                placeholder="Initial medical assessment findings..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pulse">Pulse (BPM)</Label>
                <Input
                  id="pulse"
                  type="number"
                  value={formData.vitalSigns.pulse}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitalSigns: { ...formData.vitalSigns, pulse: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                <Input
                  id="bloodPressure"
                  value={formData.vitalSigns.bloodPressure}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitalSigns: { ...formData.vitalSigns, bloodPressure: e.target.value },
                    })
                  }
                  placeholder="e.g., 120/80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="respirations">Respirations (BPM)</Label>
                <Input
                  id="respirations"
                  type="number"
                  value={formData.vitalSigns.respirations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitalSigns: { ...formData.vitalSigns, respirations: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oxygenSaturation">O2 Saturation (%)</Label>
                <Input
                  id="oxygenSaturation"
                  type="number"
                  value={formData.vitalSigns.oxygenSaturation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitalSigns: { ...formData.vitalSigns, oxygenSaturation: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={formData.vitalSigns.temperature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitalSigns: { ...formData.vitalSigns, temperature: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gcs">GCS Score</Label>
                <Input
                  id="gcs"
                  type="number"
                  min="3"
                  max="15"
                  value={formData.vitalSigns.gcs}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitalSigns: { ...formData.vitalSigns, gcs: e.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="treatmentProvided">Treatment Provided</Label>
              <Textarea
                id="treatmentProvided"
                value={formData.treatmentProvided}
                onChange={(e) => setFormData({ ...formData, treatmentProvided: e.target.value })}
                rows={3}
                placeholder="Describe all treatments and interventions provided..."
              />
            </div>
          </div>

          {/* Actions and Outcome */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Actions and Outcome</h3>
            <div className="space-y-2">
              <Label htmlFor="actionsTaken">Actions Taken</Label>
              <Textarea
                id="actionsTaken"
                value={formData.actionsTaken}
                onChange={(e) => setFormData({ ...formData, actionsTaken: e.target.value })}
                rows={3}
                placeholder="Describe actions taken in response to the incident..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Textarea
                id="outcome"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                rows={3}
                placeholder="Describe the outcome and current status of the patient..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations</Label>
              <Textarea
                id="recommendations"
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                rows={3}
                placeholder="Recommendations for prevention or follow-up..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="witnesses">Witnesses</Label>
              <Textarea
                id="witnesses"
                value={formData.witnesses}
                onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                rows={2}
                placeholder="Names and contact information of witnesses..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="followUpRequired"
                checked={formData.followUpRequired}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, followUpRequired: checked === true })
                }
              />
              <Label htmlFor="followUpRequired" className="cursor-pointer">
                Follow-up medical assessment required
              </Label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={mutation.isPending} className="min-w-[150px]">
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Incident Report"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}



