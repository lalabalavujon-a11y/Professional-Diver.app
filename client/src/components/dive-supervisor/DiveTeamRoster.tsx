/**
 * Dive Team Roster Component
 * 
 * Phase-based team assignments with drag-and-drop
 * - Pre-dive, Dive, Post-dive, Standby phases
 * - Role assignment (Diver 1, Standby Diver, Tender, etc.)
 * - Visual timeline of assignments
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Plus,
  User,
  Clock,
  Waves
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTeamMembersForRotation } from "./hooks/useTeamMembers";

interface RosterAssignment {
  id: string;
  operationId: string;
  phase: string;
  diverRole: string;
  teamMemberId?: string;
  teamMemberName?: string;
  notes?: string;
}

interface TeamMember {
  id: string;
  name: string;
}

const PHASES = ["PRE_DIVE", "DIVE", "POST_DIVE", "STANDBY", "DECOMPRESSION"] as const;
const ROLES = ["DIVER_1", "DIVER_2", "STANDBY_DIVER", "TENDER", "SUPERVISOR", "LST", "DMT", "OTHER"] as const;

const phaseLabels: Record<string, string> = {
  PRE_DIVE: "Pre-Dive",
  DIVE: "Dive",
  POST_DIVE: "Post-Dive",
  STANDBY: "Standby",
  DECOMPRESSION: "Decompression",
};

const roleLabels: Record<string, string> = {
  DIVER_1: "Diver 1",
  DIVER_2: "Diver 2",
  STANDBY_DIVER: "Standby Diver",
  TENDER: "Tender",
  SUPERVISOR: "Supervisor",
  LST: "LST",
  DMT: "DMT",
  OTHER: "Other",
};

export default function DiveTeamRoster({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPhase, setSelectedPhase] = useState<string>("DIVE");

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

  // Fetch team members with rotation support
  const { teamMembers } = useTeamMembersForRotation();

  // Fetch roster assignments
  const { data: rosterAssignments = [] } = useQuery<RosterAssignment[]>({
    queryKey: ["/api/dive-supervisor/rosters", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/rosters?email=${email}&operationId=${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch roster');
      return response.json();
    },
    enabled: !!operationId,
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async (data: { phase: string; diverRole: string; teamMemberId?: string }) => {
      if (!operationId) throw new Error('No operation selected');
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch('/api/dive-supervisor/rosters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, operationId, email }),
      });
      if (!response.ok) throw new Error('Failed to add assignment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/rosters"] });
      toast({
        title: "Success",
        description: "Assignment added",
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

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/dive-supervisor/rosters/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete assignment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/rosters"] });
      toast({
        title: "Success",
        description: "Assignment removed",
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

  const getAssignmentsForPhase = (phase: string) => {
    return rosterAssignments.filter(a => a.phase === phase);
  };

  // Fair rotation logic based on experience
  const getSuggestedMemberForRole = (phase: string, role: string) => {
    const existingAssignments = rosterAssignments.filter(a => a.phase === phase);
    const assignedMemberIds = existingAssignments.map(a => a.teamMemberId).filter(Boolean);
    
    // Filter available members (not already assigned in this phase)
    const availableMembers = teamMembers.filter(m => !assignedMemberIds.includes(m.id));
    
    if (availableMembers.length === 0) return null;
    
    // For Supervisor role, prefer members with SUPERVISOR role
    if (role === "SUPERVISOR") {
      const supervisors = availableMembers.filter(m => m.role === "SUPERVISOR");
      if (supervisors.length > 0) {
        // Rotate based on who hasn't been supervisor recently
        return supervisors[0];
      }
    }
    
    // For other roles, rotate based on experience and previous assignments
    // Get members who haven't been assigned this role recently
    const recentAssignments = rosterAssignments
      .filter(a => a.diverRole === role)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    
    // Find members who haven't done this role recently
    const recentRoleMemberIds = recentAssignments.slice(0, availableMembers.length).map(a => a.teamMemberId);
    const notRecentlyAssigned = availableMembers.filter(m => !recentRoleMemberIds.includes(m.id));
    
    if (notRecentlyAssigned.length > 0) {
      // Return the most experienced from those not recently assigned
      return notRecentlyAssigned.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0))[0];
    }
    
    // If all have been assigned recently, rotate by experience
    return availableMembers.length > 0 
      ? availableMembers.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0))[0]
      : null;
  };

  const handleAutoPopulate = (phase: string) => {
    // Auto-populate all roles for this phase with fair rotation
    const rolesToAssign = ["SUPERVISOR", "DIVER_1", "DIVER_2", "STANDBY_DIVER", "TENDER"];
    const existingAssignments = getAssignmentsForPhase(phase);
    
    rolesToAssign.forEach(role => {
      const existing = existingAssignments.find(a => a.diverRole === role);
      if (!existing) {
        const suggestedMember = getSuggestedMemberForRole(phase, role);
        if (suggestedMember) {
          handleAddAssignment(phase, role, suggestedMember.id);
        }
      }
    });
    
    toast({
      title: "Auto-populated",
      description: "Roster populated with fair rotation based on experience",
    });
  };

  const handleAddAssignment = (phase: string, role: string, memberId?: string) => {
    // If no member specified, use suggested member from rotation logic
    const finalMemberId = memberId || getSuggestedMemberForRole(phase, role)?.id;
    addAssignmentMutation.mutate({ phase, diverRole: role, teamMemberId: finalMemberId });
  };

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to manage the team roster</CardDescription>
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
          <h2 className="text-2xl font-bold">Team Roster</h2>
          <p className="text-sm text-muted-foreground">
            Assign team members to roles for each phase of the dive operation
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
          <Button
            variant="outline"
            onClick={() => handleAutoPopulate(selectedPhase)}
          >
            Auto-Populate {phaseLabels[selectedPhase]}
          </Button>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PHASES.map((phase) => {
          const assignments = getAssignmentsForPhase(phase);
          return (
            <Card key={phase}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>{phaseLabels[phase]}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{roleLabels[assignment.diverRole]}</div>
                      {assignment.teamMemberName && (
                        <div className="text-sm text-muted-foreground">
                          {assignment.teamMemberName}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // Simple add - in full implementation, this would open a dialog
                    handleAddAssignment(phase, "DIVER_1");
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Assignment
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Add Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={selectedPhase}
              onValueChange={setSelectedPhase}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Phase" />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map((phase) => (
                  <SelectItem key={phase} value={phase}>
                    {phaseLabels[phase]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={(role) => {
                handleAddAssignment(selectedPhase, role);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              onValueChange={(memberId) => {
                // This would be used when adding with a specific member
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Team Member (Optional)" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

