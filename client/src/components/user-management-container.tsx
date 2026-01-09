import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Save, RefreshCw, Settings, Search, Shield, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

/**
 * Feature definition from API
 */
interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Role default permission
 */
interface RoleDefault {
  featureId: string;
  enabled: boolean;
}

/**
 * User with merged permissions
 */
interface UserWithPermissions {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
}

interface FeaturesResponse {
  features: Feature[];
}

interface RoleDefaultsResponse {
  role: string;
  defaults: RoleDefault[];
}

interface UserPermissionsResponse {
  users: UserWithPermissions[];
}

/**
 * User Management Container Component
 * Allows SUPER_ADMIN to manage feature permissions with:
 * - Role-based defaults (all users of a role get same base features)
 * - Individual user overrides (customize per user)
 */
export default function UserManagementContainer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("AFFILIATE");
  const [searchQuery, setSearchQuery] = useState("");
  const [localRoleDefaults, setLocalRoleDefaults] = useState<RoleDefault[] | null>(null);
  const [localUsers, setLocalUsers] = useState<UserWithPermissions[] | null>(null);
  const [hasRoleChanges, setHasRoleChanges] = useState(false);
  const [hasUserChanges, setHasUserChanges] = useState<Record<string, boolean>>({});
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ open: boolean; user: UserWithPermissions | null; newRole: string | null }>({ open: false, user: null, newRole: null });
  const [globalFlags, setGlobalFlags] = useState<Record<string, any>>({});
  const [hasGlobalChanges, setHasGlobalChanges] = useState(false);

  // Get current user email for API calls
  const getCurrentUserEmail = () => {
    return localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
  };

  // Fetch all available features
  const { data: featuresData } = useQuery<FeaturesResponse>({
    queryKey: ["/api/admin/features"],
    queryFn: async () => {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/features?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch features");
      }
      return response.json();
    },
  });

  // Fetch role defaults
  const { data: roleDefaultsData, isLoading: loadingRoleDefaults } = useQuery<RoleDefaultsResponse>({
    queryKey: ["/api/admin/role-defaults", selectedRole],
    queryFn: async () => {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/role-defaults?email=${encodeURIComponent(email)}&role=${selectedRole}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch role defaults");
      }
      return response.json();
    },
    enabled: !!selectedRole,
  });

  useEffect(() => {
    if (roleDefaultsData?.defaults) {
      setLocalRoleDefaults(roleDefaultsData.defaults);
      setHasRoleChanges(false);
    }
  }, [roleDefaultsData]);

  // Fetch user permissions (with option to include all users for role management)
  const { data: usersData, isLoading: loadingUsers, error: usersError } = useQuery<UserPermissionsResponse>({
    queryKey: ["/api/admin/user-permissions"],
    queryFn: async () => {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/user-permissions?email=${encodeURIComponent(email)}&includeAllUsers=true`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch user permissions");
      }
      const data = await response.json();
      console.log("Fetched users from API:", data.users); // Debug log
      return data;
    },
    retry: 1,
  });

  useEffect(() => {
    if (usersData?.users) {
      console.log("Users loaded successfully:", usersData.users); // Debug log
      setLocalUsers(usersData.users);
      setHasUserChanges({});
    }
  }, [usersData]);

  // Fetch global feature flags
  const { data: globalFeaturesData, isLoading: loadingGlobalFeatures } = useQuery<{ flags: any[] }>({
    queryKey: ["/api/admin/global-features"],
    queryFn: async () => {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/global-features?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch global features");
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (globalFeaturesData?.flags) {
      const flagsMap: Record<string, any> = {};
      globalFeaturesData.flags.forEach((flag: any) => {
        flagsMap[flag.featureId] = flag;
      });
      setGlobalFlags(flagsMap);
      setHasGlobalChanges(false);
    }
  }, [globalFeaturesData]);

  // Save role defaults mutation
  const saveRoleDefaultsMutation = useMutation({
    mutationFn: async (defaults: RoleDefault[]) => {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/role-defaults?email=${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, defaults }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save role defaults");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/role-defaults", selectedRole] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-permissions"] });
      setHasRoleChanges(false);
      toast({
        title: "Success",
        description: "Role defaults saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Save user override mutation
  const saveUserOverrideMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: Record<string, boolean> }) => {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/user-permissions/${userId}?email=${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save user permissions");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-permissions"] });
      setHasUserChanges({});
      toast({
        title: "Success",
        description: "User permissions saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reset user to role defaults mutation
  const resetUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/user-permissions/${userId}/reset?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to reset user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-permissions"] });
      toast({
        title: "Success",
        description: "User reset to role defaults",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to reset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/users/${userId}/role?email=${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update user role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-permissions"] });
      setRoleChangeDialog({ open: false, user: null, newRole: null });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update role: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update global feature flag mutation
  const updateGlobalFeatureMutation = useMutation({
    mutationFn: async ({ featureId, enabled }: { featureId: string; enabled: boolean }) => {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/global-features/${featureId}?email=${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update global feature");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/current/permissions"] });
      setHasGlobalChanges(false);
      toast({
        title: "Success",
        description: "Global feature flag updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Bulk update global features mutation
  const bulkUpdateGlobalFeaturesMutation = useMutation({
    mutationFn: async (flags: { featureId: string; enabled: boolean }[]) => {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/global-features?email=${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flags, updatedBy: email }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update global features");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-features"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/current/permissions"] });
      setHasGlobalChanges(false);
      toast({
        title: "Success",
        description: "Global features updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle role default toggle
  const handleRoleDefaultToggle = (featureId: string, enabled: boolean) => {
    if (!localRoleDefaults) return;

    const updated = localRoleDefaults.map((d) =>
      d.featureId === featureId ? { ...d, enabled } : d
    );

    setLocalRoleDefaults(updated);
    setHasRoleChanges(true);
  };

  // Handle user override toggle
  const handleUserToggle = (userId: string, featureId: string, enabled: boolean) => {
    if (!localUsers) return;

    const updated = localUsers.map((user) =>
      user.id === userId
        ? {
            ...user,
            permissions: {
              ...user.permissions,
              [featureId]: enabled,
            },
          }
        : user
    );

    setLocalUsers(updated);
    setHasUserChanges({ ...hasUserChanges, [userId]: true });
  };

  // Handle save role defaults
  const handleSaveRoleDefaults = () => {
    if (localRoleDefaults) {
      saveRoleDefaultsMutation.mutate(localRoleDefaults);
    }
  };

  // Handle save user override
  const handleSaveUserOverride = (userId: string) => {
    const user = localUsers?.find((u) => u.id === userId);
    if (user) {
      saveUserOverrideMutation.mutate({ userId, permissions: user.permissions });
    }
  };

  // Handle reset role defaults
  const handleResetRoleDefaults = () => {
    if (roleDefaultsData?.defaults) {
      setLocalRoleDefaults(roleDefaultsData.defaults);
      setHasRoleChanges(false);
    }
  };

  // Handle reset user
  const handleResetUser = (userId: string) => {
    resetUserMutation.mutate(userId);
  };

  // Handle role change
  const handleRoleChange = (user: UserWithPermissions, newRole: string) => {
    setRoleChangeDialog({ open: true, user, newRole });
  };

  // Confirm role change
  const handleConfirmRoleChange = () => {
    if (roleChangeDialog.user && roleChangeDialog.newRole) {
      updateUserRoleMutation.mutate({
        userId: roleChangeDialog.user.id,
        role: roleChangeDialog.newRole,
      });
    }
  };

  // Handle global feature toggle
  const handleGlobalFeatureToggle = (featureId: string, enabled: boolean) => {
    const updated = { ...globalFlags };
    if (updated[featureId]) {
      updated[featureId] = { ...updated[featureId], enabled };
    }
    setGlobalFlags(updated);
    setHasGlobalChanges(true);
  };

  // Handle bulk global feature update
  const handleBulkGlobalUpdate = (enabled: boolean, category?: string) => {
    if (!globalFeaturesData?.flags) return;

    const flagsToUpdate = category
      ? globalFeaturesData.flags.filter((f: any) => f.category === category)
      : globalFeaturesData.flags;

    const updates = flagsToUpdate.map((flag: any) => ({
      featureId: flag.featureId,
      enabled,
    }));

    bulkUpdateGlobalFeaturesMutation.mutate(updates);
  };

  // Save global feature changes
  const handleSaveGlobalFeatures = () => {
    if (!globalFeaturesData?.flags) return;

    const updates = Object.values(globalFlags)
      .filter((flag: any) => flag.enabled !== undefined)
      .map((flag: any) => ({
        featureId: flag.featureId,
        enabled: flag.enabled,
      }));

    if (updates.length > 0) {
      bulkUpdateGlobalFeaturesMutation.mutate(updates);
    }
  };

  const features = featuresData?.features || [];
  const roleDefaults = localRoleDefaults || (roleDefaultsData?.defaults ?? []);
  const users = localUsers || (usersData?.users ?? []);

  // Group features by category
  const featuresByCategory = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  // Filter features by search query
  const filteredFeaturesByCategory = Object.entries(featuresByCategory).reduce((acc, [category, categoryFeatures]) => {
    const filtered = categoryFeatures.filter((feature) =>
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Feature[]>);

  // Filter users by search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      AFFILIATE: "Partner Admin",
      ENTERPRISE: "Enterprise User",
      USER: "User",
      ADMIN: "Admin",
    };
    return roleMap[role] || role;
  };

  // Convert display role name to enum value
  const getRoleEnumFromDisplay = (displayRole: string): string => {
    const roleMap: Record<string, string> = {
      "Partner Admin": "AFFILIATE",
      "Enterprise User": "ENTERPRISE",
      "User": "USER",
      "Admin": "ADMIN",
      "Super Admin": "SUPER_ADMIN",
      "Lifetime": "LIFETIME",
    };
    return roleMap[displayRole] || displayRole;
  };

  // Get role defaults for a specific role
  const [userRoleDefaultsCache, setUserRoleDefaultsCache] = useState<Record<string, RoleDefault[]>>({});

  // Fetch role defaults for a user's role
  const fetchRoleDefaultsForUser = async (userRole: string) => {
    const roleEnum = getRoleEnumFromDisplay(userRole);
    if (userRoleDefaultsCache[roleEnum]) {
      return userRoleDefaultsCache[roleEnum];
    }

    try {
      const email = getCurrentUserEmail();
      const response = await fetch(`/api/admin/role-defaults?email=${encodeURIComponent(email)}&role=${roleEnum}`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      const defaults = data.defaults || [];
      setUserRoleDefaultsCache(prev => ({ ...prev, [roleEnum]: defaults }));
      return defaults;
    } catch (error) {
      console.error("Error fetching role defaults:", error);
      return [];
    }
  };

  // Pre-fetch role defaults for all unique user roles when users are loaded
  useEffect(() => {
    if (users && users.length > 0) {
      const uniqueRoles = Array.from(new Set(users.map(u => u.role)));
      uniqueRoles.forEach(role => {
        const roleEnum = getRoleEnumFromDisplay(role);
        
        // Only fetch if not already cached
        if (!userRoleDefaultsCache[roleEnum]) {
          const email = getCurrentUserEmail();
          fetch(`/api/admin/role-defaults?email=${encodeURIComponent(email)}&role=${roleEnum}`)
            .then(response => {
              if (response.ok) {
                return response.json();
              }
              return { defaults: [] };
            })
            .then(data => {
              const defaults = data.defaults || [];
              setUserRoleDefaultsCache(prev => {
                // Only update if still not cached (avoid race conditions)
                if (!prev[roleEnum]) {
                  return { ...prev, [roleEnum]: defaults };
                }
                return prev;
              });
            })
            .catch(error => {
              console.error(`Error fetching role defaults for ${roleEnum}:`, error);
            });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  // Check if user has override for a feature (different from role default)
  const hasOverride = (user: UserWithPermissions, featureId: string, userRoleDefaults: RoleDefault[]): boolean => {
    const roleDefault = userRoleDefaults.find((d) => d.featureId === featureId);
    const userPerm = user.permissions[featureId];
    return roleDefault ? userPerm !== roleDefault.enabled : false;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Access Control
            </CardTitle>
            <CardDescription>
              Manage feature permissions with role defaults and individual user overrides (Super Admin only)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="role-defaults" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="role-defaults">
              <Settings className="w-4 h-4 mr-2" />
              Role Defaults
            </TabsTrigger>
            <TabsTrigger value="user-overrides">
              <Users className="w-4 h-4 mr-2" />
              User Overrides
            </TabsTrigger>
            <TabsTrigger value="role-management">
              <Shield className="w-4 h-4 mr-2" />
              Role Management
            </TabsTrigger>
            <TabsTrigger value="global-features">
              <Globe className="w-4 h-4 mr-2" />
              Global Features
            </TabsTrigger>
          </TabsList>

          {/* Role Defaults Tab */}
          <TabsContent value="role-defaults" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Select Role
                  </label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AFFILIATE">Partner Admin</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise User</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Search Features
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search features..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {loadingRoleDefaults ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
                  <span className="ml-2 text-slate-600">Loading role defaults...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {Object.entries(filteredFeaturesByCategory).map(([category, categoryFeatures]) => (
                      <div key={category} className="border rounded-lg p-6 bg-slate-50">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900">{category}</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!localRoleDefaults) return;
                                const updated = localRoleDefaults.map((d) => {
                                  const feature = categoryFeatures.find((f) => f.id === d.featureId);
                                  return feature ? { ...d, enabled: true } : d;
                                });
                                setLocalRoleDefaults(updated);
                                setHasRoleChanges(true);
                              }}
                            >
                              Enable All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!localRoleDefaults) return;
                                const updated = localRoleDefaults.map((d) => {
                                  const feature = categoryFeatures.find((f) => f.id === d.featureId);
                                  return feature ? { ...d, enabled: false } : d;
                                });
                                setLocalRoleDefaults(updated);
                                setHasRoleChanges(true);
                              }}
                            >
                              Disable All
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryFeatures.map((feature) => {
                            const defaultPerm = roleDefaults.find((d) => d.featureId === feature.id);
                            const isEnabled = defaultPerm?.enabled ?? false;
                            return (
                              <div
                                key={feature.id}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-primary-300 transition-colors"
                              >
                                <div className="flex-1 mr-3">
                                  <label
                                    htmlFor={`role-${feature.id}`}
                                    className="text-sm font-medium text-slate-900 cursor-pointer block"
                                  >
                                    {feature.name}
                                  </label>
                                  <p className="text-xs text-slate-600 mt-1">{feature.description}</p>
                                </div>
                                <Switch
                                  id={`role-${feature.id}`}
                                  checked={isEnabled}
                                  onCheckedChange={(checked) =>
                                    handleRoleDefaultToggle(feature.id, checked)
                                  }
                                  disabled={saveRoleDefaultsMutation.isPending}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {hasRoleChanges && (
                    <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        You have unsaved changes to role defaults.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleResetRoleDefaults}
                          disabled={saveRoleDefaultsMutation.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                        <Button
                          onClick={handleSaveRoleDefaults}
                          disabled={saveRoleDefaultsMutation.isPending}
                          className="bg-primary-500 hover:bg-primary-600"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saveRoleDefaultsMutation.isPending ? "Saving..." : "Save Role Defaults"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* User Overrides Tab */}
          <TabsContent value="user-overrides" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Search Users
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
                  <span className="ml-2 text-slate-600">Loading users...</span>
                </div>
              ) : usersError ? (
                <div className="text-center py-8 text-red-600">
                  Error Loading Feature Permission: {usersError instanceof Error ? usersError.message : "Unknown error"}
                  <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/user-permissions"] })}
                    className="mt-4"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No users found. Partner Admins and Enterprise Users will appear here.
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredUsers.map((user) => {
                    // Get role defaults for this user's actual role
                    const userRoleEnum = getRoleEnumFromDisplay(user.role);
                    const userRoleDefaults = userRoleDefaultsCache[userRoleEnum] || [];

                    return (
                      <div
                        key={user.id}
                        className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900">{user.name || 'Unknown User'}</h3>
                            <p className="text-sm text-slate-600 mt-1">{user.email}</p>
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                              {user.role}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetUser(user.id)}
                              disabled={resetUserMutation.isPending}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reset to Role Default
                            </Button>
                            {hasUserChanges[user.id] && (
                              <Button
                                size="sm"
                                onClick={() => handleSaveUserOverride(user.id)}
                                disabled={saveUserOverrideMutation.isPending}
                                className="bg-primary-500 hover:bg-primary-600"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {Object.entries(filteredFeaturesByCategory).map(([category, categoryFeatures]) => (
                            <div key={category} className="border-l-2 border-primary-200 pl-4">
                              <h4 className="text-sm font-semibold text-slate-700 mb-3">{category}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categoryFeatures.map((feature) => {
                                  const isEnabled = user.permissions[feature.id] ?? false;
                                  const isOverridden = hasOverride(user, feature.id, userRoleDefaults);
                                  return (
                                    <div
                                      key={feature.id}
                                      className={`flex items-center justify-between p-3 rounded-lg border ${
                                        isOverridden
                                          ? "bg-yellow-50 border-yellow-200"
                                          : "bg-slate-50 border-slate-200"
                                      }`}
                                    >
                                      <div className="flex-1 mr-3">
                                        <div className="flex items-center gap-2">
                                          <label
                                            htmlFor={`${user.id}-${feature.id}`}
                                            className="text-sm font-medium text-slate-900 cursor-pointer"
                                          >
                                            {feature.name}
                                          </label>
                                          {isOverridden && (
                                            <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                              Override
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">{feature.description}</p>
                                      </div>
                                      <Switch
                                        id={`${user.id}-${feature.id}`}
                                        checked={isEnabled}
                                        onCheckedChange={(checked) =>
                                          handleUserToggle(user.id, feature.id, checked)
                                        }
                                        disabled={saveUserOverrideMutation.isPending || resetUserMutation.isPending}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Role Management Tab */}
          <TabsContent value="role-management" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Search Users
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Filter by Role
                  </label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                      <SelectItem value="AFFILIATE">Partner Admin</SelectItem>
                      <SelectItem value="LIFETIME">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
                  <span className="ml-2 text-slate-600">Loading users...</span>
                </div>
              ) : usersError ? (
                <div className="text-center py-8 text-red-600">
                  Error loading users: {usersError instanceof Error ? usersError.message : "Unknown error"}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No users found.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((user) => {
                    const roleOptions = [
                      { value: "USER", label: "User" },
                      { value: "ENTERPRISE", label: "Enterprise" },
                      { value: "AFFILIATE", label: "Partner Admin" },
                      { value: "LIFETIME", label: "Lifetime" },
                    ];

                    return (
                      <div
                        key={user.id}
                        className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900">{user.name || 'Unknown User'}</h3>
                            <p className="text-sm text-slate-600 mt-1">{user.email}</p>
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                              Current: {user.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Select
                              value={getRoleEnumFromDisplay(user.role)}
                              onValueChange={(newRole) => handleRoleChange(user, newRole)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Global Features Tab */}
          <TabsContent value="global-features" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Search Features
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search features..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkGlobalUpdate(true)}
                    disabled={bulkUpdateGlobalFeaturesMutation.isPending}
                  >
                    Enable All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkGlobalUpdate(false)}
                    disabled={bulkUpdateGlobalFeaturesMutation.isPending}
                  >
                    Disable All
                  </Button>
                </div>
              </div>

              {loadingGlobalFeatures ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
                  <span className="ml-2 text-slate-600">Loading global features...</span>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {Object.entries(filteredFeaturesByCategory).map(([category, categoryFeatures]) => (
                      <div key={category} className="border rounded-lg p-6 bg-slate-50">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900">{category}</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBulkGlobalUpdate(true, category)}
                              disabled={bulkUpdateGlobalFeaturesMutation.isPending}
                            >
                              Enable Category
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBulkGlobalUpdate(false, category)}
                              disabled={bulkUpdateGlobalFeaturesMutation.isPending}
                            >
                              Disable Category
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {categoryFeatures.map((feature) => {
                            const flag = globalFlags[feature.id];
                            const isEnabled = flag?.enabled ?? true;
                            const updatedAt = flag?.updatedAt;
                            const updatedBy = flag?.updatedBy;

                            return (
                              <div
                                key={feature.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  isEnabled
                                    ? "bg-white border-green-200"
                                    : "bg-red-50 border-red-200"
                                }`}
                              >
                                <div className="flex-1 mr-3">
                                  <div className="flex items-center gap-2">
                                    <label
                                      htmlFor={`global-${feature.id}`}
                                      className="text-sm font-medium text-slate-900 cursor-pointer"
                                    >
                                      {feature.name}
                                    </label>
                                    {!isEnabled && (
                                      <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                                        Disabled
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1">{feature.description}</p>
                                  {updatedAt && (
                                    <p className="text-xs text-slate-500 mt-1">
                                      Updated: {new Date(updatedAt).toLocaleDateString()}
                                      {updatedBy && ` by ${updatedBy}`}
                                    </p>
                                  )}
                                </div>
                                <Switch
                                  id={`global-${feature.id}`}
                                  checked={isEnabled}
                                  onCheckedChange={(checked) => {
                                    handleGlobalFeatureToggle(feature.id, checked);
                                    updateGlobalFeatureMutation.mutate({ featureId: feature.id, enabled: checked });
                                  }}
                                  disabled={updateGlobalFeatureMutation.isPending}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {hasGlobalChanges && (
                    <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        You have unsaved changes to global features.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (globalFeaturesData) {
                              const flagsMap: Record<string, any> = {};
                              globalFeaturesData.flags.forEach((flag: any) => {
                                flagsMap[flag.featureId] = flag;
                              });
                              setGlobalFlags(flagsMap);
                              setHasGlobalChanges(false);
                            }
                          }}
                          disabled={bulkUpdateGlobalFeaturesMutation.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                        <Button
                          onClick={handleSaveGlobalFeatures}
                          disabled={bulkUpdateGlobalFeaturesMutation.isPending}
                          className="bg-primary-500 hover:bg-primary-600"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {bulkUpdateGlobalFeaturesMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Role Change Confirmation Dialog */}
        <Dialog open={roleChangeDialog.open} onOpenChange={(open) => setRoleChangeDialog({ open, user: null, newRole: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Role Change</DialogTitle>
              <DialogDescription>
                Are you sure you want to change {roleChangeDialog.user?.name}'s role from{" "}
                <strong>{roleChangeDialog.user?.role}</strong> to{" "}
                <strong>
                  {roleChangeDialog.newRole === "USER" ? "User" :
                   roleChangeDialog.newRole === "ENTERPRISE" ? "Enterprise" :
                   roleChangeDialog.newRole === "AFFILIATE" ? "Partner Admin" :
                   roleChangeDialog.newRole === "LIFETIME" ? "Lifetime" : roleChangeDialog.newRole}
                </strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRoleChangeDialog({ open: false, user: null, newRole: null })}
                disabled={updateUserRoleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRoleChange}
                disabled={updateUserRoleMutation.isPending}
                className="bg-primary-500 hover:bg-primary-600"
              >
                {updateUserRoleMutation.isPending ? "Updating..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
