import { useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { notifyUnitsPreferenceChange } from "@/hooks/use-units-preference";
import { 
  User, 
  Upload, 
  Camera, 
  Save, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  CreditCard,
  Key,
  Trash2,
  Download,
  Lock,
  Smartphone,
  Clock,
  Cloud,
  Waves,
  Moon,
  Calendar,
  Ruler,
  Phone,
  Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserStatusBadge from "@/components/user-status-badge";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { z } from "zod";
import { timezones } from "@/utils/timezones";
import { fetchPorts, combineLocations, timezonesToLocations, getLocationDetails, type PortLocation } from "@/utils/locations";
import LocationSelector from "@/components/widgets/location-selector";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  location: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;


// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export default function ProfileSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [twoFactorToken, setTwoFactorToken] = useState<string>("");
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);
  
  // Fetch ports for location selector
  const { data: ports = [] } = useQuery({
    queryKey: ['ports'],
    queryFn: fetchPorts,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  // Combine cities and ports into unified location options
  const cities = timezonesToLocations(timezones);
  const locations = combineLocations(cities, ports);

  // Display preferences state - load from localStorage or use defaults
  // Support both timezone (legacy) and location (new unified format)
  const [location, setLocation] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        // Support legacy timezone format
        if (prefs.location) return prefs.location;
        if (prefs.timezone) return prefs.timezone;
      }
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });

  // Derive timezone from location (for backward compatibility)
  const timezone = location.startsWith('port:') 
    ? (ports.find(p => p.value === location)?.timezone || 'UTC')
    : location;
  const [clockType, setClockType] = useState<'digital' | 'analog'>(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.clockType) return prefs.clockType;
      }
    } catch {}
    return 'digital';
  });
  const [enableWeather, setEnableWeather] = useState(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        return prefs.enableWeather || false;
      }
    } catch {}
    return false;
  });
  const [enableTides, setEnableTides] = useState(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        return prefs.enableTides || false;
      }
    } catch {}
    return false;
  });
  const [enableMoonPhase, setEnableMoonPhase] = useState(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        return prefs.enableMoonPhase || false;
      }
    } catch {}
    return false;
  });
  const [enableOperationsCalendar, setEnableOperationsCalendar] = useState(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        return prefs.enableOperationsCalendar || false;
      }
    } catch {}
    return false;
  });
  const [enableWebCalling, setEnableWebCalling] = useState(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        return prefs.enableWebCalling || false;
      }
    } catch {}
    return false;
  });
  const [unitsPreference, setUnitsPreference] = useState<'imperial' | 'metric' | 'mixed'>(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.unitsPreference) return prefs.unitsPreference;
      }
    } catch {}
    return 'metric';
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    const preferences = {
      location, // Store unified location (supports both timezone and port)
      timezone, // Also store timezone for backward compatibility
      clockType,
      enableWeather,
      enableTides,
      enableMoonPhase,
      enableOperationsCalendar,
      enableWebCalling,
      unitsPreference,
    };
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    // Invalidate preferences query to trigger re-render in other components
    queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    queryClient.invalidateQueries({ queryKey: ['/api/users/preferences'] });
  }, [location, timezone, clockType, enableWeather, enableTides, enableMoonPhase, enableOperationsCalendar, enableWebCalling, unitsPreference, queryClient]);

  // Notify other components when units preference changes
  useEffect(() => {
    notifyUnitsPreferenceChange();
  }, [unitsPreference]);

  // Super Admin emails - Jon Lalabalavu's accounts
  const SUPER_ADMIN_EMAILS = ['lalabalavu.jon@gmail.com', 'sephdee@hotmail.com'];
  const isSuperAdminEmail = (email: string | undefined) => {
    if (!email) return false;
    return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
  };
  
  // Get current user data
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      bio: currentUser?.bio || '',
      company: currentUser?.company || '',
      jobTitle: currentUser?.jobTitle || '',
      location: currentUser?.location || '',
    },
  });

  // Reset form when user data loads
  React.useEffect(() => {
    if (currentUser) {
      form.reset({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        company: currentUser.company || '',
        jobTitle: currentUser.jobTitle || '',
        location: currentUser.location || '',
      });
    }
  }, [currentUser, form]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const userEmail = localStorage.getItem('userEmail') || currentUser?.email;
      if (!userEmail) {
        throw new Error('User email is required');
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ ...data, currentEmail: userEmail }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Profile picture upload mutation
  const uploadPictureMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('File size must be less than 5MB');
        }

        // Convert file to base64 data URL
        const base64String = await fileToBase64(file);
        const profilePictureURL = `data:${file.type};base64,${base64String}`;
        
        // Update user profile with new picture URL
        const userEmail = localStorage.getItem('userEmail') || currentUser?.email;
        if (!userEmail) {
          throw new Error('User email is required');
        }

        const response = await fetch('/api/users/profile-picture', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': userEmail,
          },
          body: JSON.stringify({ profilePictureURL }),
        });
        
        const responseData = await response.json().catch(() => ({}));
        
        if (!response.ok) {
          throw new Error(responseData.error || `Failed to update profile picture: ${response.status} ${response.statusText}`);
        }
        
        return responseData;
      } catch (error: any) {
        console.error('Profile picture upload error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    },
  });

  // Use Gravatar mutation
  const useGravatarMutation = useMutation({
    mutationFn: async () => {
      const userEmail = localStorage.getItem('userEmail') || currentUser?.email;
      if (!userEmail) {
        throw new Error('User email is required');
      }

      const response = await fetch('/api/users/profile-picture', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ profilePictureURL: 'gravatar' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to set Gravatar');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Gravatar Enabled",
        description: "Your profile picture is now using Gravatar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Enable Gravatar",
        description: error.message || "Failed to set Gravatar",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 2FA Setup Mutation - Generate Secret and QR Code
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const email = localStorage.getItem('userEmail') || currentUser?.email || '';
      const response = await apiRequest("POST", `/api/auth/2fa/setup?email=${encodeURIComponent(email)}`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to setup 2FA");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setTwoFactorSecret(data.secret);
      setQrCodeDataUrl(data.qrCode);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to setup 2FA",
        variant: "destructive",
      });
    },
  });

  // 2FA Verify Mutation
  const verify2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const email = localStorage.getItem('userEmail') || currentUser?.email || '';
      const response = await apiRequest("POST", "/api/auth/2fa/verify", {
        token,
        secret: twoFactorSecret,
        email,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to verify 2FA");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled.",
      });
      setIs2FAEnabled(true);
      setShow2FADialog(false);
      setTwoFactorSecret("");
      setQrCodeDataUrl("");
      setTwoFactorToken("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    },
  });

  // Password Change Mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const email = localStorage.getItem('userEmail') || currentUser?.email || '';
      const response = await apiRequest("POST", "/api/auth/change-password", {
        email,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Check 2FA status on mount
  useEffect(() => {
    const check2FAStatus = async () => {
      const email = localStorage.getItem('userEmail') || currentUser?.email || '';
      if (!email) return;
      
      try {
        const response = await fetch(`/api/auth/2fa/status?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          setIs2FAEnabled(data.enabled);
        }
      } catch (error) {
        console.error("Failed to check 2FA status:", error);
      }
    };
    check2FAStatus();
  }, [currentUser]);

  // Auto-setup 2FA when dialog opens
  useEffect(() => {
    if (show2FADialog && !twoFactorSecret && !setup2FAMutation.isPending) {
      setup2FAMutation.mutate();
    }
  }, [show2FADialog]);

  const handleProfileSubmit = (data: ProfileFormData) => {
    console.log('Form submitted with data:', data);
    updateProfileMutation.mutate(data);
  };

  const handlePictureUpload = () => {
    if (selectedFile) {
      uploadPictureMutation.mutate(selectedFile);
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name && name !== 'Admin User' && name !== 'Lifetime Member' && name !== 'Trial User') {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    const emailParts = email.split('@')[0];
    return emailParts.slice(0, 2).toUpperCase();
  };

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Loading profile settings...</p>
            </div>
          </div>
        ) : (
          <>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-lg text-slate-600">Manage your profile and account preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : currentUser?.profilePictureUrl ? (
                        <img 
                          src={currentUser.profilePictureUrl} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                          <span className="text-primary-700 font-medium text-2xl">
                            {getInitials(currentUser?.name || '', currentUser?.email || '')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="profile-picture-upload"
                      />
                      <div className="flex flex-col gap-2">
                        <label htmlFor="profile-picture-upload">
                          <Button variant="outline" className="cursor-pointer w-full" asChild>
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Choose Photo
                            </span>
                          </Button>
                        </label>
                        {selectedFile && (
                          <Button 
                            className="w-full"
                            onClick={handlePictureUpload}
                            disabled={uploadPictureMutation.isPending}
                          >
                            {uploadPictureMutation.isPending ? 'Uploading...' : 'Save Photo'}
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          className="w-full"
                          onClick={() => useGravatarMutation.mutate()}
                          disabled={useGravatarMutation.isPending}
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          {useGravatarMutation.isPending ? 'Loading...' : 'Use Gravatar'}
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 text-center">
                      Max file size: 5MB<br />
                      Supported: JPG, PNG, GIF
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{currentUser?.name}</p>
                      <p className="text-sm text-slate-500">{currentUser?.email}</p>
                    </div>
                    <UserStatusBadge
                      role={isSuperAdminEmail(currentUser?.email) ? 'SUPER_ADMIN' : (currentUser?.role || 'USER')}
                      subscriptionType={isSuperAdminEmail(currentUser?.email) ? 'LIFETIME' : (currentUser?.subscriptionType || 'TRIAL')}
                      subscriptionDate={currentUser?.subscriptionDate}
                      trialExpiresAt={isSuperAdminEmail(currentUser?.email) ? undefined : currentUser?.trialExpiresAt}
                      userName={isSuperAdminEmail(currentUser?.email) ? (currentUser?.name || 'Jon Lalabalavu') : currentUser?.name}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Member Since</p>
                      <p className="font-medium">
                        {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Account Type</p>
                      <p className="font-medium">{currentUser?.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Information Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} data-testid="input-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your email" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your phone number" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="City, Country" {...field} data-testid="input-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input placeholder="Your company name" {...field} data-testid="input-company" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Your job title" {...field} data-testid="input-job-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <textarea 
                              className="w-full p-3 border border-slate-200 rounded-lg resize-none"
                              rows={4}
                              placeholder="Tell us about yourself..."
                              {...field}
                              data-testid="textarea-bio"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="w-full md:w-auto"
                      data-testid="button-save-profile"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">Change Password</h4>
                    <p className="text-sm text-slate-500">Update your account password</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                    Change Password
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-slate-500">
                      {is2FAEnabled ? "2FA is enabled" : "Add an extra layer of security"}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShow2FADialog(true)}
                  >
                    {is2FAEnabled ? "Manage 2FA" : "Enable 2FA"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-medium text-red-900">Delete Account</h4>
                    <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-slate-500">Receive updates via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Course Progress</h4>
                      <p className="text-sm text-slate-500">Notifications about lesson completions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Marketing Updates</h4>
                      <p className="text-sm text-slate-500">New features and promotions</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Affiliate Updates</h4>
                      <p className="text-sm text-slate-500">Commission and referral notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Display Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Theme</h4>
                      <p className="text-sm text-slate-500">Choose your preferred theme</p>
                    </div>
                    <Select defaultValue="light">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Language</h4>
                      <p className="text-sm text-slate-500">Select your preferred language</p>
                    </div>
                    <Select defaultValue="en">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español (Spanish)</SelectItem>
                        <SelectItem value="fr">Français (French)</SelectItem>
                        <SelectItem value="de">Deutsch (German)</SelectItem>
                        <SelectItem value="it">Italiano (Italian)</SelectItem>
                        <SelectItem value="pt">Português (Portuguese)</SelectItem>
                        <SelectItem value="nl">Nederlands (Dutch)</SelectItem>
                        <SelectItem value="ru">Русский (Russian)</SelectItem>
                        <SelectItem value="zh">中文 (Chinese)</SelectItem>
                        <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                        <SelectItem value="ko">한국어 (Korean)</SelectItem>
                        <SelectItem value="ar">العربية (Arabic)</SelectItem>
                        <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Location</h4>
                      <p className="text-sm text-slate-500">Select a city or port for widgets sync</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={location} 
                        onValueChange={async (value) => {
                          setLocation(value);
                          // Also save to backend API for widgets
                          try {
                            const locationDetails = await getLocationDetails(value);
                            if (locationDetails) {
                              const userEmail = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
                              await fetch('/api/widgets/location', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  email: userEmail,
                                  latitude: locationDetails.latitude,
                                  longitude: locationDetails.longitude,
                                  locationName: locationDetails.name,
                                  isCurrentLocation: false,
                                }),
                              });
                              queryClient.invalidateQueries({ queryKey: ['/api/widgets/location', userEmail] });
                            }
                          } catch (error) {
                            console.error('Error saving location to backend:', error);
                          }
                        }}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select location..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px]">
                          {/* Primary Ports Section */}
                          {locations.filter(loc => loc.type === 'port-primary').length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50">
                                ⚓ Primary Ports
                              </div>
                              {locations
                                .filter(loc => loc.type === 'port-primary')
                                .map((loc) => (
                                  <SelectItem key={loc.value} value={loc.value}>
                                    {loc.label}
                                  </SelectItem>
                                ))}
                            </>
                          )}
                          {/* Secondary Ports Section */}
                          {locations.filter(loc => loc.type === 'port-secondary').length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">
                                🚢 Secondary Ports
                              </div>
                              {locations
                                .filter(loc => loc.type === 'port-secondary')
                                .map((loc) => (
                                  <SelectItem key={loc.value} value={loc.value}>
                                    {loc.label}
                                  </SelectItem>
                                ))}
                            </>
                          )}
                          {/* Cities Section */}
                          {locations.filter(loc => loc.type === 'city').length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 mt-1">
                                🌍 Cities
                              </div>
                              {locations
                                .filter(loc => loc.type === 'city')
                                .map((loc) => (
                                  <SelectItem key={loc.value} value={loc.value}>
                                    {loc.label}
                                  </SelectItem>
                                ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <LocationSelector 
                        trigger={
                          <Button variant="outline" size="sm">
                            <Globe className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Clock Type
                      </h4>
                      <p className="text-sm text-slate-500">Digital or analog clock display</p>
                    </div>
                    <Select value={clockType} onValueChange={(value: 'digital' | 'analog') => setClockType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="analog">Analog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Ruler className="w-4 h-4" />
                        Units
                      </h4>
                      <p className="text-sm text-slate-500">Select your preferred measurement units</p>
                    </div>
                    <Select value={unitsPreference} onValueChange={(value: 'imperial' | 'metric' | 'mixed') => setUnitsPreference(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imperial">Imperial Units</SelectItem>
                        <SelectItem value="metric">Metric Units</SelectItem>
                        <SelectItem value="mixed">Mixed (Both)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Location-Based Apps</h4>
                    <p className="text-sm text-slate-500">Enable apps synced to your location</p>
                    
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Cloud className="w-5 h-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium">Weather App</h4>
                          <p className="text-sm text-slate-500">Current weather and forecast</p>
                        </div>
                      </div>
                      <Switch checked={enableWeather} onCheckedChange={setEnableWeather} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Waves className="w-5 h-5 text-cyan-500" />
                        <div>
                          <h4 className="font-medium">Tides App</h4>
                          <p className="text-sm text-slate-500">Tide times and predictions</p>
                        </div>
                      </div>
                      <Switch checked={enableTides} onCheckedChange={setEnableTides} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-indigo-500" />
                        <div>
                          <h4 className="font-medium">Moon Phase App</h4>
                          <p className="text-sm text-slate-500">Current moon phase and calendar</p>
                        </div>
                      </div>
                      <Switch checked={enableMoonPhase} onCheckedChange={setEnableMoonPhase} />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-500" />
                        <div>
                          <h4 className="font-medium">Operations Calendar</h4>
                          <p className="text-sm text-slate-500">Plan and track operations (synced to your timezone)</p>
                        </div>
                      </div>
                      <Switch checked={enableOperationsCalendar} onCheckedChange={setEnableOperationsCalendar} />
                    </div>
                    
                    <div className="p-4 border border-slate-200 rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-green-500" />
                          <div>
                            <h4 className="font-medium">Web & Audio Calling</h4>
                            <p className="text-sm text-slate-500">Enable video and audio calling features</p>
                          </div>
                        </div>
                        <Switch checked={enableWebCalling} onCheckedChange={setEnableWebCalling} />
                      </div>
                      
                      {enableWebCalling && (
                        <div className="pt-4 border-t space-y-4">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Default Calling Provider</Label>
                            <Select defaultValue="google-meet">
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="google-meet">Google Meet</SelectItem>
                                <SelectItem value="zoom">Zoom</SelectItem>
                                <SelectItem value="facetime">FaceTime</SelectItem>
                                <SelectItem value="phone">Phone (Twilio)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="calling-phone" className="text-sm font-medium mb-2 block">
                              Phone Number (for phone calls)
                            </Label>
                            <Input
                              id="calling-phone"
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              className="w-full"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Your phone number for receiving calls via Twilio
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Enabled Providers</Label>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="provider-google-meet" className="text-sm font-normal">
                                  Google Meet
                                </Label>
                                <Switch id="provider-google-meet" defaultChecked />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="provider-zoom" className="text-sm font-normal">
                                  Zoom
                                </Label>
                                <Switch id="provider-zoom" defaultChecked />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="provider-facetime" className="text-sm font-normal">
                                  FaceTime
                                </Label>
                                <Switch id="provider-facetime" defaultChecked />
                              </div>
                              <div className="flex items-center justify-between">
                                <Label htmlFor="provider-phone" className="text-sm font-normal">
                                  Phone Calls (Twilio)
                                </Label>
                                <Switch id="provider-phone" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
        )}
        </main>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!currentPassword || !newPassword || !confirmPassword) {
                  toast({
                    title: "Error",
                    description: "All fields are required",
                    variant: "destructive",
                  });
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast({
                    title: "Error",
                    description: "New passwords do not match",
                    variant: "destructive",
                  });
                  return;
                }
                if (newPassword.length < 8) {
                  toast({
                    title: "Error",
                    description: "New password must be at least 8 characters",
                    variant: "destructive",
                  });
                  return;
                }
                changePasswordMutation.mutate({
                  currentPassword,
                  newPassword,
                });
              }}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={show2FADialog} onOpenChange={(open) => {
        setShow2FADialog(open);
        if (!open) {
          // Reset state when dialog closes
          setTwoFactorSecret("");
          setQrCodeDataUrl("");
          setTwoFactorToken("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Add an extra layer of security to your account using an authenticator app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!twoFactorSecret ? (
              <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How to set up 2FA:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Download an authenticator app (Google Authenticator, Authy, or Microsoft Authenticator)</li>
                    <li>Click "Generate QR Code" below</li>
                    <li>Scan the QR code or enter the secret key manually</li>
                <li>Enter the 6-digit code from your app to verify</li>
              </ol>
            </div>
                <Button 
                  onClick={() => setup2FAMutation.mutate()}
                  disabled={setup2FAMutation.isPending}
                  className="w-full"
                >
                  {setup2FAMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate QR Code"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How to set up 2FA:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Download an authenticator app (Google Authenticator, Authy, or Microsoft Authenticator)</li>
                    <li>Scan the QR code below or enter the secret key manually</li>
                    <li>Enter the 6-digit code from your app to verify</li>
                  </ol>
                </div>
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg bg-white">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48" />
                  ) : (
              <div className="text-center">
                <Smartphone className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Loading QR Code...</p>
              </div>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 mb-1">Manual Entry Key:</p>
                  <p className="text-sm font-mono text-slate-900 break-all">{twoFactorSecret}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="2fa-code">Enter 6-digit code</Label>
              <Input
                id="2fa-code"
                type="text"
                maxLength={6}
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
              />
            </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShow2FADialog(false);
                setTwoFactorSecret("");
                setQrCodeDataUrl("");
                setTwoFactorToken("");
              }}
            >
              Cancel
            </Button>
            {twoFactorSecret && (
              <Button 
                onClick={() => {
                  if (twoFactorToken.length !== 6) {
              toast({
                      title: "Error",
                      description: "Please enter a 6-digit code",
                      variant: "destructive",
                    });
                    return;
                  }
                  verify2FAMutation.mutate(twoFactorToken);
                }}
                disabled={verify2FAMutation.isPending}
              >
                {verify2FAMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Enable 2FA"
                )}
            </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}