import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Mail, CheckCircle, AlertCircle } from "lucide-react";
import type { Invite } from "@shared/schema";

export default function Invite() {
  const [, params] = useRoute("/invite/:token");
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();

  const { data: invite, isLoading, error } = useQuery<Invite>({
    queryKey: ["/api/invites", params?.token],
    enabled: !!params?.token,
  });

  const requestMagicLinkMutation = useMutation({
    mutationFn: async (emailData: { email: string; token: string }) => {
      // This would integrate with Auth.js to send a magic link
      return apiRequest("POST", "/api/auth/magic-link", emailData);
    },
    onSuccess: () => {
      setIsRequesting(true);
      toast({
        title: "Magic Link Sent!",
        description: "Check your email for a sign-in link.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send magic link. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRequestMagicLink = () => {
    if (!email || !params?.token) return;
    requestMagicLinkMutation.mutate({
      email,
      token: params.token,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2 items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-invalid-invite">
                Invalid Invite
              </h1>
            </div>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation link is invalid, expired, or has already been used.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setLocation('/')}
              className="w-full"
              data-testid="button-home"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.usedAt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2 items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-invite-used">
                Invite Already Used
              </h1>
            </div>
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has already been accepted. Please sign in to access your account.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setLocation('/signin')}
              className="w-full"
              data-testid="button-signin"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (new Date() > new Date(invite.expiresAt)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2 items-center">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <h1 className="text-2xl font-bold text-gray-900" data-testid="text-invite-expired">
                Invite Expired
              </h1>
            </div>
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has expired. Please contact an administrator for a new invitation.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setLocation('/')}
              className="w-full"
              data-testid="button-home-expired"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900" data-testid="text-welcome">
            Welcome to Diver Well Training
          </CardTitle>
          <CardDescription className="text-slate-600">
            You've been invited to join our professional diving education platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Alert className="border-primary-200 bg-primary-50">
              <Mail className="h-4 w-4 text-primary-600" />
              <AlertDescription className="text-primary-700">
                <strong>Invited Email:</strong> {invite.email}
              </AlertDescription>
            </Alert>
          </div>

          {isRequesting ? (
            <div className="text-center">
              <div className="mb-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900" data-testid="text-magic-link-sent">
                  Magic Link Sent!
                </h3>
                <p className="text-slate-600 mt-2">
                  Check your email for a sign-in link. The link will be valid for 15 minutes.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setIsRequesting(false)}
                className="w-full"
                data-testid="button-try-different-email"
              >
                Try Different Email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full"
                  data-testid="input-email"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter the email address where you received this invitation.
                </p>
              </div>

              <Button 
                onClick={handleRequestMagicLink}
                disabled={!email || requestMagicLinkMutation.isPending}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                data-testid="button-request-magic-link"
              >
                {requestMagicLinkMutation.isPending ? (
                  <>
                    <Mail className="w-4 h-4 mr-2 animate-spin" />
                    Sending Magic Link...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Request Magic Link
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-xs text-slate-500">
                  By continuing, you agree to our{" "}
                  <a href="#" className="text-primary-600 hover:text-primary-700">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary-600 hover:text-primary-700">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-slate-500">
              Need help?{" "}
              <a href="#" className="text-primary-600 hover:text-primary-700">
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
