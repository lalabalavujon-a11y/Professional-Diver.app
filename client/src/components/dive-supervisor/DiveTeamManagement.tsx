/**
 * Dive Team Management Component
 * 
 * Table format with pre-filled roles:
 * - Supervisor
 * - Diver
 * - Diver
 * - Diver
 * - Diver
 * 
 * Columns: Role, Name, Age, Phone, Email, Medical Runout Date, Certifications, Experience Yrs, Emergency Contact
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  name: string;
  role?: string;
  age?: number;
  experienceYears?: number;
  phone?: string;
  email?: string;
  certifications: Array<{ type: string; date: string; expiry?: string }>;
  medicalRunoutDates: Array<{ type: string; date: string }>;
  competencies: Array<{ skill: string; level: string; date: string }>;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notes?: string;
}

const DEFAULT_ROLES = ["SUPERVISOR", "DIVER", "DIVER", "DIVER", "DIVER"] as const;

const roleLabels: Record<string, string> = {
  SUPERVISOR: "Supervisor",
  DIVER: "Diver",
};

export default function DiveTeamManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: "",
    role: "DIVER",
    age: undefined,
    experienceYears: undefined,
    phone: "",
    email: "",
    certifications: [],
    medicalRunoutDates: [],
    competencies: [],
    emergencyContact: undefined,
    notes: "",
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/dive-supervisor/team-members"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/team-members?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch team members');
      return response.json();
    },
  });

  // Create table rows with default roles
  const tableRows = DEFAULT_ROLES.map((role, index) => {
    let member = null;
    
    if (role === "SUPERVISOR") {
      // Find the first supervisor
      member = teamMembers.find(m => m.role === "SUPERVISOR") || null;
    } else {
      // For divers, find by position (1st diver, 2nd diver, etc.)
      const divers = teamMembers.filter(m => m.role === "DIVER" || !m.role);
      const diverPosition = index - 1; // Subtract 1 because first row is supervisor
      member = divers[diverPosition] || null;
    }
    
    return { role, member, index };
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (member: Partial<TeamMember>) => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = editingMember 
        ? `/api/dive-supervisor/team-members/${editingMember.id}`
        : '/api/dive-supervisor/team-members';
      const response = await fetch(url, {
        method: editingMember ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...member, email }),
      });
      if (!response.ok) throw new Error('Failed to save team member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/team-members"] });
      setIsDialogOpen(false);
      setEditingMember(null);
      setEditingRowIndex(null);
      setFormData({
        name: "",
        role: "DIVER",
        age: undefined,
        experienceYears: undefined,
        phone: "",
        email: "",
        certifications: [],
        medicalRunoutDates: [],
        competencies: [],
        emergencyContact: undefined,
        notes: "",
      });
      toast({
        title: "Success",
        description: editingMember ? "Team member updated" : "Team member added",
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/dive-supervisor/team-members/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete team member');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/team-members"] });
      toast({
        title: "Success",
        description: "Team member deleted",
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

  const handleEdit = (member: TeamMember, rowIndex: number) => {
    setEditingMember(member);
    setEditingRowIndex(rowIndex);
    setFormData(member);
    setIsDialogOpen(true);
  };

  const handleAdd = (role: string, rowIndex: number) => {
    setEditingMember(null);
    setEditingRowIndex(rowIndex);
    setFormData({
      name: "",
      role: role,
      age: undefined,
      experienceYears: undefined,
      phone: "",
      email: "",
      certifications: [],
      medicalRunoutDates: [],
      competencies: [],
      emergencyContact: undefined,
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const getMedicalRunoutDate = (runoutDates: Array<{ type: string; date: string }>) => {
    if (!runoutDates || runoutDates.length === 0) return "N/A";
    // Get the earliest expiry date
    const dates = runoutDates.map(d => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime());
    return format(dates[0], "MMM dd, yyyy");
  };

  const getCertificationsSummary = (certs: Array<{ type: string; date: string; expiry?: string }>) => {
    if (!certs || certs.length === 0) return "None";
    return certs.map(c => c.type).join(", ");
  };

  const getMedicalAlertStatus = (runoutDates: Array<{ type: string; date: string }>) => {
    if (!runoutDates || runoutDates.length === 0) return { status: "none", color: "secondary" };
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    for (const item of runoutDates) {
      const expiryDate = new Date(item.date);
      if (expiryDate < now) {
        return { status: "expired", color: "destructive" };
      }
      if (expiryDate < thirtyDaysFromNow) {
        return { status: "expiring", color: "default" };
      }
    }
    return { status: "valid", color: "secondary" };
  };

  if (isLoading) {
    return <div>Loading team members...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dive Team Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage team members with pre-filled roles and comprehensive information
          </p>
        </div>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Dive Team Roster</span>
          </CardTitle>
          <CardDescription>
            Click on a row to add or edit team member information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Role</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[80px]">Age</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Medical Runout</TableHead>
                  <TableHead>Certifications</TableHead>
                  <TableHead className="w-[100px]">Experience (Yrs)</TableHead>
                  <TableHead>Emergency Contact</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row, index) => {
                  const medicalStatus = row.member ? getMedicalAlertStatus(row.member.medicalRunoutDates || []) : null;
                  return (
                    <TableRow 
                      key={index}
                      className={row.member ? "cursor-pointer hover:bg-muted/50" : "cursor-pointer hover:bg-muted/50"}
                      onClick={() => row.member ? handleEdit(row.member, index) : handleAdd(row.role, index)}
                    >
                      <TableCell>
                        <Badge variant="outline">{roleLabels[row.role] || row.role}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {row.member?.name || (
                          <span className="text-muted-foreground italic">Click to add</span>
                        )}
                      </TableCell>
                      <TableCell>{row.member?.age || "-"}</TableCell>
                      <TableCell>
                        {row.member?.phone ? (
                          <a href={`tel:${row.member.phone}`} className="text-blue-600 hover:underline flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{row.member.phone}</span>
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {row.member?.email ? (
                          <a href={`mailto:${row.member.email}`} className="text-blue-600 hover:underline flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{row.member.email}</span>
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {row.member && medicalStatus && (
                            <>
                              {medicalStatus.status === "expired" && (
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              )}
                              {medicalStatus.status === "expiring" && (
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              )}
                              {medicalStatus.status === "valid" && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                            </>
                          )}
                          <span className="text-sm">
                            {row.member ? getMedicalRunoutDate(row.member.medicalRunoutDates || []) : "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[200px] block">
                          {row.member ? getCertificationsSummary(row.member.certifications || []) : "-"}
                        </span>
                      </TableCell>
                      <TableCell>{row.member?.experienceYears || "-"}</TableCell>
                      <TableCell>
                        {row.member?.emergencyContact ? (
                          <div className="text-sm">
                            <div>{row.member.emergencyContact.name}</div>
                            <div className="text-muted-foreground">{row.member.emergencyContact.phone}</div>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {row.member && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(row.member!, index)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Delete ${row.member!.name}?`)) {
                                  deleteMutation.mutate(row.member!.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Edit Team Member" : `Add ${roleLabels[formData.role || "DIVER"]}`}
            </DialogTitle>
            <DialogDescription>
              Enter team member information, certifications, and competencies
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role || "DIVER"}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="DIVER">Diver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label htmlFor="experienceYears">Experience (Years)</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  value={formData.experienceYears || ""}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Emergency Contact</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Input
                  placeholder="Name"
                  value={formData.emergencyContact?.name || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, name: e.target.value } as any
                  })}
                />
                <Input
                  type="tel"
                  placeholder="Phone"
                  value={formData.emergencyContact?.phone || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, phone: e.target.value } as any
                  })}
                />
                <Input
                  placeholder="Relationship"
                  value={formData.emergencyContact?.relationship || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } as any
                  })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : editingMember ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
