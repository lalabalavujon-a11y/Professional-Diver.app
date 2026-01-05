/**
 * CasEvac Drills Component
 * 
 * Casualty evacuation drill documentation and compliance tracking
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertTriangle,
  Plus,
  Calendar,
  Users,
  FileText,
  Edit,
  Trash2,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface CasEvacDrill {
  id: string;
  operationId: string;
  drillDate: string;
  scenario: string;
  participants: Array<{ name: string; role: string }>;
  outcomes?: string;
  notes?: string;
}

export default function CasEvacDrills({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDrill, setEditingDrill] = useState<CasEvacDrill | null>(null);
  const [formData, setFormData] = useState({
    drillDate: format(new Date(), "yyyy-MM-dd"),
    scenario: "",
    participants: [] as Array<{ name: string; role: string }>,
    outcomes: "",
    notes: "",
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

  // Fetch drills
  const { data: drills = [] } = useQuery<CasEvacDrill[]>({
    queryKey: ["/api/dive-supervisor/cas-evac-drills", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/cas-evac-drills?email=${email}&operationId=${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch drills');
      return response.json();
    },
    enabled: !!operationId,
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<CasEvacDrill>) => {
      if (!operationId) throw new Error('No operation selected');
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = editingDrill 
        ? `/api/dive-supervisor/cas-evac-drills/${editingDrill.id}`
        : '/api/dive-supervisor/cas-evac-drills';
      const response = await fetch(url, {
        method: editingDrill ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, operationId, email }),
      });
      if (!response.ok) throw new Error('Failed to save drill');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/cas-evac-drills"] });
      setIsDialogOpen(false);
      setEditingDrill(null);
      setFormData({
        drillDate: format(new Date(), "yyyy-MM-dd"),
        scenario: "",
        participants: [],
        outcomes: "",
        notes: "",
      });
      toast({
        title: "Success",
        description: editingDrill ? "Drill updated" : "Drill recorded",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/dive-supervisor/cas-evac-drills/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete drill');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/cas-evac-drills"] });
      toast({ title: "Success", description: "Drill deleted" });
    },
  });

  const handleAdd = () => {
    setEditingDrill(null);
    setFormData({
      drillDate: format(new Date(), "yyyy-MM-dd"),
      scenario: "",
      participants: [],
      outcomes: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (drill: CasEvacDrill) => {
    setEditingDrill(drill);
    setFormData({
      drillDate: format(new Date(drill.drillDate), "yyyy-MM-dd"),
      scenario: drill.scenario,
      participants: drill.participants || [],
      outcomes: drill.outcomes || "",
      notes: drill.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      drillDate: formData.drillDate,
      scenario: formData.scenario,
      participants: formData.participants,
      outcomes: formData.outcomes,
      notes: formData.notes,
    });
  };

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to manage CasEvac drills</CardDescription>
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
          <h2 className="text-2xl font-bold">CasEvac Drills</h2>
          <p className="text-sm text-muted-foreground">
            Document and track casualty evacuation drills
          </p>
        </div>
        <div className="flex space-x-2">
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Record Drill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingDrill ? "Edit Drill" : "Record CasEvac Drill"}</DialogTitle>
                <DialogDescription>Document casualty evacuation drill details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="drillDate">Drill Date *</Label>
                  <Input
                    id="drillDate"
                    type="date"
                    value={formData.drillDate}
                    onChange={(e) => setFormData({ ...formData, drillDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="scenario">Scenario *</Label>
                  <Textarea
                    id="scenario"
                    value={formData.scenario}
                    onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                    placeholder="Describe the drill scenario..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label>Participants</Label>
                  <Textarea
                    value={JSON.stringify(formData.participants, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData({ ...formData, participants: parsed });
                      } catch {
                        // Invalid JSON, ignore
                      }
                    }}
                    placeholder='[{"name": "John Doe", "role": "Diver"}, ...]'
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JSON array of participants with name and role
                  </p>
                </div>
                <div>
                  <Label htmlFor="outcomes">Outcomes</Label>
                  <Textarea
                    id="outcomes"
                    value={formData.outcomes}
                    onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                    placeholder="Drill outcomes and observations..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : editingDrill ? "Update" : "Record"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Drills List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {drills.map((drill) => (
          <Card key={drill.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {format(new Date(drill.drillDate), "PPP")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {drill.scenario.substring(0, 100)}{drill.scenario.length > 100 ? "..." : ""}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(drill)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this drill record?")) {
                        deleteMutation.mutate(drill.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {drill.participants && drill.participants.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-1">Participants</div>
                  <div className="flex flex-wrap gap-1">
                    {drill.participants.map((p, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {p.name} ({p.role})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {drill.outcomes && (
                <div>
                  <div className="text-sm font-semibold mb-1">Outcomes</div>
                  <p className="text-sm text-muted-foreground">{drill.outcomes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {drills.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No drills recorded yet. Record your first CasEvac drill.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

