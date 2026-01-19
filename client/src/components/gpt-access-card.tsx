import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  ExternalLink, 
  Copy, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  Clock
} from "lucide-react";

interface GptAccessData {
  accessLink: string;
  expiresAt: string;
}

export default function GptAccessCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Get current user email
  const getEmail = () => {
    return localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
  };

  // Get current user to check subscription status
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = getEmail();
      const response = await fetch(`/api/users/current?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Get GPT access link
  const { data: gptAccess, isLoading, error } = useQuery<GptAccessData>({
    queryKey: ["/api/gpt-access/link"],
    queryFn: async () => {
      const email = getEmail();
      const response = await fetch(`/api/gpt-access/link?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('subscription_required');
        }
        throw new Error('Failed to fetch GPT access');
      }
      return response.json();
    },
    enabled: !!currentUser,
    retry: false,
  });

  // Regenerate token mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const email = getEmail();
      const response = await fetch(`/api/gpt-access/token?email=${encodeURIComponent(email)}`, {
        method: 'GET',
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('subscription_required');
        }
        throw new Error('Failed to regenerate token');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gpt-access/link"] });
      toast({
        title: "Token regenerated",
        description: "Your GPT access token has been regenerated successfully.",
      });
    },
    onError: (error: Error) => {
      if (error.message === 'subscription_required') {
        toast({
          title: "Subscription required",
          description: "You need an active subscription to access the Diver Well GPT.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to regenerate token. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "GPT access link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  // Check if subscription is active
  const isSubscriptionActive = 
    currentUser?.subscriptionStatus === 'ACTIVE' && 
    currentUser?.subscriptionType !== 'TRIAL';

  // Check if trial is still valid
  const isTrialValid = 
    currentUser?.subscriptionType === 'TRIAL' && 
    currentUser?.subscriptionStatus === 'ACTIVE' &&
    currentUser?.trialExpiresAt &&
    new Date(currentUser.trialExpiresAt) > new Date();

  const hasAccess = isSubscriptionActive || isTrialValid;

  // Format expiration date
  const formatExpirationDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Check if token is expiring soon (within 7 days)
  const isExpiringSoon = (dateString: string) => {
    try {
      const expirationDate = new Date(dateString);
      const now = new Date();
      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiration > 0 && daysUntilExpiration <= 7;
    } catch {
      return false;
    }
  };

  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Diver Well GPT Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Diver Well GPT Access
          </CardTitle>
          <CardDescription>
            Exclusive access to the Diver Well GPT for active subscribers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {currentUser.subscriptionStatus === 'CANCELLED' 
                ? "Your subscription has been cancelled. Please renew your subscription to regain access to the Diver Well GPT."
                : currentUser.subscriptionStatus === 'PAUSED'
                ? "Your subscription is currently paused. Please reactivate your subscription to access the Diver Well GPT."
                : "You need an active subscription to access the Diver Well GPT. Please subscribe to continue."
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Diver Well GPT Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error || !gptAccess) {
    const errorMessage = error instanceof Error && error.message === 'subscription_required'
      ? "You need an active subscription to access the Diver Well GPT."
      : "Failed to load GPT access. Please try again.";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Diver Well GPT Access
          </CardTitle>
          <CardDescription>
            Exclusive access to the Diver Well GPT for active subscribers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <Button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            className="mt-4 w-full"
            variant="outline"
          >
            {regenerateMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Access Link
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const expiringSoon = isExpiringSoon(gptAccess.expiresAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Diver Well GPT Access
        </CardTitle>
        <CardDescription>
          Exclusive access to the Diver Well GPT for active subscribers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {expiringSoon && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your access token expires soon. Consider regenerating it to extend access.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Access Status</span>
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Active
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Expires</span>
            <span className="text-sm text-muted-foreground">
              {formatExpirationDate(gptAccess.expiresAt)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Subscription</span>
            <Badge variant="outline">
              {currentUser.subscriptionType}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => window.open(gptAccess.accessLink, '_blank')}
            className="w-full"
            size="lg"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Diver Well GPT
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(gptAccess.accessLink)}
              variant="outline"
              className="flex-1"
              disabled={copied}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>

            <Button
              onClick={() => regenerateMutation.mutate()}
              variant="outline"
              className="flex-1"
              disabled={regenerateMutation.isPending}
            >
              {regenerateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Your access to the Diver Well GPT is linked to your subscription. 
            If you unsubscribe, access will be automatically revoked.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
