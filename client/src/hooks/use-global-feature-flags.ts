import { useQuery } from "@tanstack/react-query";

/**
 * Global feature flags response from API
 */
interface GlobalFeatureFlags {
  [featureId: string]: boolean;
}

/**
 * Hook to fetch and check global feature flags
 * These flags control platform-wide feature visibility (e.g., Enterprise features, Dive Connection Network)
 */
export function useGlobalFeatureFlags() {
  // Fetch global feature flags
  const { data: flags, isLoading, error } = useQuery<GlobalFeatureFlags>({
    queryKey: ["/api/global-features"],
    queryFn: async () => {
      const response = await fetch("/api/global-features");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch global feature flags");
      }
      const data = await response.json();
      return data || {};
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
    // Default to all features enabled if API fails (graceful degradation)
    placeholderData: {},
  });

  /**
   * Check if a specific feature is enabled globally
   */
  const isFeatureEnabled = (featureId: string): boolean => {
    if (isLoading || error) {
      // During loading or on error, default to false for safety (features disabled by default)
      return false;
    }
    // If flag exists, use it; otherwise default to false (disabled)
    return flags?.[featureId] ?? false;
  };

  /**
   * Check if multiple features are enabled
   */
  const areFeaturesEnabled = (featureIds: string[]): boolean => {
    return featureIds.every((id) => isFeatureEnabled(id));
  };

  /**
   * Check if any of the provided features are enabled
   */
  const isAnyFeatureEnabled = (featureIds: string[]): boolean => {
    return featureIds.some((id) => isFeatureEnabled(id));
  };

  return {
    flags: flags || {},
    isLoading,
    error,
    isFeatureEnabled,
    areFeaturesEnabled,
    isAnyFeatureEnabled,
  };
}
