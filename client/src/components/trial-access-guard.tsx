import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CreditCard, Lock } from "lucide-react";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
  trialExpiresAt?: string;
  subscriptionStatus?: string;
}

interface TrialAccessGuardProps {
  children: React.ReactNode;
}

// Public routes that expired trial users can still access
const PUBLIC_ROUTES = [
  '/',
  '/trial-signup',
  '/login',
  '/signin',
  '/privacy',
  '/contact',
  '/terms',
];

// Upgrade routes that expired trial users can access
const UPGRADE_ROUTES = [
  '/profile-settings',
];

export default function TrialAccessGuard({ children }: TrialAccessGuardProps) {
  const [location, setLocation] = useLocation();

  // Get current user data
  const { data: currentUser, isLoading } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    retry: false,
  });

  useEffect(() => {
    // Don't block if still loading
    if (isLoading) return;

    // Don't block admins or paid users
    // Check for all admin roles including PARTNER_ADMIN
    const isAdmin = currentUser?.role === 'ADMIN' || 
                    currentUser?.role === 'SUPER_ADMIN' || 
                    currentUser?.role === 'PARTNER_ADMIN';
    const isPaidUser = currentUser?.subscriptionType === 'MONTHLY' || 
                       currentUser?.subscriptionType === 'ANNUAL' || 
                       currentUser?.subscriptionType === 'LIFETIME';
    
    // Also check if trialExpiresAt is null (which indicates admin/lifetime user)
    const hasNoTrialExpiration = currentUser?.trialExpiresAt === null;
    
    if (isAdmin || isPaidUser || hasNoTrialExpiration) {
      return;
    }

    // Don't block public routes
    if (PUBLIC_ROUTES.some(route => location === route || location.startsWith(route))) {
      return;
    }

    // Don't block upgrade routes
    if (UPGRADE_ROUTES.some(route => location === route || location.startsWith(route))) {
      return;
    }

    // Check if user is a trial user (only check if subscriptionType is TRIAL and trialExpiresAt is not null)
    if (currentUser?.subscriptionType === 'TRIAL' && currentUser.trialExpiresAt !== null) {
      // Check if trial has expired
      if (currentUser.trialExpiresAt) {
        const expirationDate = new Date(currentUser.trialExpiresAt);
        const now = new Date();
        
        if (now > expirationDate) {
          // Trial expired - redirect to profile settings for upgrade
          if (!UPGRADE_ROUTES.some(route => location === route || location.startsWith(route))) {
            setLocation('/profile-settings?upgrade=true');
          }
        }
      }
    }
  }, [currentUser, isLoading, location, setLocation]);

  // If loading, show children (will check on load)
  if (isLoading) {
    return <>{children}</>;
  }

  // Don't block admins or paid users
  // Check for all admin roles including PARTNER_ADMIN
  const isAdmin = currentUser?.role === 'ADMIN' || 
                  currentUser?.role === 'SUPER_ADMIN' || 
                  currentUser?.role === 'PARTNER_ADMIN';
  const isPaidUser = currentUser?.subscriptionType === 'MONTHLY' || 
                     currentUser?.subscriptionType === 'ANNUAL' || 
                     currentUser?.subscriptionType === 'LIFETIME';
  
  // Also check if trialExpiresAt is null (which indicates admin/lifetime user)
  const hasNoTrialExpiration = currentUser?.trialExpiresAt === null;

  // Check if trial expired
  // Only check expiration for actual TRIAL users (not admins or lifetime users)
  const isTrialExpired = currentUser?.subscriptionType === 'TRIAL' && 
    currentUser.trialExpiresAt !== null &&
    currentUser.trialExpiresAt && 
    new Date(currentUser.trialExpiresAt) < new Date();

  // Allow access to public routes and upgrade routes
  const isPublicRoute = PUBLIC_ROUTES.some(route => location === route || location.startsWith(route));
  const isUpgradeRoute = UPGRADE_ROUTES.some(route => location === route || location.startsWith(route));

  if (isTrialExpired && !isAdmin && !isPaidUser && !hasNoTrialExpiration && !isPublicRoute && !isUpgradeRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Trial Expired
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Your 24-hour free trial has expired. Upgrade to continue accessing the platform.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm text-slate-600 text-center">
                To continue your professional diving education, please upgrade to a paid subscription plan.
              </p>

              <Button
                onClick={() => setLocation('/profile-settings?upgrade=true')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>

              <Button
                onClick={() => setLocation('/')}
                variant="outline"
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

