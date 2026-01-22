/**
 * API client functions for Combined Services Group
 */

const API_BASE = "/api";

export interface SalvageWreck {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  hullType: "metal" | "fiberglass";
  status: "pending" | "in-progress" | "completed" | "on-hold";
  estimatedValue?: number;
  actualCost?: number;
  estimatedDuration?: number;
  startDate?: string;
  completionDate?: string;
  assignedCrewId?: string;
  equipmentRequired?: string[];
  notes?: string;
  photos?: string[];
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  onHold: number;
  totalEstimatedValue: number;
  totalActualCost: number;
  averageProgress: number;
}

export interface WreckProgress {
  wreckProgress: number;
  operationsProgress: number;
  totalOperations: number;
  completedOperations: number;
}

export interface SalvageOperation {
  id: string;
  wreckId: string;
  operationType: string;
  description: string;
  startTime: string;
  endTime?: string;
  crewMembers?: string[];
  equipmentUsed?: string[];
  weatherConditions?: any;
  progressPercentage: number;
  notes?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all salvage wrecks
 */
export async function getWrecks(filters?: {
  status?: string;
  hullType?: string;
}): Promise<SalvageWreck[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.hullType) params.append("hullType", filters.hullType);

  const response = await fetch(`${API_BASE}/salvage/wrecks?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch wrecks");
  }
  return response.json();
}

/**
 * Get a single wreck by ID
 */
export async function getWreck(id: string): Promise<SalvageWreck & { operations?: SalvageOperation[] }> {
  const response = await fetch(`${API_BASE}/salvage/wrecks/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch wreck");
  }
  return response.json();
}

/**
 * Create a new wreck
 */
export async function createWreck(data: {
  name: string;
  location: { lat: number; lng: number };
  hullType: "metal" | "fiberglass";
  status?: "pending" | "in-progress" | "completed" | "on-hold";
  estimatedValue?: number;
  actualCost?: number;
  estimatedDuration?: number;
  equipmentRequired?: string[];
  notes?: string;
  photos?: string[];
  progressPercentage?: number;
}): Promise<SalvageWreck> {
  const response = await fetch(`${API_BASE}/salvage/wrecks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create wreck");
  }

  return response.json();
}

/**
 * Update a wreck
 */
export async function updateWreck(
  id: string,
  data: Partial<SalvageWreck>
): Promise<SalvageWreck> {
  const response = await fetch(`${API_BASE}/salvage/wrecks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update wreck");
  }

  return response.json();
}

/**
 * Delete a wreck
 */
export async function deleteWreck(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/salvage/wrecks/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete wreck");
  }
}

/**
 * Get wreck progress
 */
export async function getWreckProgress(id: string): Promise<WreckProgress> {
  const response = await fetch(`${API_BASE}/salvage/wrecks/${id}/progress`);
  if (!response.ok) {
    throw new Error("Failed to fetch progress");
  }
  return response.json();
}

/**
 * Assign crew to wreck
 */
export async function assignCrewToWreck(
  id: string,
  crewMemberIds: string[]
): Promise<SalvageWreck> {
  const response = await fetch(`${API_BASE}/salvage/wrecks/${id}/assign-crew`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ crewMemberIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to assign crew");
  }

  return response.json();
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE}/salvage/stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch statistics");
  }
  return response.json();
}

/**
 * Create a salvage operation
 */
export async function createSalvageOperation(
  wreckId: string,
  data: {
    operationType: string;
    description: string;
    startTime: string;
    endTime?: string;
    crewMembers?: string[];
    equipmentUsed?: string[];
    weatherConditions?: any;
    progressPercentage?: number;
    notes?: string;
    photos?: string[];
  }
): Promise<SalvageOperation> {
  const response = await fetch(`${API_BASE}/salvage/wrecks/${wreckId}/operations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create operation");
  }

  return response.json();
}

/**
 * Get operations for a wreck
 */
export async function getWreckOperations(wreckId: string): Promise<SalvageOperation[]> {
  const response = await fetch(`${API_BASE}/salvage/wrecks/${wreckId}/operations`);
  if (!response.ok) {
    throw new Error("Failed to fetch operations");
  }
  return response.json();
}
