/**
 * Diver Medical Participant Questionnaire Form
 * 
 * Pre-dive medical screening questionnaire for DMT operations
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
import { FileText, Save, Download } from "lucide-react";

const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" },
];

export default function MedicalQuestionnaireForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    questionnaireDate: new Date().toISOString().split("T")[0],
    diverName: "",
    diverAge: "",
    diverId: "",
    examinerName: "",
    examinerQualification: "",
    
    // Medical History
    heartConditions: "",
    lungConditions: "",
    epilepsy: "",
    diabetes: "",
    highBloodPressure: "",
    faintingOrBlackouts: "",
    currentMedications: "",
    medicationDetails: "",
    
    // Diving History
    previousDivingInjuries: "",
    previousDCS: "",
    previousAGE: "",
    divingExperience: "",
    
    // Lifestyle & Health
    smoking: "",
    alcoholUse: "",
    drugUse: "",
    pregnancy: "",
    
    // Current Health
    currentIllness: "",
    recentSurgery: "",
    recentInjuries: "",
    
    // Assessment
    clearedForDiving: "",
    restrictions: "",
    recommendations: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: Date.now().toString(), ...data }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmt-med-ops/questionnaires"] });
      toast({
        title: "Success",
        description: "Medical questionnaire saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save questionnaire",
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
    link.download = `medical_questionnaire_${formData.questionnaireDate}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Questionnaire exported successfully" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Diver Medical Participant Questionnaire</span>
            </CardTitle>
            <CardDescription>
              Pre-dive medical screening questionnaire for diving operations
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleSubmit} disabled={mutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? "Saving..." : "Save Questionnaire"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Participant Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Participant Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questionnaireDate">Date</Label>
                <Input
                  id="questionnaireDate"
                  type="date"
                  value={formData.questionnaireDate}
                  onChange={(e) => setFormData({ ...formData, questionnaireDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diverName">Diver Name</Label>
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
                <Label htmlFor="examinerName">Examiner Name</Label>
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
                <Label>Heart Conditions</Label>
                <RadioGroup
                  value={formData.heartConditions}
                  onValueChange={(value) => setFormData({ ...formData, heartConditions: value })}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`heart-${option.value}`} />
                      <Label htmlFor={`heart-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Lung Conditions</Label>
                <RadioGroup
                  value={formData.lungConditions}
                  onValueChange={(value) => setFormData({ ...formData, lungConditions: value })}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`lung-${option.value}`} />
                      <Label htmlFor={`lung-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Epilepsy</Label>
                <RadioGroup
                  value={formData.epilepsy}
                  onValueChange={(value) => setFormData({ ...formData, epilepsy: value })}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`epilepsy-${option.value}`} />
                      <Label htmlFor={`epilepsy-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Diabetes</Label>
                <RadioGroup
                  value={formData.diabetes}
                  onValueChange={(value) => setFormData({ ...formData, diabetes: value })}
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
                <Label>High Blood Pressure</Label>
                <RadioGroup
                  value={formData.highBloodPressure}
                  onValueChange={(value) => setFormData({ ...formData, highBloodPressure: value })}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`bp-${option.value}`} />
                      <Label htmlFor={`bp-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Fainting or Blackouts</Label>
                <RadioGroup
                  value={formData.faintingOrBlackouts}
                  onValueChange={(value) => setFormData({ ...formData, faintingOrBlackouts: value })}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`fainting-${option.value}`} />
                      <Label htmlFor={`fainting-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                id="currentMedications"
                value={formData.currentMedications}
                onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                rows={2}
                placeholder="List all current medications..."
              />
            </div>
          </div>

          {/* Diving History */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Diving History</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Previous Diving Injuries</Label>
                <RadioGroup
                  value={formData.previousDivingInjuries}
                  onValueChange={(value) => setFormData({ ...formData, previousDivingInjuries: value })}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`injuries-${option.value}`} />
                      <Label htmlFor={`injuries-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Previous DCS (Decompression Sickness)</Label>
                <RadioGroup
                  value={formData.previousDCS}
                  onValueChange={(value) => setFormData({ ...formData, previousDCS: value })}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`dcs-${option.value}`} />
                      <Label htmlFor={`dcs-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Previous AGE (Arterial Gas Embolism)</Label>
                <RadioGroup
                  value={formData.previousAGE}
                  onValueChange={(value) => setFormData({ ...formData, previousAGE: value })}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`age-${option.value}`} />
                      <Label htmlFor={`age-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="divingExperience">Diving Experience</Label>
                <Input
                  id="divingExperience"
                  value={formData.divingExperience}
                  onChange={(e) => setFormData({ ...formData, divingExperience: e.target.value })}
                  placeholder="e.g., 5 years commercial diving"
                />
              </div>
            </div>
          </div>

          {/* Lifestyle & Health */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Lifestyle & Current Health</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Smoking</Label>
                <RadioGroup
                  value={formData.smoking}
                  onValueChange={(value) => setFormData({ ...formData, smoking: value })}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`smoking-${option.value}`} />
                      <Label htmlFor={`smoking-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Pregnancy (if applicable)</Label>
                <RadioGroup
                  value={formData.pregnancy}
                  onValueChange={(value) => setFormData({ ...formData, pregnancy: value })}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`pregnancy-${option.value}`} />
                      <Label htmlFor={`pregnancy-${option.value}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentIllness">Current Illness or Symptoms</Label>
                <Textarea
                  id="currentIllness"
                  value={formData.currentIllness}
                  onChange={(e) => setFormData({ ...formData, currentIllness: e.target.value })}
                  rows={2}
                  placeholder="Describe any current illness or symptoms..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recentSurgery">Recent Surgery</Label>
                <Textarea
                  id="recentSurgery"
                  value={formData.recentSurgery}
                  onChange={(e) => setFormData({ ...formData, recentSurgery: e.target.value })}
                  rows={2}
                  placeholder="Describe any recent surgeries..."
                />
              </div>
            </div>
          </div>

          {/* Assessment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Medical Assessment</h3>
            <div className="space-y-2">
              <Label htmlFor="clearedForDiving">Cleared for Diving</Label>
              <Select
                value={formData.clearedForDiving}
                onValueChange={(value) => setFormData({ ...formData, clearedForDiving: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="cleared_restrictions">Cleared with Restrictions</SelectItem>
                  <SelectItem value="not_cleared">Not Cleared</SelectItem>
                  <SelectItem value="pending">Pending Further Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restrictions">Restrictions (if any)</Label>
              <Textarea
                id="restrictions"
                value={formData.restrictions}
                onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                rows={2}
                placeholder="Describe any diving restrictions..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendations">Recommendations</Label>
              <Textarea
                id="recommendations"
                value={formData.recommendations}
                onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                rows={2}
                placeholder="Medical recommendations..."
              />
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
              {mutation.isPending ? "Saving..." : "Save Questionnaire"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}








