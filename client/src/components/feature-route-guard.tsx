import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useGlobalFeatureFlags } from "@/hooks/use-global-feature-flags";
import ComingSoon from "@/pages/coming-soon";

interface FeatureRouteGuardProps {
  featureId: string;
  children: React.ReactNode;
  featureName?: string;
  featureDescription?: string;
  allowSuperAdmin?: boolean;
  requiredTier?: "DIVER" | "COMPANY" | "SERVICE_PROVIDER"; // Required subscription tier for Network access
}

interface User {
  id: string;
  subscriptionTier: "DIVER" | "COMPANY" | "SERVICE_PROVIDER" | null;
  networkAccessTier: "DIVER" | "COMPANY" | "SERVICE_PROVIDER" | null;
  role: string;
}

/**
 * Route guard component that checks if a feature is enabled globally and user has required tier.
 * If disabled or tier insufficient, shows Coming Soon page. SUPER_ADMIN can always access.
 */
export default function FeatureRouteGuard({
  featureId,
  children,
  featureName,
  featureDescription,
  allowSuperAdmin = true,
  requiredTier,
}: FeatureRouteGuardProps) {
  const [location, setLocation] = useLocation();
  const { isFeatureEnabled, isLoading: flagsLoading } = useGlobalFeatureFlags();
  
  // Get current user data to check subscription tier
  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com').toLowerCase().trim();
      const response = await fetch(`/api/users/current?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const userData = await response.json();
      return userData;
    }
  });
  
  // Check if user is SUPER_ADMIN (by checking localStorage email)
  const userEmail = localStorage.getItem("userEmail")?.toLowerCase().trim();
  const isSuperAdmin = allowSuperAdmin && (
    userEmail === "lalabalavu.jon@gmail.com" || 
    userEmail === "sephdee@hotmail.com"
  );

  // Show loading state briefly
  if (flagsLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  // SUPER_ADMIN can always access
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Check if feature is enabled globally
  const globallyEnabled = isFeatureEnabled(featureId);
  
  if (!globallyEnabled) {
    return (
      <ComingSoon 
        featureName={featureName}
        featureDescription={featureDescription}
      />
    );
  }

  // For Network features, check subscription tier
  if (featureId === "dive_connection_network" && requiredTier) {
    const userTier = currentUser?.networkAccessTier || currentUser?.subscriptionTier;
    
    if (!userTier) {
      return (
        <ComingSoon 
          featureName={featureName || "Dive Connection Network"}
          featureDescription={featureDescription || "This feature requires an active subscription"}
        />
      );
    }

    // Check if user has required tier or higher
    const tierHierarchy: Record<string, number> = {
      DIVER: 1,
      COMPANY: 2,
      SERVICE_PROVIDER: 3,
    };

    const userTierLevel = tierHierarchy[userTier] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier] || 0;

    if (userTierLevel < requiredTierLevel) {
      return (
        <ComingSoon 
          featureName={featureName || "Dive Connection Network"}
          featureDescription={featureDescription || `This feature requires ${requiredTier} tier subscription`}
        />
      );
    }
  }

  return <>{children}</>;
}
