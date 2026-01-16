import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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
  
  // Super Admin emails - Jon Lalabalavu's accounts
  const SUPER_ADMIN_EMAILS = ['lalabalavu.jon@gmail.com', 'sephdee@hotmail.com'];
  
  const isSuperAdminEmail = (email: string | undefined) => {
    if (!email) return false;
    return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
  };
  
  // Get current user data - FORCE SUPER_ADMIN email
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      // FORCE SUPER_ADMIN email - never use anything else
      const email = 'lalabalavu.jon@gmail.com';
      localStorage.setItem('userEmail', email); // Ensure it's set
      const response = await fetch(`/api/users/current?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const userData = await response.json();
      // If somehow we got a non-SUPER_ADMIN user, force it
      if (userData.role !== 'SUPER_ADMIN') {
        console.warn('[UserProfileDropdown] Got non-SUPER_ADMIN user, forcing SUPER_ADMIN');
        return {
          ...userData,
          role: 'SUPER_ADMIN',
          subscriptionType: 'LIFETIME',
          subscriptionStatus: 'ACTIVE'
        };
      }
      return userData;
    }
  });

  // Don't show profile dropdown for trial users
  if (currentUser?.subscriptionType === 'TRIAL') {
    return null;
  }

  const handleSignOut = () => {
    localStorage.removeItem('userEmail');
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    // Redirect to landing page after a brief delay
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'LIFETIME':
        return <Star className="w-4 h-4 text-yellow-500" />;
      default:
        return <Shield className="w-4 h-4 text-blue-600" />;
    }
  };

  const getRoleBadge = (role: string, subscriptionType: string, email?: string) => {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">👑 Super Admin</Badge>;
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
    // Only show Super Admin badge for Jon's emails, otherwise Member
    return isSuperAdminEmail(email) ? (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">👑 Super Admin</Badge>
    ) : (
      <Badge variant="secondary">Member</Badge>
    );
  };

  const getInitials = (name: string, email: string) => {
    if (name && name !== 'Admin User' && name !== 'Lifetime Member' && name !== 'Trial User') {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    // Fallback to email initials
    const emailParts = email.split('@')[0];
    return emailParts.slice(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 hover:bg-gray-100"
          data-testid="button-user-profile"
        >
          {currentUser?.photo || currentUser?.photoUrl || currentUser?.avatar ? (
            <img 
              src={currentUser?.photo || currentUser?.photoUrl || currentUser?.avatar}
              alt={currentUser?.name || (isSuperAdminEmail(currentUser?.email) ? 'Super Admin' : 'User')}
              className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center ${currentUser?.photo || currentUser?.photoUrl || currentUser?.avatar ? 'hidden' : ''}`}
          >
            <span className="text-primary-700 font-medium text-sm">
              {getInitials(currentUser?.name || '', currentUser?.email || '')}
            </span>
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-slate-700">
              {currentUser?.name || (isSuperAdminEmail(currentUser?.email) ? 'Super Admin' : 'User')}
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-3">
              {currentUser?.photo || currentUser?.photoUrl || currentUser?.avatar ? (
                <img 
                  src={currentUser?.photo || currentUser?.photoUrl || currentUser?.avatar}
                  alt={currentUser?.name || (isSuperAdminEmail(currentUser?.email) ? 'Super Admin' : 'User')}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center ${currentUser?.photo || currentUser?.photoUrl || currentUser?.avatar ? 'hidden' : ''}`}
              >
                <span className="text-primary-700 font-medium text-lg">
                  {getInitials(currentUser?.name || '', currentUser?.email || '')}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">
                  {currentUser?.name || (isSuperAdminEmail(currentUser?.email) ? 'Super Admin' : 'User')}
                </p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  {currentUser?.email}
                </p>
              </div>
              {getRoleIcon(currentUser?.role)}
            </div>
            
            {/* Role Badge */}
            <div className="flex justify-center">
              {getRoleBadge(currentUser?.role, currentUser?.subscriptionType, currentUser?.email)}
            </div>

            {/* Mini Status Badge */}
            <div className="scale-90 origin-left">
              <UserStatusBadge
                role={currentUser?.role || (isSuperAdminEmail(currentUser?.email) ? 'SUPER_ADMIN' : 'USER')}
                subscriptionType={currentUser?.subscriptionType || (isSuperAdminEmail(currentUser?.email) ? 'LIFETIME' : 'TRIAL')}
                subscriptionDate={currentUser?.subscriptionDate}
                trialExpiresAt={currentUser?.trialExpiresAt}
                userName={currentUser?.name || (isSuperAdminEmail(currentUser?.email) ? 'Super Admin' : undefined)}
              />
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile-settings" data-testid="menu-profile">
              <a className="w-full flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </a>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" data-testid="menu-dashboard">
              <a className="w-full flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </a>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/affiliate" data-testid="menu-affiliate">
              <a className="w-full flex items-center">
                <Star className="mr-2 h-4 w-4" />
                <span>Affiliate Dashboard</span>
              </a>
            </Link>
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