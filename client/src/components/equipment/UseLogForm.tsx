import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText } from "lucide-react";

interface UseLogFormProps {
  equipmentItemId: string;
  equipmentName?: string;
  onComplete?: () => void;
}

export default function UseLogForm({ equipmentItemId, equipmentName, onComplete }: UseLogFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [useType, setUseType] = useState<"BEFORE_USE" | "AFTER_USE">("BEFORE_USE");
  const [condition, setCondition] = useState<"EXCELLENT" | "GOOD" | "FAIR" | "POOR">("GOOD");
  const [defects, setDefects] = useState("");
  const [notes, setNotes] = useState("");
  const [hoursUsed, setHoursUsed] = useState("");
  const [location, setLocation] = useState("");
  const [performedBy, setPerformedBy] = useState("");

  const createUseLogMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        "/api/equipment/use-logs",
        {
          equipmentItemId,
          useType,
          logDate: new Date().toISOString(),
          performedBy: performedBy || "system",
          condition,
          defects: defects || undefined,
          notes: notes || undefined,
          hoursUsed: hoursUsed ? parseFloat(hoursUsed) : undefined,
          location: location || undefined,
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/use-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/items", equipmentItemId] });
      toast({
        title: "Success",
        description: "Use log created successfully",
      });
      // Reset form
      setDefects("");
      setNotes("");
      setHoursUsed("");
      setLocation("");
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create use log",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Equipment Use Log</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {equipmentName && (
            <div>
              <Label>Equipment</Label>
              <p className="text-lg font-medium">{equipmentName}</p>
            </div>
          )}

          <div>
            <Label>Log Type *</Label>
            <RadioGroup value={useType} onValueChange={(value) => setUseType(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BEFORE_USE" id="before-use" />
                <Label htmlFor="before-use" className="cursor-pointer">
                  Before Use
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AFTER_USE" id="after-use" />
                <Label htmlFor="after-use" className="cursor-pointer">
                  After Use
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="performedBy">Performed By *</Label>
            <Input
              id="performedBy"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              placeholder="Enter your name or ID"
              required
            />
          </div>

          <div>
            <Label htmlFor="condition">Condition *</Label>
            <Select value={condition} onValueChange={(value) => setCondition(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXCELLENT">Excellent</SelectItem>
                <SelectItem value="GOOD">Good</SelectItem>
                <SelectItem value="FAIR">Fair</SelectItem>
                <SelectItem value="POOR">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {useType === "AFTER_USE" && (
            <div>
              <Label htmlFor="hoursUsed">Hours Used</Label>
              <Input
                id="hoursUsed"
                type="number"
                step="0.1"
                value={hoursUsed}
                onChange={(e) => setHoursUsed(e.target.value)}
                placeholder="Enter hours used"
              />
            </div>
          )}

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location where equipment was used"
            />
          </div>

          <div>
            <Label htmlFor="defects">Defects (if any)</Label>
            <Textarea
              id="defects"
              value={defects}
              onChange={(e) => setDefects(e.target.value)}
              placeholder="Describe any defects or issues observed"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about equipment use"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => createUseLogMutation.mutate()}
              disabled={!performedBy || createUseLogMutation.isPending}
              className="flex-1"
            >
              {createUseLogMutation.isPending ? "Creating..." : "Create Use Log"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


