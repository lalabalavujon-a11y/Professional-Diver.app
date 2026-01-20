import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Loader2
} from "lucide-react";
import { Link } from "wouter";

interface PaymentMethodData {
  availableMethods: string[];
  preferredMethod: string;
  stripeConnectStatus: string;
  stripeConnectAccountId: string | null;
  paypalEmail: string | null;
}

interface AffiliatePaymentMethodProps {
  userEmail: string;
}

export default function AffiliatePaymentMethod({ userEmail }: AffiliatePaymentMethodProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [paypalEmail, setPaypalEmail] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current payment methods
  const { data: paymentMethods, isLoading } = useQuery<PaymentMethodData>({
    queryKey: ['/api/affiliate/payment-methods', userEmail],
    queryFn: async () => {
      const response = await fetch(`/api/affiliate/payment-methods?email=${encodeURIComponent(userEmail)}`);
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      return response.json();
    },
  });

  // Initialize state from fetched data
  useEffect(() => {
    if (paymentMethods) {
      if (!selectedMethod) {
        setSelectedMethod(paymentMethods.preferredMethod);
      }
      if (paymentMethods.paypalEmail && !paypalEmail) {
        setPaypalEmail(paymentMethods.paypalEmail);
      }
    }
  }, [paymentMethods]);

  // Update payment method mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { preferredMethod: string; paypalEmail?: string }) => {
      const response = await fetch('/api/affiliate/payment-method', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          preferredMethod: data.preferredMethod,
          paypalEmail: data.paypalEmail,
        }),
      });
      if (!response.ok) throw new Error('Failed to update payment method');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment method updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/payment-methods', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/dashboard', userEmail] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update payment method",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (selectedMethod === 'PAYPAL' && !paypalEmail) {
      toast({
        title: "Error",
        description: "PayPal email is required",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      preferredMethod: selectedMethod,
      paypalEmail: selectedMethod === 'PAYPAL' ? paypalEmail : undefined,
    });
  };

  const getStripeConnectStatusBadge = () => {
    const status = paymentMethods?.stripeConnectStatus || 'NOT_STARTED';
    
    switch (status) {
      case 'COMPLETE':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-600"><Loader2 className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
      case 'REQUIRES_ACTION':
        return <Badge className="bg-orange-600"><AlertCircle className="w-3 h-3 mr-1" />Action Required</Badge>;
      default:
        return <Badge variant="outline">Not Set Up</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>
          Choose how you want to receive your commission payouts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
          {/* Stripe Connect Option */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50">
            <RadioGroupItem value="STRIPE_CONNECT" id="stripe-connect" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="stripe-connect" className="flex items-center cursor-pointer">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="font-semibold">Stripe Connect</span>
                </Label>
                {getStripeConnectStatusBadge()}
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Receive payouts directly to your bank account or debit card. Fast, secure, and automatic.
              </p>
              {paymentMethods?.stripeConnectStatus !== 'COMPLETE' && (
                <Link href="/affiliate/stripe-onboard">
                  <Button variant="outline" size="sm" className="mt-2">
                    {paymentMethods?.stripeConnectStatus === 'NOT_STARTED' ? 'Set Up Stripe Connect' : 'Complete Setup'}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* PayPal Option */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50">
            <RadioGroupItem value="PAYPAL" id="paypal" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="paypal" className="flex items-center cursor-pointer">
                  <Building2 className="w-5 h-5 mr-2 text-blue-500" />
                  <span className="font-semibold">PayPal</span>
                </Label>
                {paymentMethods?.paypalEmail && (
                  <Badge variant="outline">{paymentMethods.paypalEmail}</Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-2">
                Receive payouts via PayPal. Requires a PayPal account.
              </p>
              {selectedMethod === 'PAYPAL' && (
                <div className="mt-3">
                  <Label htmlFor="paypal-email">PayPal Email</Label>
                  <Input
                    id="paypal-email"
                    type="email"
                    placeholder="your@paypal.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bank Transfer Option */}
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50">
            <RadioGroupItem value="BANK_TRANSFER" id="bank-transfer" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="bank-transfer" className="flex items-center cursor-pointer">
                  <Building2 className="w-5 h-5 mr-2 text-slate-600" />
                  <span className="font-semibold">Bank Transfer</span>
                </Label>
                <Badge variant="outline">Manual Processing</Badge>
              </div>
              <p className="text-sm text-slate-600">
                Bank transfers are processed manually. Contact support to set up bank transfer details.
              </p>
            </div>
          </div>
        </RadioGroup>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedMethod(paymentMethods?.preferredMethod || 'PAYPAL');
              setPaypalEmail(paymentMethods?.paypalEmail || '');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
