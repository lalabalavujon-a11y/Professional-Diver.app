/**
 * Neurological Examination Form (Neuro Exam Slate)
 * 
 * Comprehensive neurological assessment form for DCS/AGE evaluation
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Brain, Save, Download } from "lucide-react";

const NORMAL_ABNORMAL_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "abnormal", label: "Abnormal" },
  { value: "not_tested", label: "Not Tested" },
];

export default function NeurologicalExamForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    examDate: new Date().toISOString().split("T")[0],
    examTime: new Date().toTimeString().slice(0, 5),
    patientName: "",
    patientAge: "",
    examinerName: "",
    examinerQualification: "",
    reasonForExam: "",
    
    // Mental Status
    alertness: "",
    orientation: "",
    memory: "",
    speech: "",
    
    // Cranial Nerves
    cn1_olfactory: "",
    cn2_visual: "",
    cn3_4_6_extraocular: "",
    cn5_trigeminal: "",
    cn7_facial: "",
    cn8_auditory: "",
    cn9_10_swallow: "",
    cn11_accessory: "",
    cn12_hypoglossal: "",
    
    // Motor Function
    strength_upperRight: "",
    strength_upperLeft: "",
    strength_lowerRight: "",
    strength_lowerLeft: "",
    tone: "",
    coordination: "",
    
    // Sensory Function
    sensation_lightTouch: "",
    sensation_pinprick: "",
    sensation_vibration: "",
    sensation_proprioception: "",
    
    // Reflexes
    reflexes_biceps: "",
    reflexes_triceps: "",
    reflexes_brachioradialis: "",
    reflexes_patellar: "",
    reflexes_achilles: "",
    babinski: "",
    
    // Gait & Balance
    gait: "",
    romberg: "",
    tandemGait: "",
    
    // Diving-Specific
    suspectedDCS: "",
    suspectedAGE: "",
    symptomOnset: "",
    diveProfile: "",
    
    // Assessment
    findings: "",
    diagnosis: "",
    recommendations: "",
    followUpRequired: "",
    followUpDate: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: Date.now().toString(), ...data }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmt-med-ops/neurological-exams"] });
      toast({
        title: "Success",
        description: "Neurological examination saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save examination",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neurological_exam_${formData.examDate}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Examination exported successfully" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Neurological Examination Form (Neuro Exam Slate)</span>
            </CardTitle>
            <CardDescription>
              Comprehensive neurological assessment for DCS/AGE evaluation
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Examination"}
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
                <Label htmlFor="examDate">Examination Date</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examTime">Time</Label>
                <Input
                  id="examTime"
                  type="time"
                  value={formData.examTime}
                  onChange={(e) => setFormData({ ...formData, examTime: e.target.value })}
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
                <Label htmlFor="examinerName">Examiner Name</Label>
                <Input
                  id="examinerName"
                  value={formData.examinerName}
                  onChange={(e) => setFormData({ ...formData, examinerName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reasonForExam">Reason for Examination</Label>
                <Input
                  id="reasonForExam"
                  value={formData.reasonForExam}
                  onChange={(e) => setFormData({ ...formData, reasonForExam: e.target.value })}
                  placeholder="e.g., Suspected DCS, Routine screening"
                />
              </div>
            </div>
          </div>

          {/* Mental Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Mental Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alertness</Label>
                <Select
                  value={formData.alertness}
                  onValueChange={(value) => setFormData({ ...formData, alertness: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="drowsy">Drowsy</SelectItem>
                    <SelectItem value="obtunded">Obtunded</SelectItem>
                    <SelectItem value="stuporous">Stuporous</SelectItem>
                    <SelectItem value="comatose">Comatose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Orientation (Person, Place, Time)</Label>
                <Select
                  value={formData.orientation}
                  onValueChange={(value) => setFormData({ ...formData, orientation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oriented_x3">Oriented x3</SelectItem>
                    <SelectItem value="oriented_x2">Oriented x2</SelectItem>
                    <SelectItem value="oriented_x1">Oriented x1</SelectItem>
                    <SelectItem value="disoriented">Disoriented</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Memory</Label>
                <RadioGroup
                  value={formData.memory}
                  onValueChange={(value) => setFormData({ ...formData, memory: value })}
                >
                  {NORMAL_ABNORMAL_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`memory-${option.value}`} />
                      <Label htmlFor={`memory-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Speech</Label>
                <RadioGroup
                  value={formData.speech}
                  onValueChange={(value) => setFormData({ ...formData, speech: value })}
                >
                  {NORMAL_ABNORMAL_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`speech-${option.value}`} />
                      <Label htmlFor={`speech-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Cranial Nerves */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cranial Nerves</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CN I - Olfactory</Label>
                <Select
                  value={formData.cn1_olfactory}
                  onValueChange={(value) => setFormData({ ...formData, cn1_olfactory: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {NORMAL_ABNORMAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CN II - Visual Acuity & Fields</Label>
                <Select
                  value={formData.cn2_visual}
                  onValueChange={(value) => setFormData({ ...formData, cn2_visual: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {NORMAL_ABNORMAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CN III, IV, VI - Extraocular Movements</Label>
                <Select
                  value={formData.cn3_4_6_extraocular}
                  onValueChange={(value) => setFormData({ ...formData, cn3_4_6_extraocular: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {NORMAL_ABNORMAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CN VII - Facial Movement</Label>
                <Select
                  value={formData.cn7_facial}
                  onValueChange={(value) => setFormData({ ...formData, cn7_facial: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {NORMAL_ABNORMAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Motor Function */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Motor Function</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="strength_upperRight">Upper Right Strength</Label>
                <Select
                  value={formData.strength_upperRight}
                  onValueChange={(value) => setFormData({ ...formData, strength_upperRight: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5/5 - Normal</SelectItem>
                    <SelectItem value="4">4/5 - Good</SelectItem>
                    <SelectItem value="3">3/5 - Fair</SelectItem>
                    <SelectItem value="2">2/5 - Poor</SelectItem>
                    <SelectItem value="1">1/5 - Trace</SelectItem>
                    <SelectItem value="0">0/5 - None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength_upperLeft">Upper Left Strength</Label>
                <Select
                  value={formData.strength_upperLeft}
                  onValueChange={(value) => setFormData({ ...formData, strength_upperLeft: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5/5 - Normal</SelectItem>
                    <SelectItem value="4">4/5 - Good</SelectItem>
                    <SelectItem value="3">3/5 - Fair</SelectItem>
                    <SelectItem value="2">2/5 - Poor</SelectItem>
                    <SelectItem value="1">1/5 - Trace</SelectItem>
                    <SelectItem value="0">0/5 - None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength_lowerRight">Lower Right Strength</Label>
                <Select
                  value={formData.strength_lowerRight}
                  onValueChange={(value) => setFormData({ ...formData, strength_lowerRight: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5/5 - Normal</SelectItem>
                    <SelectItem value="4">4/5 - Good</SelectItem>
                    <SelectItem value="3">3/5 - Fair</SelectItem>
                    <SelectItem value="2">2/5 - Poor</SelectItem>
                    <SelectItem value="1">1/5 - Trace</SelectItem>
                    <SelectItem value="0">0/5 - None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength_lowerLeft">Lower Left Strength</Label>
                <Select
                  value={formData.strength_lowerLeft}
                  onValueChange={(value) => setFormData({ ...formData, strength_lowerLeft: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5/5 - Normal</SelectItem>
                    <SelectItem value="4">4/5 - Good</SelectItem>
                    <SelectItem value="3">3/5 - Fair</SelectItem>
                    <SelectItem value="2">2/5 - Poor</SelectItem>
                    <SelectItem value="1">1/5 - Trace</SelectItem>
                    <SelectItem value="0">0/5 - None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Diving-Specific Assessment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Diving-Specific Assessment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Suspected DCS</Label>
                <RadioGroup
                  value={formData.suspectedDCS}
                  onValueChange={(value) => setFormData({ ...formData, suspectedDCS: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="dcs-yes" />
                    <Label htmlFor="dcs-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="dcs-no" />
                    <Label htmlFor="dcs-no" className="cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Suspected AGE</Label>
                <RadioGroup
                  value={formData.suspectedAGE}
                  onValueChange={(value) => setFormData({ ...formData, suspectedAGE: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="age-yes" />
                    <Label htmlFor="age-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="age-no" />
                    <Label htmlFor="age-no" className="cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="symptomOnset">Symptom Onset</Label>
                <Input
                  id="symptomOnset"
                  value={formData.symptomOnset}
                  onChange={(e) => setFormData({ ...formData, symptomOnset: e.target.value })}
                  placeholder="e.g., Immediately upon surfacing"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diveProfile">Dive Profile</Label>
                <Input
                  id="diveProfile"
                  value={formData.diveProfile}
                  onChange={(e) => setFormData({ ...formData, diveProfile: e.target.value })}
                  placeholder="e.g., 30m for 25 minutes"
                />
              </div>
            </div>
          </div>

          {/* Assessment & Findings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assessment & Findings</h3>
            <div className="space-y-2">
              <Label htmlFor="findings">Clinical Findings Summary</Label>
              <Textarea
                id="findings"
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                rows={4}
                placeholder="Summarize key neurological findings..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Working Diagnosis</Label>
              <Input
                id="diagnosis"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="e.g., Type II DCS, AGE, Normal exam"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations</Label>
              <Textarea
                id="recommendations"
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                rows={3}
                placeholder="Treatment recommendations, follow-up, etc..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional observations or comments..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Neurological Examination"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

