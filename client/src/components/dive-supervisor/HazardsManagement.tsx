/**
 * Hazards Management Component
 * 
 * Hazard identification, tracking, and mitigation
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
  Edit,
  Trash2,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Hazard {
  id: string;
  operationId: string;
  hazardType: string;
  description: string;
  severity: string;
  likelihood: string;
  mitigation?: string;
  status: string;
}

const HAZARD_TYPES = ["ENVIRONMENTAL", "EQUIPMENT", "OPERATIONAL", "PERSONNEL", "STRUCTURAL", "OTHER"] as const;
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const LIKELIHOODS = ["RARE", "UNLIKELY", "POSSIBLE", "LIKELY", "ALMOST_CERTAIN"] as const;
const STATUSES = ["IDENTIFIED", "ASSESSED", "MITIGATED", "RESOLVED", "MONITORING"] as const;

const hazardTypeLabels: Record<string, string> = {
  ENVIRONMENTAL: "Environmental",
  EQUIPMENT: "Equipment",
  OPERATIONAL: "Operational",
  PERSONNEL: "Personnel",
  STRUCTURAL: "Structural",
  OTHER: "Other",
};

const severityColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export default function HazardsManagement({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHazard, setEditingHazard] = useState<Hazard | null>(null);
  const [formData, setFormData] = useState({
    hazardType: "ENVIRONMENTAL",
    description: "",
    severity: "MEDIUM",
    likelihood: "POSSIBLE",
    mitigation: "",
    status: "IDENTIFIED",
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

  // Fetch hazards
  const { data: hazards = [] } = useQuery<Hazard[]>({
    queryKey: ["/api/dive-supervisor/hazards", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/hazards?email=${email}&operationId=${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch hazards');
      return response.json();
    },
    enabled: !!operationId,
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<Hazard>) => {
      if (!operationId) throw new Error('No operation selected');
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = editingHazard 
        ? `/api/dive-supervisor/hazards/${editingHazard.id}`
        : '/api/dive-supervisor/hazards';
      const response = await fetch(url, {
        method: editingHazard ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, operationId, email }),
      });
      if (!response.ok) throw new Error('Failed to save hazard');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/hazards"] });
      setIsDialogOpen(false);
      setEditingHazard(null);
      setFormData({
        hazardType: "ENVIRONMENTAL",
        description: "",
        severity: "MEDIUM",
        likelihood: "POSSIBLE",
        mitigation: "",
        status: "IDENTIFIED",
      });
      toast({
        title: "Success",
        description: editingHazard ? "Hazard updated" : "Hazard recorded",
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
      const response = await fetch(`/api/dive-supervisor/hazards/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete hazard');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/hazards"] });
      toast({ title: "Success", description: "Hazard deleted" });
    },
  });

  const handleAdd = () => {
    setEditingHazard(null);
    setFormData({
      hazardType: "ENVIRONMENTAL",
      description: "",
      severity: "MEDIUM",
      likelihood: "POSSIBLE",
      mitigation: "",
      status: "IDENTIFIED",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (hazard: Hazard) => {
    setEditingHazard(hazard);
    setFormData({
      hazardType: hazard.hazardType,
      description: hazard.description,
      severity: hazard.severity,
      likelihood: hazard.likelihood,
      mitigation: hazard.mitigation || "",
      status: hazard.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const getRiskScore = (severity: string, likelihood: string): number => {
    const severityScores: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    const likelihoodScores: Record<string, number> = { RARE: 1, UNLIKELY: 2, POSSIBLE: 3, LIKELY: 4, ALMOST_CERTAIN: 5 };
    return (severityScores[severity] || 2) * (likelihoodScores[likelihood] || 3);
  };

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to manage hazards</CardDescription>
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
          <h2 className="text-2xl font-bold">Hazards Management</h2>
          <p className="text-sm text-muted-foreground">
            Identify, assess, and track operational hazards
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
                Add Hazard
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingHazard ? "Edit Hazard" : "Add Hazard"}</DialogTitle>
                <DialogDescription>Identify and assess operational hazards</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Hazard Type *</Label>
                  <Select
                    value={formData.hazardType}
                    onValueChange={(value) => setFormData({ ...formData, hazardType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HAZARD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {hazardTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the hazard..."
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Severity *</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) => setFormData({ ...formData, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITIES.map((sev) => (
                          <SelectItem key={sev} value={sev}>
                            {sev}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Likelihood *</Label>
                    <Select
                      value={formData.likelihood}
                      onValueChange={(value) => setFormData({ ...formData, likelihood: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIKELIHOODS.map((lik) => (
                          <SelectItem key={lik} value={lik}>
                            {lik}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Risk Score</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {getRiskScore(formData.severity, formData.likelihood)} / 20
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getRiskScore(formData.severity, formData.likelihood) >= 15 ? "Very High Risk" :
                       getRiskScore(formData.severity, formData.likelihood) >= 10 ? "High Risk" :
                       getRiskScore(formData.severity, formData.likelihood) >= 6 ? "Medium Risk" : "Low Risk"}
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="mitigation">Mitigation Measures</Label>
                  <Textarea
                    id="mitigation"
                    value={formData.mitigation}
                    onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
                    placeholder="Describe mitigation measures..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : editingHazard ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Hazards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hazards.map((hazard) => {
          const riskScore = getRiskScore(hazard.severity, hazard.likelihood);
          return (
            <Card key={hazard.id} className={riskScore >= 15 ? "border-red-500" : riskScore >= 10 ? "border-orange-500" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span>{hazardTypeLabels[hazard.hazardType]}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={severityColors[hazard.severity]}>
                        {hazard.severity}
                      </Badge>
                      <Badge variant="outline">
                        {hazard.likelihood}
                      </Badge>
                      <Badge variant="secondary">
                        Risk: {riskScore}/20
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(hazard)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this hazard?")) {
                          deleteMutation.mutate(hazard.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-semibold mb-1">Description</div>
                  <p className="text-sm">{hazard.description}</p>
                </div>
                {hazard.mitigation && (
                  <div>
                    <div className="text-sm font-semibold mb-1">Mitigation</div>
                    <p className="text-sm text-muted-foreground">{hazard.mitigation}</p>
                  </div>
                )}
                <div>
                  <Badge variant="outline">Status: {hazard.status}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hazards.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hazards identified yet. Add hazards to begin risk management.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


