/**
 * RAMS (Risk Assessment and Method Statement) Component
 * 
 * - Link to Hazards & Risks container data
 * - Signature tracking for all team members
 * - PDF import/export functionality
 */

import { useState, useEffect } from "react";
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
  FileText,
  Plus,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Signature
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useTeamMembers } from "./hooks/useTeamMembers";

interface RamsDocument {
  id: string;
  operationId: string;
  title: string;
  documentData: any;
  linkedHazardIds: string[];
  signatures: Array<{
    teamMemberId: string;
    name: string;
    signature: string;
    date: string;
    status: "PENDING" | "SIGNED";
  }>;
  pdfData?: string;
}

interface Hazard {
  id: string;
  description: string;
  severity: string;
  likelihood: string;
  mitigation?: string;
}

export default function RAMS({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { teamMembers } = useTeamMembers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [editingRams, setEditingRams] = useState<RamsDocument | null>(null);
  const [signingForMember, setSigningForMember] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    documentData: {
      hazards: [] as any[],
      controlMeasures: [] as string[],
      methodStatement: "",
      emergencyProcedures: "",
    },
    linkedHazardIds: [] as string[],
  });
  const [signature, setSignature] = useState("");

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

  // Fetch RAMS documents
  const { data: ramsDocuments = [] } = useQuery<RamsDocument[]>({
    queryKey: ["/api/dive-supervisor/rams", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/rams?email=${email}&operationId=${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch RAMS documents');
      return response.json();
    },
    enabled: !!operationId,
  });

  // Fetch hazards for linking
  const { data: hazards = [] } = useQuery<Hazard[]>({
    queryKey: ["/api/dive-supervisor/hazards", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/hazards?email=${email}&operationId=${operationId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!operationId,
  });

  // Auto-populate signatures from team members when creating new RAMS
  useEffect(() => {
    if (!editingRams && teamMembers.length > 0 && isDialogOpen) {
      const newSignatures = teamMembers.map(member => ({
        teamMemberId: member.id,
        name: member.name,
        signature: "",
        date: "",
        status: "PENDING" as const,
      }));
      // This will be set when form is submitted
    }
  }, [teamMembers, isDialogOpen, editingRams]);

  const mutation = useMutation({
    mutationFn: async (data: Partial<RamsDocument>) => {
      if (!operationId) throw new Error('No operation selected');
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = editingRams 
        ? `/api/dive-supervisor/rams/${editingRams.id}`
        : '/api/dive-supervisor/rams';
      const response = await fetch(url, {
        method: editingRams ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, operationId, email }),
      });
      if (!response.ok) throw new Error('Failed to save RAMS document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/rams"] });
      setIsDialogOpen(false);
      setEditingRams(null);
      resetForm();
      toast({
        title: "Success",
        description: editingRams ? "RAMS document updated" : "RAMS document created",
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
      const response = await fetch(`/api/dive-supervisor/rams/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete RAMS document');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/rams"] });
      toast({ title: "Success", description: "RAMS document deleted" });
    },
  });

  const signatureMutation = useMutation({
    mutationFn: async ({ ramsId, teamMemberId, signature }: { ramsId: string; teamMemberId: string; signature: string }) => {
      const response = await fetch(`/api/dive-supervisor/rams/${ramsId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamMemberId, signature }),
      });
      if (!response.ok) throw new Error('Failed to sign RAMS document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/rams"] });
      setIsSignatureDialogOpen(false);
      setSigningForMember(null);
      setSignature("");
      toast({ title: "Success", description: "RAMS document signed" });
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/dive-supervisor/rams/${id}/export-pdf`);
      if (!response.ok) throw new Error('Failed to export PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RAMS-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "PDF exported successfully" });
    },
  });

  const handleImportPdf = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      // TODO: Parse PDF and extract data
      toast({
        title: "PDF Imported",
        description: "PDF imported. Please review and complete the form.",
      });
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      documentData: {
        hazards: [],
        controlMeasures: [],
        methodStatement: "",
        emergencyProcedures: "",
      },
      linkedHazardIds: [],
    });
  };

  const handleAdd = () => {
    setEditingRams(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (rams: RamsDocument) => {
    setEditingRams(rams);
    setFormData({
      title: rams.title,
      documentData: rams.documentData || {
        hazards: [],
        controlMeasures: [],
        methodStatement: "",
        emergencyProcedures: "",
      },
      linkedHazardIds: rams.linkedHazardIds || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Auto-populate signatures from team members
    const signatures = teamMembers.map(member => ({
      teamMemberId: member.id,
      name: member.name,
      signature: "",
      date: "",
      status: "PENDING" as const,
    }));
    mutation.mutate({
      title: formData.title,
      documentData: formData.documentData,
      linkedHazardIds: formData.linkedHazardIds,
      signatures,
    });
  };

  const handleSign = (ramsId: string, teamMemberId: string) => {
    setSigningForMember(teamMemberId);
    setIsSignatureDialogOpen(true);
  };

  const handleSignatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRams || !signingForMember || !signature.trim()) {
      toast({
        title: "Error",
        description: "Please enter a signature",
        variant: "destructive",
      });
      return;
    }
    signatureMutation.mutate({
      ramsId: editingRams.id,
      teamMemberId: signingForMember,
      signature: signature.trim(),
    });
  };

  // Link hazards to RAMS
  const linkedHazards = hazards.filter(h => formData.linkedHazardIds.includes(h.id));

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to manage RAMS documents</CardDescription>
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
          <h2 className="text-2xl font-bold">RAMS (Risk Assessment & Method Statement)</h2>
          <p className="text-sm text-muted-foreground">
            Create, manage, and track signatures for Risk Assessment and Method Statement documents
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
                Create RAMS
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRams ? "Edit RAMS Document" : "Create RAMS Document"}</DialogTitle>
                <DialogDescription>Risk Assessment and Method Statement</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Link Hazards</Label>
                  <Select
                    value=""
                    onValueChange={(hazardId) => {
                      if (!formData.linkedHazardIds.includes(hazardId)) {
                        setFormData({
                          ...formData,
                          linkedHazardIds: [...formData.linkedHazardIds, hazardId],
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hazard to link" />
                    </SelectTrigger>
                    <SelectContent>
                      {hazards
                        .filter(h => !formData.linkedHazardIds.includes(h.id))
                        .map((hazard) => (
                          <SelectItem key={hazard.id} value={hazard.id}>
                            {hazard.description.substring(0, 50)}...
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {linkedHazards.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {linkedHazards.map((hazard) => (
                        <Badge key={hazard.id} variant="outline" className="mr-2">
                          {hazard.description.substring(0, 30)}...
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                linkedHazardIds: formData.linkedHazardIds.filter(id => id !== hazard.id),
                              });
                            }}
                            className="ml-2 text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="methodStatement">Method Statement</Label>
                  <Textarea
                    id="methodStatement"
                    value={formData.documentData.methodStatement}
                    onChange={(e) => setFormData({
                      ...formData,
                      documentData: { ...formData.documentData, methodStatement: e.target.value }
                    })}
                    rows={6}
                    placeholder="Describe the method statement..."
                  />
                </div>
                <div>
                  <Label htmlFor="controlMeasures">Control Measures (one per line)</Label>
                  <Textarea
                    id="controlMeasures"
                    value={formData.documentData.controlMeasures.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      documentData: {
                        ...formData.documentData,
                        controlMeasures: e.target.value.split('\n').filter(l => l.trim())
                      }
                    })}
                    rows={4}
                    placeholder="Control measure 1&#10;Control measure 2&#10;..."
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyProcedures">Emergency Procedures</Label>
                  <Textarea
                    id="emergencyProcedures"
                    value={formData.documentData.emergencyProcedures}
                    onChange={(e) => setFormData({
                      ...formData,
                      documentData: { ...formData.documentData, emergencyProcedures: e.target.value }
                    })}
                    rows={4}
                    placeholder="Describe emergency procedures..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : editingRams ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* RAMS Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ramsDocuments.map((rams) => {
          const signedCount = rams.signatures?.filter(s => s.status === "SIGNED").length || 0;
          const totalCount = rams.signatures?.length || teamMembers.length;
          const allSigned = signedCount === totalCount && totalCount > 0;
          
          return (
            <Card key={rams.id} className={allSigned ? "border-green-500" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{rams.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={allSigned ? "default" : "secondary"}>
                        {signedCount}/{totalCount} Signed
                      </Badge>
                      {rams.linkedHazardIds && rams.linkedHazardIds.length > 0 && (
                        <Badge variant="outline">
                          {rams.linkedHazardIds.length} Hazards
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rams)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportPdfMutation.mutate(rams.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this RAMS document?")) {
                          deleteMutation.mutate(rams.id);
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
                  <div className="text-sm font-semibold mb-2">Signatures Required</div>
                  <div className="space-y-2">
                    {teamMembers.map((member) => {
                      const sig = rams.signatures?.find(s => s.teamMemberId === member.id);
                      return (
                        <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            {sig?.status === "SIGNED" ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm">{member.name}</span>
                          </div>
                          {sig?.status !== "SIGNED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRams(rams);
                                handleSign(rams.id, member.id);
                              }}
                            >
                              <Signature className="w-3 h-3 mr-1" />
                              Sign
                            </Button>
                          )}
                          {sig?.status === "SIGNED" && (
                            <div className="text-xs text-muted-foreground">
                              Signed {sig.date ? format(new Date(sig.date), "MMM dd, yyyy") : ""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {ramsDocuments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No RAMS documents yet. Create your first RAMS document.</p>
          </CardContent>
        </Card>
      )}

      {/* Signature Dialog */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign RAMS Document</DialogTitle>
            <DialogDescription>
              Enter your signature to confirm you have read, understood, and will comply with this RAMS document.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignatureSubmit} className="space-y-4">
            <div>
              <Label htmlFor="signature">Signature *</Label>
              <Input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsSignatureDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={signatureMutation.isPending}>
                {signatureMutation.isPending ? "Signing..." : "Sign"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

