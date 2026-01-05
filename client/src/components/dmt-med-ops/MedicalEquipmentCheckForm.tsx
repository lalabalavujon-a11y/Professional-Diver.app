/**
 * Medical Equipment Check Form Component
 * 
 * Form for before/after use checks of medical equipment
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface MedicalEquipmentCheckFormProps {
  equipmentId: string;
  checkType: "before" | "after";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function MedicalEquipmentCheckForm({
  equipmentId,
  checkType,
  open,
  onOpenChange,
  onSuccess,
}: MedicalEquipmentCheckFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkedBy, setCheckedBy] = useState("");
  const [pressure, setPressure] = useState("");
  const [condition, setCondition] = useState({
    visual: false,
    pressureGauge: false,
    valves: false,
    regulator: false,
    seal: false,
    expiry: false,
    complete: false,
  });
  const [issues, setIssues] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch equipment details
  const { data: equipment } = useQuery({
    queryKey: ["/api/dmt-med-ops/equipment", equipmentId],
    queryFn: async () => {
      // Mock data - in production this would fetch from API
      return {
        id: equipmentId,
        name: "O2 Cylinder - Primary",
        equipmentType: "Oxygen Cylinder",
        serialNumber: "O2-001",
      };
    },
    enabled: open && !!equipmentId,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Mock API call - in production this would be a real API endpoint
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: Date.now().toString(), ...data }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmt-med-ops/equipment"] });
      toast({
        title: "Success",
        description: `Equipment ${checkType === "before" ? "pre-use" : "post-use"} check completed successfully`,
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save check",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allChecked = Object.values(condition).every((val) => val === true);
    if (!allChecked) {
      toast({
        title: "Incomplete Check",
        description: "Please complete all check items before submitting",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      equipmentId,
      checkType,
      checkedBy,
      pressure: pressure ? parseFloat(pressure) : undefined,
      condition,
      issues: issues || undefined,
      notes: notes || undefined,
      timestamp: new Date().toISOString(),
    });
  };

  const handleReset = () => {
    setCheckedBy("");
    setPressure("");
    setCondition({
      visual: false,
      pressureGauge: false,
      valves: false,
      regulator: false,
      seal: false,
      expiry: false,
      complete: false,
    });
    setIssues("");
    setNotes("");
  };

  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  const checkItems = [
    { key: "visual", label: "Visual inspection - no damage, corrosion, or defects" },
    { key: "pressureGauge", label: "Pressure gauge reading accurate and within range" },
    { key: "valves", label: "Valves operate smoothly and seal properly" },
    { key: "regulator", label: "Regulator attached securely and functioning" },
    { key: "seal", label: "Seals intact and not damaged" },
    { key: "expiry", label: "Within expiry date (if applicable)" },
    { key: "complete", label: "All components present and accounted for" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {checkType === "before" ? "Before Use Check" : "After Use Check"} - {equipment?.name}
          </DialogTitle>
          <DialogDescription>
            {checkType === "before"
              ? "Complete pre-use inspection checklist for medical equipment"
              : "Complete post-use inspection checklist for medical equipment"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkedBy">
                Checked By <span className="text-red-500">*</span>
              </Label>
              <Input
                id="checkedBy"
                value={checkedBy}
                onChange={(e) => setCheckedBy(e.target.value)}
                required
                placeholder="Name of person performing check"
              />
            </div>

            {(equipment?.equipmentType === "Oxygen Cylinder" || equipment?.equipmentType === "Oxygen Regulator") && (
              <div className="space-y-2">
                <Label htmlFor="pressure">Pressure (PSI/Bar)</Label>
                <Input
                  id="pressure"
                  type="number"
                  value={pressure}
                  onChange={(e) => setPressure(e.target.value)}
                  placeholder="e.g., 200"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Inspection Checklist</Label>
            <div className="space-y-3 border rounded-lg p-4">
              {checkItems.map((item) => (
                <div key={item.key} className="flex items-start space-x-3">
                  <Checkbox
                    id={item.key}
                    checked={condition[item.key as keyof typeof condition]}
                    onCheckedChange={(checked) =>
                      setCondition({ ...condition, [item.key]: checked === true })
                    }
                    className="mt-1"
                  />
                  <Label
                    htmlFor={item.key}
                    className="flex-1 cursor-pointer text-sm font-normal leading-relaxed"
                  >
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issues">Issues Found (if any)</Label>
            <Textarea
              id="issues"
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder="Describe any issues, defects, or concerns..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional observations or comments..."
              rows={3}
            />
          </div>

          {Object.values(condition).every((val) => val === true) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                All checklist items completed - Equipment ready for {checkType === "before" ? "use" : "storage"}
              </span>
            </div>
          )}

          {!Object.values(condition).every((val) => val === true) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Please complete all checklist items before submitting
              </span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : `Complete ${checkType === "before" ? "Pre-Use" : "Post-Use"} Check`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

