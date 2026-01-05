/**
 * Glaucoma Screening Form Component
 * 
 * Pre-dive medical screening form for glaucoma assessment
 * Required for Diver Medic Technician operations
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
import { Stethoscope, Save, Download } from "lucide-react";

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
];

export default function GlaucomaForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    screeningDate: new Date().toISOString().split("T")[0],
    diverName: "",
    diverAge: "",
    diverId: "",
    examinerName: "",
    examinerQualification: "",
    medicalHistory: {
      familyHistoryGlaucoma: "",
      previousGlaucomaDiagnosis: "",
      previousEyeSurgery: "",
      diabetes: "",
      hypertension: "",
      migraines: "",
      medications: "",
    },
    visualAcuity: {
      rightEyeDistance: "",
      leftEyeDistance: "",
      rightEyeNear: "",
      leftEyeNear: "",
      withCorrection: "",
    },
    intraocularPressure: {
      rightEye: "",
      leftEye: "",
      method: "",
      timeOfDay: "",
    },
    fundoscopy: {
      rightEyeOpticNerve: "",
      leftEyeOpticNerve: "",
      rightEyeCupDiscRatio: "",
      leftEyeCupDiscRatio: "",
      rightEyeNotes: "",
      leftEyeNotes: "",
    },
    peripheralVisualField: {
      rightEye: "",
      leftEye: "",
      method: "",
      findings: "",
    },
    assessment: {
      suspicionLevel: "",
      findings: "",
      recommendations: "",
      clearanceForDiving: "",
      followUpRequired: "",
      followUpDate: "",
    },
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Mock API call - in production this would be a real API endpoint
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: Date.now().toString(), ...data }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmt-med-ops/glaucoma-screenings"] });
      toast({
        title: "Success",
        description: "Glaucoma screening form saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save glaucoma screening",
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
    link.download = `glaucoma_screening_${formData.screeningDate}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Glaucoma screening form exported successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Stethoscope className="w-5 h-5" />
              <span>Glaucoma Screening Form</span>
            </CardTitle>
            <CardDescription>
              Pre-dive medical screening for glaucoma assessment - Required for DMT operations
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Screening"}
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
                <Label htmlFor="screeningDate">
                  Screening Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="screeningDate"
                  type="date"
                  value={formData.screeningDate}
                  onChange={(e) => setFormData({ ...formData, screeningDate: e.target.value })}
                  required
                />
              </div>
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
                <Label htmlFor="diverId">Diver ID/Employee Number</Label>
                <Input
                  id="diverId"
                  value={formData.diverId}
                  onChange={(e) => setFormData({ ...formData, diverId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examinerName">
                  Examiner Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="examinerName"
                  value={formData.examinerName}
                  onChange={(e) => setFormData({ ...formData, examinerName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examinerQualification">Examiner Qualification</Label>
                <Input
                  id="examinerQualification"
                  value={formData.examinerQualification}
                  onChange={(e) => setFormData({ ...formData, examinerQualification: e.target.value })}
                  placeholder="e.g., DMT, MD, DO"
                />
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Medical History</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Family History of Glaucoma</Label>
                <RadioGroup
                  value={formData.medicalHistory.familyHistoryGlaucoma}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      medicalHistory: {
                        ...formData.medicalHistory,
                        familyHistoryGlaucoma: value,
                      },
                    })
                  }
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`familyHistory-${option.value}`} />
                      <Label htmlFor={`familyHistory-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Previous Glaucoma Diagnosis</Label>
                <RadioGroup
                  value={formData.medicalHistory.previousGlaucomaDiagnosis}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      medicalHistory: {
                        ...formData.medicalHistory,
                        previousGlaucomaDiagnosis: value,
                      },
                    })
                  }
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`previousDiagnosis-${option.value}`} />
                      <Label htmlFor={`previousDiagnosis-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Previous Eye Surgery</Label>
                <RadioGroup
                  value={formData.medicalHistory.previousEyeSurgery}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      medicalHistory: {
                        ...formData.medicalHistory,
                        previousEyeSurgery: value,
                      },
                    })
                  }
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`eyeSurgery-${option.value}`} />
                      <Label htmlFor={`eyeSurgery-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Diabetes</Label>
                <RadioGroup
                  value={formData.medicalHistory.diabetes}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      medicalHistory: {
                        ...formData.medicalHistory,
                        diabetes: value,
                      },
                    })
                  }
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`diabetes-${option.value}`} />
                      <Label htmlFor={`diabetes-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Hypertension</Label>
                <RadioGroup
                  value={formData.medicalHistory.hypertension}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      medicalHistory: {
                        ...formData.medicalHistory,
                        hypertension: value,
                      },
                    })
                  }
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`hypertension-${option.value}`} />
                      <Label htmlFor={`hypertension-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Migraines</Label>
                <RadioGroup
                  value={formData.medicalHistory.migraines}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      medicalHistory: {
                        ...formData.medicalHistory,
                        migraines: value,
                      },
                    })
                  }
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`migraines-${option.value}`} />
                      <Label htmlFor={`migraines-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                value={formData.medicalHistory.medications}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    medicalHistory: { ...formData.medicalHistory, medications: e.target.value },
                  })
                }
                rows={2}
                placeholder="List current medications, especially eye drops or medications that affect intraocular pressure..."
              />
            </div>
          </div>

          {/* Visual Acuity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Visual Acuity</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rightEyeDistance">Right Eye (Distance)</Label>
                <Input
                  id="rightEyeDistance"
                  value={formData.visualAcuity.rightEyeDistance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visualAcuity: { ...formData.visualAcuity, rightEyeDistance: e.target.value },
                    })
                  }
                  placeholder="e.g., 20/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftEyeDistance">Left Eye (Distance)</Label>
                <Input
                  id="leftEyeDistance"
                  value={formData.visualAcuity.leftEyeDistance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visualAcuity: { ...formData.visualAcuity, leftEyeDistance: e.target.value },
                    })
                  }
                  placeholder="e.g., 20/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rightEyeNear">Right Eye (Near)</Label>
                <Input
                  id="rightEyeNear"
                  value={formData.visualAcuity.rightEyeNear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visualAcuity: { ...formData.visualAcuity, rightEyeNear: e.target.value },
                    })
                  }
                  placeholder="e.g., J1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftEyeNear">Left Eye (Near)</Label>
                <Input
                  id="leftEyeNear"
                  value={formData.visualAcuity.leftEyeNear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visualAcuity: { ...formData.visualAcuity, leftEyeNear: e.target.value },
                    })
                  }
                  placeholder="e.g., J1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withCorrection">With Correction</Label>
              <Input
                id="withCorrection"
                value={formData.visualAcuity.withCorrection}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    visualAcuity: { ...formData.visualAcuity, withCorrection: e.target.value },
                  })
                }
                placeholder="e.g., Glasses, Contact Lenses"
              />
            </div>
          </div>

          {/* Intraocular Pressure */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Intraocular Pressure (IOP)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rightEyeIOP">Right Eye (mmHg)</Label>
                <Input
                  id="rightEyeIOP"
                  type="number"
                  value={formData.intraocularPressure.rightEye}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intraocularPressure: {
                        ...formData.intraocularPressure,
                        rightEye: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., 16"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftEyeIOP">Left Eye (mmHg)</Label>
                <Input
                  id="leftEyeIOP"
                  type="number"
                  value={formData.intraocularPressure.leftEye}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intraocularPressure: {
                        ...formData.intraocularPressure,
                        leftEye: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., 16"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iopMethod">Measurement Method</Label>
                <Input
                  id="iopMethod"
                  value={formData.intraocularPressure.method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intraocularPressure: {
                        ...formData.intraocularPressure,
                        method: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., Goldmann, Tono-Pen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iopTime">Time of Day</Label>
                <Input
                  id="iopTime"
                  type="time"
                  value={formData.intraocularPressure.timeOfDay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      intraocularPressure: {
                        ...formData.intraocularPressure,
                        timeOfDay: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Fundoscopy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fundoscopy</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rightEyeOpticNerve">Right Eye - Optic Nerve Appearance</Label>
                <Select
                  value={formData.fundoscopy.rightEyeOpticNerve}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      fundoscopy: {
                        ...formData.fundoscopy,
                        rightEyeOpticNerve: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="suspicious">Suspicious</SelectItem>
                    <SelectItem value="abnormal">Abnormal</SelectItem>
                    <SelectItem value="not_examined">Not Examined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftEyeOpticNerve">Left Eye - Optic Nerve Appearance</Label>
                <Select
                  value={formData.fundoscopy.leftEyeOpticNerve}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      fundoscopy: {
                        ...formData.fundoscopy,
                        leftEyeOpticNerve: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="suspicious">Suspicious</SelectItem>
                    <SelectItem value="abnormal">Abnormal</SelectItem>
                    <SelectItem value="not_examined">Not Examined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rightEyeCupDisc">Right Eye - Cup:Disc Ratio</Label>
                <Input
                  id="rightEyeCupDisc"
                  value={formData.fundoscopy.rightEyeCupDiscRatio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fundoscopy: {
                        ...formData.fundoscopy,
                        rightEyeCupDiscRatio: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., 0.3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftEyeCupDisc">Left Eye - Cup:Disc Ratio</Label>
                <Input
                  id="leftEyeCupDisc"
                  value={formData.fundoscopy.leftEyeCupDiscRatio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fundoscopy: {
                        ...formData.fundoscopy,
                        leftEyeCupDiscRatio: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., 0.3"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rightEyeNotes">Right Eye - Notes</Label>
                <Textarea
                  id="rightEyeNotes"
                  value={formData.fundoscopy.rightEyeNotes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fundoscopy: {
                        ...formData.fundoscopy,
                        rightEyeNotes: e.target.value,
                      },
                    })
                  }
                  rows={2}
                  placeholder="Additional findings..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftEyeNotes">Left Eye - Notes</Label>
                <Textarea
                  id="leftEyeNotes"
                  value={formData.fundoscopy.leftEyeNotes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fundoscopy: {
                        ...formData.fundoscopy,
                        leftEyeNotes: e.target.value,
                      },
                    })
                  }
                  rows={2}
                  placeholder="Additional findings..."
                />
              </div>
            </div>
          </div>

          {/* Peripheral Visual Field */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Peripheral Visual Field</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rightEyeField">Right Eye</Label>
                <Select
                  value={formData.peripheralVisualField.rightEye}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      peripheralVisualField: {
                        ...formData.peripheralVisualField,
                        rightEye: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="defect">Defect Present</SelectItem>
                    <SelectItem value="not_examined">Not Examined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leftEyeField">Left Eye</Label>
                <Select
                  value={formData.peripheralVisualField.leftEye}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      peripheralVisualField: {
                        ...formData.peripheralVisualField,
                        leftEye: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="defect">Defect Present</SelectItem>
                    <SelectItem value="not_examined">Not Examined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fieldMethod">Method</Label>
                <Input
                  id="fieldMethod"
                  value={formData.peripheralVisualField.method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      peripheralVisualField: {
                        ...formData.peripheralVisualField,
                        method: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., Confrontation, Automated"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldFindings">Findings</Label>
              <Textarea
                id="fieldFindings"
                value={formData.peripheralVisualField.findings}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    peripheralVisualField: {
                      ...formData.peripheralVisualField,
                      findings: e.target.value,
                    },
                  })
                }
                rows={2}
                placeholder="Describe any visual field defects..."
              />
            </div>
          </div>

          {/* Assessment and Recommendations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assessment and Recommendations</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="suspicionLevel">Suspicion Level for Glaucoma</Label>
                <Select
                  value={formData.assessment.suspicionLevel}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, suspicionLevel: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clearanceForDiving">Clearance for Diving</Label>
                <Select
                  value={formData.assessment.clearanceForDiving}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, clearanceForDiving: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="cleared_with_restrictions">Cleared with Restrictions</SelectItem>
                    <SelectItem value="not_cleared">Not Cleared</SelectItem>
                    <SelectItem value="pending">Pending Further Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="findings">Clinical Findings Summary</Label>
              <Textarea
                id="findings"
                value={formData.assessment.findings}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assessment: { ...formData.assessment, findings: e.target.value },
                  })
                }
                rows={3}
                placeholder="Summarize key clinical findings..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations</Label>
              <Textarea
                id="recommendations"
                value={formData.assessment.recommendations}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assessment: { ...formData.assessment, recommendations: e.target.value },
                  })
                }
                rows={3}
                placeholder="Recommendations for follow-up, treatment, or monitoring..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="followUpRequired">Follow-Up Required</Label>
                <Select
                  value={formData.assessment.followUpRequired}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      assessment: { ...formData.assessment, followUpRequired: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.assessment.followUpRequired === "yes" && (
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Follow-Up Date</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={formData.assessment.followUpDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assessment: { ...formData.assessment, followUpDate: e.target.value },
                      })
                    }
                  />
                </div>
              )}
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
            <Button type="submit" disabled={mutation.isPending} className="min-w-[150px]">
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Glaucoma Screening"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


