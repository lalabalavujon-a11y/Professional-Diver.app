import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function AffiliateStripeOnboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  // Get user email
  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  // Get userId from email (same logic as other endpoints)
  const getUserId = (email: string): string => {
    if (email === 'lalabalavu.jon@gmail.com') return 'super-admin-1';
    if (email === 'sephdee@hotmail.com') return 'super-admin-2';
    return email;
  };

  // Check current status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/affiliate/stripe-connect/status', userEmail],
    queryFn: async () => {
      const response = await fetch(`/api/affiliate/stripe-connect/status?email=${encodeURIComponent(userEmail)}`);
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    },
  });

  // Initiate onboarding mutation
  const onboardMutation = useMutation({
    mutationFn: async () => {
      const returnUrl = `${window.location.origin}/affiliate/stripe-onboard?return=true`;
      const response = await fetch('/api/affiliate/stripe-connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          userId: getUserId(userEmail),
          returnUrl,
        }),
      });
      if (!response.ok) throw new Error('Failed to initiate onboarding');
      return response.json();
    },
    onSuccess: (data) => {
      setOnboardingUrl(data.onboardingUrl);
      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start onboarding",
        variant: "destructive",
      });
    },
  });

  // Check if returning from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('return') === 'true') {
      // Refresh status after returning
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, []);

  const handleStartOnboarding = () => {
    onboardMutation.mutate();
  };

  const getStatusDisplay = () => {
    const onboardingStatus = status?.onboardingStatus || 'NOT_STARTED';
    const accountStatus = status?.accountStatus;

    if (onboardingStatus === 'COMPLETE' && accountStatus?.payoutsEnabled) {
      return {
        icon: <CheckCircle className="w-8 h-8 text-green-600" />,
        title: "Stripe Connect Setup Complete!",
        description: "Your account is ready to receive payouts. You'll receive commissions directly to your bank account or debit card.",
        badge: <Badge className="bg-green-600">Connected</Badge>,
        showButton: false,
      };
    }

    if (onboardingStatus === 'IN_PROGRESS') {
      return {
        icon: <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />,
        title: "Onboarding In Progress",
        description: "Please complete the Stripe onboarding process to finish setting up your account.",
        badge: <Badge className="bg-yellow-600">In Progress</Badge>,
        showButton: true,
      };
    }

    if (onboardingStatus === 'REQUIRES_ACTION') {
      return {
        icon: <AlertCircle className="w-8 h-8 text-orange-600" />,
        title: "Action Required",
        description: "Your Stripe Connect account needs additional information. Please complete the setup process.",
        badge: <Badge className="bg-orange-600">Action Required</Badge>,
        showButton: true,
      };
    }

    return {
      icon: <AlertCircle className="w-8 h-8 text-slate-600" />,
      title: "Set Up Stripe Connect",
      description: "Connect your bank account or debit card to receive commission payouts automatically. The setup process takes just a few minutes.",
      badge: <Badge variant="outline">Not Started</Badge>,
      showButton: true,
    };
  };

  const statusDisplay = getStatusDisplay();

  if (statusLoading) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center" data-sidebar-content="true">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/affiliate-dashboard">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    {statusDisplay.icon}
                    Stripe Connect Setup
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {statusDisplay.description}
                  </CardDescription>
                </div>
                {statusDisplay.badge}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {statusDisplay.showButton && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">What you'll need:</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Your business or personal information</li>
                      <li>Bank account or debit card details</li>
                      <li>Tax information (if required)</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleStartOnboarding}
                    disabled={onboardMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {onboardMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        Start Stripe Connect Setup
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!statusDisplay.showButton && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 text-sm">
                    Your Stripe Connect account is fully set up and ready to receive payouts. 
                    Commissions will be automatically transferred to your connected bank account or debit card.
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Benefits of Stripe Connect:</h3>
                <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                  <li>Fast, automatic payouts</li>
                  <li>Secure bank-level encryption</li>
                  <li>No PayPal account required</li>
                  <li>Direct deposit to your account</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
