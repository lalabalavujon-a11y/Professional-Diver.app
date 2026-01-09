import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCredentials, setIsCredentials] = useState(true);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Load remembered credentials on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
    if (rememberedPassword) {
      setPassword(rememberedPassword);
    }
  }, []);

  const credentialsSignInMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string; rememberMe: boolean }) => {
      try {
        const response = await apiRequest("POST", "/api/auth/credentials", credentials);
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || "Invalid credentials");
        }
        return data;
      } catch (error: any) {
        // Try to parse error message from response
        if (error.message && error.message.includes('401')) {
          throw new Error("Invalid email or password. Please try again.");
        }
        if (error.message && error.message.includes('500')) {
          throw new Error("Server error. Please try again later.");
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
        localStorage.setItem('userEmail', email); // For current session
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        localStorage.setItem('userEmail', email); // Still set for current session
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      // Redirect to dashboard using router (preserves scroll-to-top)
      // Force scroll to top before navigation
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      // Use router navigation instead of window.location.href
      setLocation('/dashboard');
    },
    onError: (error: any) => {
      console.error("Sign in error:", error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const magicLinkMutation = useMutation({
    mutationFn: async (emailData: { email: string }) => {
      const response = await apiRequest("POST", "/api/auth/magic-link", emailData);
      return response.json();
    },
    onSuccess: () => {
      setMagicLinkSent(true);
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

  const handleCredentialsSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    credentialsSignInMutation.mutate({ email, password, rememberMe });
  };

  const handleMagicLinkRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    magicLinkMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Link href="/">
              <a className="flex items-center justify-center space-x-3">
                <img 
                  src={diverWellLogo} 
                  alt="Professional Diver - Diver Well Training" 
                  className="w-12 h-12 rounded-lg"
                />
                <div>
                  <div className="text-lg font-bold text-slate-900">Professional Diver</div>
                  <div className="text-xs text-slate-500">Diver Well Training</div>
                </div>
              </a>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900" data-testid="text-signin-title">
            Sign In
          </CardTitle>
          <CardDescription className="text-slate-600">
            Access your diving education account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {magicLinkSent && !isCredentials ? (
            <div className="text-center">
              <div className="mb-4">
                <Mail className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900" data-testid="text-check-email">
                  Check Your Email
                </h3>
                <p className="text-slate-600 mt-2">
                  We sent a sign-in link to <strong>{email}</strong>. Click the link to access your account.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setMagicLinkSent(false)}
                className="w-full mb-2"
                data-testid="button-try-again"
              >
                Try Different Email
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsCredentials(true)}
                className="w-full text-sm"
                data-testid="button-use-password"
              >
                Use password instead
              </Button>
            </div>
          ) : (
            <>
              {/* Sign In Method Toggle */}
              <div className="flex border border-gray-200 rounded-lg mb-6" data-testid="signin-method-toggle">
                <button
                  onClick={() => setIsCredentials(true)}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg transition-colors ${
                    isCredentials
                      ? "bg-primary-500 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  data-testid="button-credentials"
                >
                  Password
                </button>
                <button
                  onClick={() => setIsCredentials(false)}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg transition-colors ${
                    !isCredentials
                      ? "bg-primary-500 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  data-testid="button-magic-link"
                >
                  Magic Link
                </button>
              </div>

              {/* Credentials Form */}
              {isCredentials ? (
                <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full"
                      data-testid="input-email"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full pr-10"
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      data-testid="checkbox-remember-me"
                    />
                    <label 
                      htmlFor="remember-me" 
                      className="text-sm font-medium text-slate-700 cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>

                  <Button 
                    type="submit"
                    disabled={!email || !password || credentialsSignInMutation.isPending}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                    data-testid="button-signin-credentials"
                  >
                    {credentialsSignInMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              ) : (
                /* Magic Link Form */
                <form onSubmit={handleMagicLinkRequest} className="space-y-4">
                  <div>
                    <label htmlFor="magic-email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <Input
                      id="magic-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full"
                      data-testid="input-magic-email"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      We'll send you a secure link to sign in without a password.
                    </p>
                  </div>

                  <Button 
                    type="submit"
                    disabled={!email || magicLinkMutation.isPending}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                    data-testid="button-request-magic-link"
                  >
                    {magicLinkMutation.isPending ? (
                      <>
                        <Mail className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Magic Link
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Footer Links */}
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <span className="text-slate-500">
                    Contact an administrator for an invitation.
                  </span>
                </p>
              </div>
            </>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <Link href="/dashboard">
              <a className="text-sm text-primary-600 hover:text-primary-700" data-testid="link-back-dashboard">
                ← Back to Dashboard
              </a>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
