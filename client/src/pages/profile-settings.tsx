import { useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import TimezoneSelect from "react-timezone-select";
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
  AlertTriangle,
  X
} from "lucide-react";
import UserStatusBadge from "@/components/user-status-badge";
import { useTheme } from "@/hooks/use-theme";
import { z } from "zod";
import { getGravatarUrl } from "@/lib/gravatar";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).optional(),
  timezone: z.string().optional(),
  useGravatar: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
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
  const [location, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("language") || "en";
    }
    return "en";
  });

  // Check if accessed via upgrade query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upgrade') === 'true') {
      setShowUpgradePrompt(true);
      // Clean up URL
      window.history.replaceState({}, '', '/profile-settings');
    }
  }, []);

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
      status: currentUser?.subscriptionStatus || currentUser?.status || 'ACTIVE',
      timezone: currentUser?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      useGravatar: currentUser?.useGravatar ?? false,
      theme: "light",
      language: localStorage.getItem("language") || "en",
    },
  });

  // Reset form when user data loads
  React.useEffect(() => {
    if (currentUser) {
      const savedTheme = "light";
      const savedLanguage = localStorage.getItem("language") || "en";
      form.reset({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        bio: currentUser.bio || '',
        company: currentUser.company || '',
        jobTitle: currentUser.jobTitle || '',
        location: currentUser.location || '',
        status: currentUser.subscriptionStatus || currentUser.status || 'ACTIVE',
        timezone: currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        useGravatar: currentUser.useGravatar ?? false,
                        theme: "light",
        language: savedLanguage,
      });
      setTheme("light");
      setLanguage(savedLanguage);
    }
  }, [currentUser, form, setTheme]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const userEmail = localStorage.getItem('userEmail') || currentUser?.email;
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || '',
        },
        body: JSON.stringify({ ...data, currentEmail: userEmail, status: data.status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
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
      // Convert file to base64
      const base64String = await fileToBase64(file);
      const profilePictureURL = `data:${file.type};base64,${base64String}`;
      
      // Update user profile with new picture URL
      const userEmail = localStorage.getItem('userEmail') || currentUser?.email;
      const response = await fetch('/api/users/profile-picture', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || '',
        },
        body: JSON.stringify({ 
          profilePictureURL: profilePictureURL,
          email: userEmail 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile picture');
      }
      
      const result = await response.json();
      
      // Also update the profile with the picture URL
      const profileResponse = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || '',
        },
        body: JSON.stringify({ 
          profilePictureUrl: profilePictureURL,
          currentEmail: userEmail 
        }),
      });
      
      if (!profileResponse.ok) {
        console.warn('Profile picture saved but profile update failed');
      }
      
      return result;
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
        description: error.message || "Failed to upload profile picture. Please try again.",
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

  const handleProfileSubmit = (data: ProfileFormData) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile settings...</p>
        </div>
      </div>
    );
  }

  // Check if trial expired
  const isTrialExpired = currentUser?.subscriptionType === 'TRIAL' && 
    currentUser.trialExpiresAt && 
    new Date(currentUser.trialExpiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Upgrade Prompt Banner */}
      {(showUpgradePrompt || isTrialExpired) && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <Alert className="border-red-200 bg-red-50 max-w-7xl mx-auto">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="flex items-center justify-between w-full">
              <div className="flex-1">
                <span className="font-semibold text-red-900">Trial Expired</span>
                <span className="text-red-700 ml-2">
                  Your 24-hour free trial has ended. Upgrade to continue accessing all platform features.
                </span>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  onClick={() => {
                    toast({
                      title: "Upgrade Required",
                      description: "Please contact our sales team to upgrade your subscription.",
                    });
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Button>
                <Button
                  onClick={() => setShowUpgradePrompt(false)}
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:text-red-900 hover:bg-red-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png" 
                alt="Professional Diver - Diver Well Training" 
                className="w-10 h-10 rounded-lg object-contain"
                style={{ display: 'block' }}
              />
              <div>
                <div className="text-lg font-bold text-slate-900">Professional Diver</div>
                <div className="text-xs text-slate-500">Profile Settings</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setLocation('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Settings</h1>
          <p className="text-lg text-slate-600">Manage your profile and account preferences</p>
        </div>

        <Form {...form}>
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
                    
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="profile-picture-upload"
                      />
                      <label htmlFor="profile-picture-upload">
                        <Button variant="outline" className="cursor-pointer" asChild>
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Photo
                          </span>
                        </Button>
                      </label>
                      {selectedFile && (
                        <Button 
                          className="ml-2"
                          onClick={handlePictureUpload}
                          disabled={uploadPictureMutation.isPending}
                        >
                          {uploadPictureMutation.isPending ? 'Uploading...' : 'Save Photo'}
                        </Button>
                      )}
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
                      role={currentUser?.role || 'USER'}
                      subscriptionType={currentUser?.subscriptionType || 'TRIAL'}
                      subscriptionDate={currentUser?.subscriptionDate}
                      trialExpiresAt={currentUser?.trialExpiresAt}
                      userName={currentUser?.name}
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
                  
                  <Separator />
                  
                  {/* Account Status - Editable */}
                  <div className="space-y-2">
                    <Label htmlFor="account-status">Account Status</Label>
                    <Select
                      value={form.watch('status') || currentUser?.subscriptionStatus || currentUser?.status || 'ACTIVE'}
                      onValueChange={(value) => form.setValue('status', value as 'ACTIVE' | 'PAUSED' | 'CANCELLED')}
                    >
                      <SelectTrigger id="account-status" className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Update your account status. Changes will be saved when you click "Save Changes".
                    </p>
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
                              <div className="[&_.PhoneInputInput]:flex [&_.PhoneInputInput]:h-10 [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-md [&_.PhoneInputInput]:border [&_.PhoneInputInput]:border-input [&_.PhoneInputInput]:bg-background [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:ring-offset-background [&_.PhoneInputInput]:file:border-0 [&_.PhoneInputInput]:file:bg-transparent [&_.PhoneInputInput]:file:text-sm [&_.PhoneInputInput]:file:font-medium [&_.PhoneInputInput]:placeholder:text-muted-foreground [&_.PhoneInputInput]:focus-visible:outline-none [&_.PhoneInputInput]:focus-visible:ring-2 [&_.PhoneInputInput]:focus-visible:ring-ring [&_.PhoneInputInput]:focus-visible:ring-offset-2 [&_.PhoneInputInput]:disabled:cursor-not-allowed [&_.PhoneInputInput]:disabled:opacity-50 [&_.PhoneInputCountry]:mr-2 [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountrySelect]:border [&_.PhoneInputCountrySelect]:rounded [&_.PhoneInputCountrySelect]:px-2 [&_.PhoneInputCountrySelect]:py-1">
                                <PhoneInput
                                  international
                                  defaultCountry="US"
                                  value={field.value || ''}
                                  onChange={(value) => field.onChange(value || '')}
                                  placeholder="Enter your phone number"
                                  className="w-full"
                                />
                              </div>
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
                  <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "Password change functionality will be added soon." })}>
                    Change Password
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-slate-500">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "2FA will be added in a future update." })}>
                    Enable 2FA
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
                    <Select 
                      value="light" 
                      disabled={true}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Language</h4>
                      <p className="text-sm text-slate-500">Select your preferred language</p>
                    </div>
                    <Select 
                      value={language}
                      onValueChange={(value: string) => {
                        setLanguage(value);
                        form.setValue('language', value);
                        localStorage.setItem("language", value);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="hi">हिन्दी</SelectItem>
                        <SelectItem value="nl">Nederlands</SelectItem>
                        <SelectItem value="pl">Polski</SelectItem>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="sv">Svenska</SelectItem>
                        <SelectItem value="da">Dansk</SelectItem>
                        <SelectItem value="no">Norsk</SelectItem>
                        <SelectItem value="fi">Suomi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-medium">Timezone</h4>
                      <p className="text-sm text-slate-500">Your local timezone</p>
                    </div>
                    <div className="space-y-2">
                      <div className="[&_select]:flex [&_select]:h-10 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-input [&_select]:bg-background [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:ring-offset-background [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-ring [&_select]:focus-visible:ring-offset-2 [&_select]:disabled:cursor-not-allowed [&_select]:disabled:opacity-50">
                        <TimezoneSelect
                          value={form.watch('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone}
                          onChange={(tz) => form.setValue('timezone', tz.value, { shouldValidate: true })}
                          className="w-full"
                        />
                      </div>
                      {form.formState.errors.timezone && (
                        <p className="text-sm text-red-600">{form.formState.errors.timezone.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div>
                      <h4 className="font-medium">Use Gravatar</h4>
                      <p className="text-sm text-slate-500">Use your Gravatar profile picture if available</p>
                    </div>
                    <Switch
                      checked={form.watch('useGravatar') || false}
                      onCheckedChange={(checked) => {
                        form.setValue('useGravatar', checked, { shouldValidate: true });
                        // Auto-save when toggled
                        const currentData = form.getValues();
                        updateProfileMutation.mutate({
                          ...currentData,
                          useGravatar: checked
                        });
                      }}
                    />
                  </div>
                </div>
                
                {/* Save Preferences Button */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <Button 
                    type="button"
                    onClick={() => {
                      const currentData = form.getValues();
                      updateProfileMutation.mutate({
                        ...currentData,
                        timezone: form.watch('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone,
                        useGravatar: form.watch('useGravatar') || false,
                        theme: "light",
                        language: language
                      });
                      toast({
                        title: "Preferences Saved",
                        description: "Your display preferences have been saved.",
                      });
                    }}
                    disabled={updateProfileMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </Form>
      </main>
    </div>
  );
}