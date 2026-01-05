/**
 * Dive Plan Editor Component
 * 
 * Dive plan and profile management with:
 * - Depth and bottom time
 * - Decompression profile
 * - Gas mixture calculator
 * - Equipment checklist
 * - Risk assessment matrix
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin,
  Save,
  Waves,
  AlertTriangle,
  Package,
  Moon,
  Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DivePlan {
  id: string;
  operationId: string;
  maxDepth?: number;
  bottomTime?: number;
  decompressionProfile: any[];
  gasMixtures: any[];
  equipment: any[];
  riskAssessment: any;
}

export default function DivePlanEditor({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    maxDepth: "",
    bottomTime: "",
    decompressionStops: "",
    gasMixtures: "",
    equipment: "",
    riskAssessment: "",
    isNightOps: false,
    nightOpsConsiderations: "",
  });

  // Fetch operations
  const { data: operations = [] } = useQuery({
    queryKey: ["/api/dive-supervisor/operations"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/operations?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch operations');
      return response.json();
    },
  });

  // Fetch dive plan
  const { data: divePlan } = useQuery<DivePlan>({
    queryKey: ["/api/dive-supervisor/dive-plans", operationId],
    queryFn: async () => {
      if (!operationId) return null;
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/dive-plans?email=${email}&operationId=${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch dive plan');
      const data = await response.json();
      if (data) {
        setFormData({
          maxDepth: data.maxDepth?.toString() || "",
          bottomTime: data.bottomTime?.toString() || "",
          decompressionStops: JSON.stringify(data.decompressionProfile || [], null, 2),
          gasMixtures: JSON.stringify(data.gasMixtures || [], null, 2),
          equipment: JSON.stringify(data.equipment || [], null, 2),
          riskAssessment: JSON.stringify(data.riskAssessment || {}, null, 2),
          isNightOps: data.isNightOps || false,
          nightOpsConsiderations: JSON.stringify(data.nightOpsConsiderations || {}, null, 2),
        });
      }
      return data;
    },
    enabled: !!operationId,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (!operationId) throw new Error('No operation selected');
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = divePlan 
        ? `/api/dive-supervisor/dive-plans/${divePlan.id}`
        : '/api/dive-supervisor/dive-plans';
      const response = await fetch(url, {
        method: divePlan ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          operationId,
          email,
        }),
      });
      if (!response.ok) throw new Error('Failed to save dive plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/dive-plans"] });
      toast({
        title: "Success",
        description: divePlan ? "Dive plan updated" : "Dive plan created",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    try {
      const data = {
        maxDepth: formData.maxDepth ? parseFloat(formData.maxDepth) : undefined,
        bottomTime: formData.bottomTime ? parseInt(formData.bottomTime) : undefined,
        decompressionProfile: formData.decompressionStops ? JSON.parse(formData.decompressionStops) : [],
        gasMixtures: formData.gasMixtures ? JSON.parse(formData.gasMixtures) : [],
        equipment: formData.equipment ? JSON.parse(formData.equipment) : [],
        riskAssessment: formData.riskAssessment ? JSON.parse(formData.riskAssessment) : {},
        isNightOps: formData.isNightOps,
        nightOpsConsiderations: formData.nightOpsConsiderations ? JSON.parse(formData.nightOpsConsiderations) : {},
      };
      mutation.mutate(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Invalid JSON format: " + error.message,
        variant: "destructive",
      });
    }
  };

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to create or edit the dive plan</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={operationId || "none"}
              onValueChange={(value) => onOperationSelect(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Operation</SelectItem>
                {operations.map((op: any) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dive Plan & Profile</h2>
          <p className="text-sm text-muted-foreground">
            Plan dive parameters, decompression profile, and risk assessment
          </p>
        </div>
        <Select
          value={operationId}
          onValueChange={(value) => onOperationSelect(value)}
        >
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operations.map((op: any) => (
              <SelectItem key={op.id} value={op.id}>
                {op.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Waves className="w-5 h-5" />
            <span>Dive Parameters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxDepth">Max Depth (meters)</Label>
              <Input
                id="maxDepth"
                type="number"
                value={formData.maxDepth}
                onChange={(e) => setFormData({ ...formData, maxDepth: e.target.value })}
                placeholder="45"
              />
            </div>
            <div>
              <Label htmlFor="bottomTime">Bottom Time (minutes)</Label>
              <Input
                id="bottomTime"
                type="number"
                value={formData.bottomTime}
                onChange={(e) => setFormData({ ...formData, bottomTime: e.target.value })}
                placeholder="30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Decompression Profile</CardTitle>
          <CardDescription>JSON array of decompression stops: [&#123;"depth": 6, "time": 5&#125;, ...]</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.decompressionStops}
            onChange={(e) => setFormData({ ...formData, decompressionStops: e.target.value })}
            placeholder='[{"depth": 6, "time": 5}, {"depth": 3, "time": 10}]'
            rows={6}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gas Mixtures</CardTitle>
          <CardDescription>JSON array of gas mixtures: [&#123;"type": "Air", "percentage": 21&#125;, ...]</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.gasMixtures}
            onChange={(e) => setFormData({ ...formData, gasMixtures: e.target.value })}
            placeholder='[{"type": "Air", "percentage": 21}, {"type": "Nitrox", "percentage": 32}]'
            rows={4}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Equipment Checklist</span>
          </CardTitle>
          <CardDescription>JSON array of equipment: ["Diving Suit", "BCD", ...]</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.equipment}
            onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
            placeholder='["Diving Suit", "BCD", "Regulator", "Dive Computer"]'
            rows={4}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Risk Assessment</span>
          </CardTitle>
          <CardDescription>JSON object with risk assessment data (can include riskScore, hazards, mitigations, control measures)</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.riskAssessment}
            onChange={(e) => setFormData({ ...formData, riskAssessment: e.target.value })}
            placeholder={`{"hazards": ["Current", "Low visibility"], "mitigations": ["Use safety line", "Surface marker buoy"], "riskScore": 12, "controlMeasures": ["Safety line", "Surface marker"]}`}
            rows={6}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Moon className="w-5 h-5" />
            <span>Night Operations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isNightOps"
              checked={formData.isNightOps}
              onChange={(e) => setFormData({ ...formData, isNightOps: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="isNightOps" className="cursor-pointer">
              This is a night operation
            </Label>
          </div>
          {formData.isNightOps && (
            <div>
              <Label>Night Operations Considerations</Label>
              <Textarea
                value={formData.nightOpsConsiderations}
                onChange={(e) => setFormData({ ...formData, nightOpsConsiderations: e.target.value })}
                placeholder={`{"lighting": "Additional surface lighting required", "visibility": "Reduced visibility considerations", "safety": "Enhanced safety protocols", "communication": "Backup communication methods"}`}
                rows={6}
                className="font-mono text-sm mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                JSON object with night-specific considerations: lighting requirements, visibility factors, enhanced safety protocols, etc.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={mutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {mutation.isPending ? "Saving..." : "Save Dive Plan"}
        </Button>
      </div>
    </div>
  );
}

