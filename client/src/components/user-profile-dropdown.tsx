import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { User, Settings, LogOut, Shield, Star, Award, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserStatusBadge from "@/components/user-status-badge";
import { useToast } from "@/hooks/use-toast";

export default function UserProfileDropdown() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get current user data
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Show profile dropdown for ALL users (including trial users)
  // All users should be able to access their profile and settings

  const handleSignOut = () => {
    localStorage.removeItem('userEmail');
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    // Redirect to landing page using router
    setLocation('/');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'PARTNER_ADMIN':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'LIFETIME':
        return <Star className="w-4 h-4 text-yellow-500" />;
      default:
        return <Shield className="w-4 h-4 text-blue-600" />;
    }
  };

  const getRoleBadge = (role: string, subscriptionType: string) => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">👑 Admin</Badge>;
    }
    if (role === 'PARTNER_ADMIN') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">🤝 Partner Admin</Badge>;
    }
    if (subscriptionType === 'LIFETIME') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">⭐ Lifetime</Badge>;
    }
    if (subscriptionType === 'ANNUAL') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🥇 Annual</Badge>;
    }
    if (subscriptionType === 'MONTHLY') {
      return <Badge variant="secondary" className="bg-slate-100 text-slate-800">🥈 Monthly</Badge>;
    }
    if (subscriptionType === 'TRIAL') {
      return <Badge variant="secondary" className="bg-slate-100 text-slate-800">🆓 Trial</Badge>;
    }
    return <Badge variant="secondary">Member</Badge>;
  };

  const getInitials = (name: string, email: string) => {
    if (name && name !== 'Admin User' && name !== 'Lifetime Member' && name !== 'Trial User') {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    // Fallback to email initials
    const emailParts = email.split('@')[0];
    return emailParts.slice(0, 2).toUpperCase();
  };

  const getProfilePictureUrl = (): string | null => {
    // Check if user has a profile picture URL
    return currentUser?.profilePictureUrl || null;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 hover:bg-gray-100"
          data-testid="button-user-profile"
        >
          {getProfilePictureUrl() ? (
            <img 
              src={getProfilePictureUrl()!} 
              alt="Profile" 
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center ${getProfilePictureUrl() ? 'hidden' : ''}`}>
            <span className="text-primary-700 font-medium text-sm">
              {getInitials(currentUser?.name || '', currentUser?.email || '')}
            </span>
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-slate-700">
              {currentUser?.name || 'User'}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-3">
              {getProfilePictureUrl() ? (
                <img 
                  src={getProfilePictureUrl()!} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center ${getProfilePictureUrl() ? 'hidden' : ''}`}>
                <span className="text-primary-700 font-medium text-lg">
                  {getInitials(currentUser?.name || '', currentUser?.email || '')}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {currentUser?.email}
                </p>
              </div>
              {getRoleIcon(currentUser?.role)}
            </div>
            
            {/* Role Badge */}
            <div className="flex justify-center">
              {getRoleBadge(currentUser?.role, currentUser?.subscriptionType)}
            </div>

            {/* Mini Status Badge */}
            <div className="scale-90 origin-left">
              <UserStatusBadge
                role={currentUser?.role || 'USER'}
                subscriptionType={currentUser?.subscriptionType || 'TRIAL'}
                subscriptionDate={currentUser?.subscriptionDate}
                trialExpiresAt={currentUser?.trialExpiresAt}
                userName={currentUser?.name}
              />
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => setLocation('/profile-settings')}
            data-testid="menu-profile"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLocation('/dashboard')}
            data-testid="menu-dashboard"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLocation('/affiliate')}
            data-testid="menu-affiliate"
          >
            <Star className="mr-2 h-4 w-4" />
            <span>Affiliate Dashboard</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          data-testid="menu-signout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}