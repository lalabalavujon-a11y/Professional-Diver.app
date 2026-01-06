import { useQuery } from "@tanstack/react-query";

/**
 * User permissions response from API
 */
interface UserPermissions {
  [featureId: string]: boolean;
}

/**
 * Hook to fetch and check user feature permissions
 * Supports preview mode via query parameter
 */
export function useFeaturePermissions() {
  // Check for preview role in URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const previewRole = urlParams.get("previewRole");

  // Get current user email
  const getCurrentUserEmail = () => {
    return localStorage.getItem("userEmail") || "lalabalavu.jon@gmail.com";
  };

  // Fetch user permissions
  const { data: permissions, isLoading, error } = useQuery<UserPermissions>({
    queryKey: ["/api/users/current/permissions", previewRole],
    queryFn: async () => {
      const email = getCurrentUserEmail();
      const url = new URL("/api/users/current/permissions", window.location.origin);
      url.searchParams.set("email", email);
      if (previewRole) {
        url.searchParams.set("previewRole", previewRole);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch permissions");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  /**
   * Check if user has access to a specific feature
   */
  const hasFeature = (featureId: string): boolean => {
    if (isLoading || error) {
      return false;
    }
    return permissions?.[featureId] ?? false;
  };

  /**
   * Check if user has any of the provided features
   */
  const hasAnyFeature = (featureIds: string[]): boolean => {
    return featureIds.some((id) => hasFeature(id));
  };

  /**
   * Check if user has all of the provided features
   */
  const hasAllFeatures = (featureIds: string[]): boolean => {
    return featureIds.every((id) => hasFeature(id));
  };

  /**
   * Get all enabled features
   */
  const getEnabledFeatures = (): string[] => {
    if (!permissions) return [];
    return Object.entries(permissions)
      .filter(([_, enabled]) => enabled)
      .map(([featureId]) => featureId);
  };

  return {
    permissions,
    isLoading,
    error,
    hasFeature,
    hasAnyFeature,
    hasAllFeatures,
    getEnabledFeatures,
    isPreviewMode: !!previewRole,
    previewRole: previewRole || null,
  };
}

