/**
 * Shared hook for team member data synchronization
 * 
 * Provides team member data to all containers that need it
 */

import { useQuery } from "@tanstack/react-query";

export interface TeamMember {
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

export function useTeamMembers() {
  const { data: teamMembers = [], isLoading, error, refetch } = useQuery<TeamMember[]>({
    queryKey: ["/api/dive-supervisor/team-members"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/team-members?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch team members');
      return response.json();
    },
  });

  return {
    teamMembers,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Get team members formatted for dropdowns/selects
 */
export function useTeamMembersForSelect() {
  const { teamMembers, isLoading } = useTeamMembers();
  
  const options = teamMembers.map(member => ({
    value: member.id,
    label: `${member.name}${member.role ? ` (${member.role})` : ''}`,
    member,
  }));

  return {
    options,
    isLoading,
    teamMembers,
  };
}

/**
 * Get team members sorted by experience for fair rotation
 */
export function useTeamMembersForRotation() {
  const { teamMembers, isLoading } = useTeamMembers();
  
  // Sort by experience (descending), then by name
  const sorted = [...teamMembers].sort((a, b) => {
    const aExp = a.experienceYears || 0;
    const bExp = b.experienceYears || 0;
    if (aExp !== bExp) {
      return bExp - aExp; // Descending
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  return {
    teamMembers: sorted,
    isLoading,
  };
}



