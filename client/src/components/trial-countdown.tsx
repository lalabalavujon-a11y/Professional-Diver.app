import { useState, useEffect } from "react";
import { Clock, AlertTriangle, Crown, Star, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getPaymentLinkWithFallback } from "@/utils/payment-links";

interface TrialCountdownProps {
  expiresAt?: string;
  onUpgrade?: () => void;
  showUpgradeButton?: boolean;
  role?: string;
  subscriptionType?: string;
  subscriptionStatus?: string;
}

export default function TrialCountdown({ 
  expiresAt, 
  onUpgrade, 
  showUpgradeButton = true,
  role,
  subscriptionType,
  subscriptionStatus
}: TrialCountdownProps) {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  // Get current user email for API checkout
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail');
      if (!email) return null;
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) return null;
      return response.json();
    },
    retry: false
  });

  // Function to handle subscription checkout
  // Payment Strategy: Stripe Payment Links (default) → Revolut (fallback when Stripe is offline)
  const handleCreateCheckout = async (subscriptionType: 'MONTHLY' | 'ANNUAL') => {
    try {
      // PRIMARY: Use Stripe Payment Links as default
      // The utility function handles fallback to Revolut if Stripe is unavailable
      const paymentLink = getPaymentLinkWithFallback(subscriptionType);
      window.open(paymentLink, '_blank');
    } catch (error: any) {
      console.error('Error opening payment link:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to open payment link.",
        variant: "destructive"
      });
      
      // Emergency fallback: Direct Revolut payment links
      const fallbackLink = subscriptionType === 'MONTHLY' 
        ? 'https://checkout.revolut.com/pay/79436775-0472-4414-a0ca-b5f151db466b'
        : 'https://checkout.revolut.com/pay/28d2e7d0-4ee7-41ed-bbf1-d2024f9275d8';
      window.open(fallbackLink, '_blank');
    }
  };

  // Only calculate countdown for TRIAL users
  useEffect(() => {
    if (subscriptionType !== 'TRIAL' || !expiresAt) {
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiration = new Date(expiresAt).getTime();
      const difference = expiration - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ hours, minutes, seconds, total: difference });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, subscriptionType]);

  const isExpired = timeLeft.total <= 0;
  const isLowTime = timeLeft.total <= 3600000; // 1 hour remaining

  // Determine access type based on role and subscription
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'PARTNER_ADMIN';
  const isLifetime = subscriptionType === 'LIFETIME' || isAdmin;
  const isMonthly = subscriptionType === 'MONTHLY';
  const isAnnual = subscriptionType === 'ANNUAL' || subscriptionType === 'YEARLY';
  const isTrial = subscriptionType === 'TRIAL';

  // Lifetime Access for Admins
  if (isLifetime && isAdmin) {
    return (
      <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-yellow-900">Lifetime Access</div>
              <div className="text-sm text-yellow-700">
                {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'PARTNER_ADMIN' ? 'Partner Admin' : 'Admin'} - Full platform access
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Monthly Access
  if (isMonthly) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-blue-900">Monthly Access</div>
              <div className="text-sm text-blue-700">
                Active subscription - Renews monthly
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Annual/Yearly Access
  if (isAnnual) {
    return (
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-green-100">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-green-900">Yearly Access</div>
              <div className="text-sm text-green-700">
                Active subscription - Renews annually
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trial expired
  if (isTrial && isExpired) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <span className="font-medium">Your free trial has expired</span>
            {showUpgradeButton && (
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 text-white ml-4"
                onClick={onUpgrade}
                data-testid="button-upgrade-expired"
              >
                Upgrade Now
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Trial with countdown (only for TRIAL users)
  if (isTrial && expiresAt) {
    return (
      <Card className={`${isLowTime ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isLowTime ? 'bg-orange-100' : 'bg-blue-100'
              }`}>
                <Clock className={`w-5 h-5 ${isLowTime ? 'text-orange-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Free Trial</div>
                <div className={`text-sm ${isLowTime ? 'text-orange-600' : 'text-blue-600'}`}>
                  <span className="font-mono text-lg">
                    {timeLeft.hours.toString().padStart(2, '0')}:
                    {timeLeft.minutes.toString().padStart(2, '0')}:
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="ml-2">remaining</span>
                </div>
              </div>
            </div>
            
            {showUpgradeButton && (
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  onClick={() => handleCreateCheckout('MONTHLY')}
                  data-testid="button-upgrade-monthly"
                >
                  $25/month
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleCreateCheckout('ANNUAL')}
                  data-testid="button-upgrade-yearly"
                >
                  $250/year
                </Button>
              </div>
            )}
          </div>
          
          {isLowTime && (
            <div className="mt-3 text-sm text-orange-700">
              <strong>Hurry!</strong> Your trial expires soon. Upgrade now to continue your diving education.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default fallback (shouldn't normally show)
  return null;
}