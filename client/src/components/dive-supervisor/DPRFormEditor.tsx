/**
 * DPR Form Editor Component
 * 
 * Rich text editor for creating and editing Daily Project Reports
 * - Auto-save functionality
 * - Form fields for all DPR sections
 * - Export/import handlers
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Save,
  X,
  Calendar,
  Cloud,
  Waves,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface DPR {
  id: string;
  operationId: string;
  reportDate: string;
  reportData: any;
}

interface DPRFormEditorProps {
  dpr?: DPR | null;
  operationId?: string;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function DPRFormEditor({ dpr, operationId, onSave, onCancel }: DPRFormEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    reportDate: dpr?.reportDate ? format(new Date(dpr.reportDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    weather: dpr?.reportData?.weather || "",
    seaConditions: dpr?.reportData?.seaConditions || "",
    visibility: dpr?.reportData?.visibility || "",
    workCompleted: dpr?.reportData?.workCompleted || "",
    issues: dpr?.reportData?.issues || "",
    nextSteps: dpr?.reportData?.nextSteps || "",
    safetyNotes: dpr?.reportData?.safetyNotes || "",
    equipmentUsed: dpr?.reportData?.equipmentUsed || "",
    personnel: dpr?.reportData?.personnel || "",
    hoursWorked: dpr?.reportData?.hoursWorked || "",
  });

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!dpr) return; // Only auto-save for existing DPRs
    
    const interval = setInterval(() => {
      handleSave(true); // Silent save
    }, 30000);

    return () => clearInterval(interval);
  }, [dpr, formData]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = dpr 
        ? `/api/dive-supervisor/dprs/${dpr.id}`
        : '/api/dive-supervisor/dprs';
      const response = await fetch(url, {
        method: dpr ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          email,
          operationId: operationId || dpr?.operationId,
        }),
      });
      if (!response.ok) throw new Error('Failed to save DPR');
      return response.json();
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/dprs"] });
      if (!context?.silent) {
        toast({
          title: "Success",
          description: dpr ? "DPR updated" : "DPR created",
        });
        onSave(data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = (silent = false) => {
    mutation.mutate({
      reportDate: formData.reportDate,
      reportData: {
        weather: formData.weather,
        seaConditions: formData.seaConditions,
        visibility: formData.visibility,
        workCompleted: formData.workCompleted,
        issues: formData.issues,
        nextSteps: formData.nextSteps,
        safetyNotes: formData.safetyNotes,
        equipmentUsed: formData.equipmentUsed,
        personnel: formData.personnel,
        hoursWorked: formData.hoursWorked,
      },
    }, { context: { silent } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {dpr ? "Edit DPR" : "New Daily Project Report"}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={() => handleSave(false)} disabled={mutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {mutation.isPending ? "Saving..." : "Save DPR"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportDate">Report Date *</Label>
              <Input
                id="reportDate"
                type="date"
                value={formData.reportDate}
                onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="hoursWorked">Hours Worked</Label>
              <Input
                id="hoursWorked"
                type="number"
                value={formData.hoursWorked}
                onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                placeholder="8.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="w-5 h-5" />
            <span>Environmental Conditions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="weather">Weather</Label>
            <Textarea
              id="weather"
              value={formData.weather}
              onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
              placeholder="Clear, sunny, 15°C, light winds..."
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="seaConditions">Sea Conditions</Label>
            <Textarea
              id="seaConditions"
              value={formData.seaConditions}
              onChange={(e) => setFormData({ ...formData, seaConditions: e.target.value })}
              placeholder="Calm, slight swell, 1m waves..."
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <Input
              id="visibility"
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              placeholder="10m, good visibility..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Waves className="w-5 h-5" />
            <span>Work Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="workCompleted">Work Completed *</Label>
            <Textarea
              id="workCompleted"
              value={formData.workCompleted}
              onChange={(e) => setFormData({ ...formData, workCompleted: e.target.value })}
              placeholder="Describe the work completed during this shift..."
              rows={6}
              required
            />
          </div>
          <div>
            <Label htmlFor="equipmentUsed">Equipment Used</Label>
            <Textarea
              id="equipmentUsed"
              value={formData.equipmentUsed}
              onChange={(e) => setFormData({ ...formData, equipmentUsed: e.target.value })}
              placeholder="List all equipment used..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="personnel">Personnel</Label>
            <Textarea
              id="personnel"
              value={formData.personnel}
              onChange={(e) => setFormData({ ...formData, personnel: e.target.value })}
              placeholder="List personnel on shift..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Issues & Safety</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="issues">Issues Encountered</Label>
            <Textarea
              id="issues"
              value={formData.issues}
              onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
              placeholder="Any issues, delays, or problems encountered..."
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="safetyNotes">Safety Notes</Label>
            <Textarea
              id="safetyNotes"
              value={formData.safetyNotes}
              onChange={(e) => setFormData({ ...formData, safetyNotes: e.target.value })}
              placeholder="Safety observations, incidents, or concerns..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="nextSteps">Planned Next Steps</Label>
            <Textarea
              id="nextSteps"
              value={formData.nextSteps}
              onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
              placeholder="What is planned for the next shift/operation..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => handleSave(false)} disabled={mutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {mutation.isPending ? "Saving..." : "Save DPR"}
        </Button>
      </div>
    </div>
  );
}



