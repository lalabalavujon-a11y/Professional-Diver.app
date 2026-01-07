import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "lucide-react";

interface MaintenanceTaskFormProps {
  taskId: string;
  onComplete?: () => void;
}

export default function MaintenanceTaskForm({ taskId, onComplete }: MaintenanceTaskFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checklistResults, setChecklistResults] = useState("");
  const [notes, setNotes] = useState("");
  const [partsReplaced, setPartsReplaced] = useState("");
  const [performedBy, setPerformedBy] = useState("");

  const { data: task } = useQuery<any>({
    queryKey: ["/api/equipment/tasks", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/equipment/tasks?status=SCHEDULED,IN_PROGRESS`);
      if (!res.ok) throw new Error("Failed to fetch task");
      const tasks = await res.json();
      return tasks.find((t: any) => t.id === taskId);
    },
    enabled: !!taskId,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/equipment/tasks/${taskId}/complete`,
        {
          checklistResults: checklistResults || undefined,
          notes: notes || undefined,
          partsReplaced: partsReplaced || undefined,
          performedBy: performedBy || "system",
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/items"] });
      toast({
        title: "Success",
        description: "Maintenance task completed successfully",
      });
      onComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete maintenance task",
        variant: "destructive",
      });
    },
  });

  if (!task) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task not found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>Complete Maintenance Task</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {task.equipmentItem && (
            <div>
              <Label>Equipment</Label>
              <p className="text-lg font-medium">{task.equipmentItem.name}</p>
              {task.equipmentItem.serialNumber && (
                <p className="text-sm text-slate-600">SN: {task.equipmentItem.serialNumber}</p>
              )}
            </div>
          )}

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
            <Label htmlFor="checklistResults">Checklist Results</Label>
            <Textarea
              id="checklistResults"
              value={checklistResults}
              onChange={(e) => setChecklistResults(e.target.value)}
              placeholder="Enter checklist results (JSON format or plain text)"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="partsReplaced">Parts Replaced</Label>
            <Textarea
              id="partsReplaced"
              value={partsReplaced}
              onChange={(e) => setPartsReplaced(e.target.value)}
              placeholder="List any parts that were replaced (JSON format or plain text)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the maintenance"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => completeTaskMutation.mutate()}
              disabled={!performedBy || completeTaskMutation.isPending}
              className="flex-1"
            >
              {completeTaskMutation.isPending ? "Completing..." : "Complete Maintenance"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



