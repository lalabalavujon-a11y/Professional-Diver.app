import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ExternalLink, 
  Copy, 
  Target,
  UserPlus
} from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/footer";
// Logo import removed for build compatibility

interface DashboardData {
  stats: {
    totalEarnings: number;
    monthlyEarnings: number;
    totalReferrals: number;
    conversionRate: number;
    monthlyReferrals: number;
    totalClicks: number;
    totalConversions: number;
    averageOrderValue: number;
  };
  affiliate: {
    referralLink: string;
    name: string;
    email: string;
    affiliateCode: string;
  };
  recentReferrals: any[];
  recentClicks: any[];
}

export default function AffiliateDashboard() {
  // ALL HOOKS MUST BE AT THE TOP - before any conditional returns
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();
  
  // State for creating new sub-affiliate
  const [newAffiliateName, setNewAffiliateName] = useState('');
  const [newAffiliateEmail, setNewAffiliateEmail] = useState('');

  // Get current user to determine access level
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail');
      if (!email) return null;
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  const userEmail = localStorage.getItem('userEmail') || '';

  // Fetch affiliate dashboard data - pass user email to get their own dashboard
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/affiliate/dashboard', userEmail],
    queryFn: async () => {
      const response = await fetch(`/api/affiliate/dashboard?email=${encodeURIComponent(userEmail)}`);
      if (!response.ok) throw new Error('Failed to load dashboard');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!userEmail, // Only fetch if we have user email
  });

  // Fetch affiliate leaderboard
  const { data: leaderboard } = useQuery<any[]>({
    queryKey: ['/api/affiliate/leaderboard'],
    refetchInterval: 60000, // Refresh every minute
  });

  const createSubAffiliateMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const userEmail = localStorage.getItem('userEmail') || '';
      // Get current affiliate to get the parent code
      const dashboardResponse = await fetch(`/api/affiliate/dashboard?email=${encodeURIComponent(userEmail)}`);
      const dashboard = await dashboardResponse.json();
      const parentAffiliateCode = dashboard?.affiliate?.affiliateCode;
      
      return apiRequest('POST', '/api/affiliate/create', {
        userId: `user-${data.email.replace('@', '-').replace(/\./g, '-')}`,
        name: data.name,
        email: data.email,
        parentAffiliateCode: parentAffiliateCode
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Sub-affiliate created successfully",
      });
      setNewAffiliateName('');
      setNewAffiliateEmail('');
      // Refetch dashboard data
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sub-affiliate",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubAffiliate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAffiliateName || !newAffiliateEmail) return;
    createSubAffiliateMutation.mutate({ name: newAffiliateName, email: newAffiliateEmail });
  };

  const copyReferralLink = async () => {
    if (dashboardData?.affiliate?.referralLink) {
      await navigator.clipboard.writeText(dashboardData.affiliate.referralLink);
      setCopiedLink(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // NOW we can do conditional returns after all hooks are declared
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  // Extract data after loading check
  const stats = dashboardData?.stats || {
    totalEarnings: 0,
    monthlyEarnings: 0,
    totalReferrals: 0,
    conversionRate: 0,
    monthlyReferrals: 0,
    totalClicks: 0,
    totalConversions: 0,
    averageOrderValue: 0
  };
  const affiliate = dashboardData?.affiliate || {
    referralLink: '',
    name: '',
    email: '',
    affiliateCode: ''
  };

  // Ensure referralLink is generated if affiliateCode exists but link is missing
  const finalAffiliate = {
    name: affiliate.name || userEmail.split('@')[0],
    email: affiliate.email || userEmail,
    affiliateCode: affiliate.affiliateCode || '',
    referralLink: affiliate.referralLink || (affiliate.affiliateCode ? `https://professionaldiver.app/?ref=${affiliate.affiliateCode}` : '')
  };
  const recentReferrals = dashboardData?.recentReferrals || [];
  const recentClicks = dashboardData?.recentClicks || [];
  const subAffiliates = (dashboardData as any)?.subAffiliates || [];
  
  // ALL affiliates can now manage their own sub-affiliates
  // This allows any user who becomes a partner to build their own affiliate network
  const canManageAffiliates = (dashboardData as any)?.canManageAffiliates !== false; // Default to true for all affiliates

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <a className="flex items-center space-x-3">
                <img 
                  src="/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png" 
                  alt="Professional Diver - Diver Well Training" 
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <div className="text-lg font-bold text-slate-900">Professional Diver</div>
                  <div className="text-xs text-slate-500">Affiliate Program</div>
                </div>
              </a>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <a className="text-slate-600 hover:text-slate-900 font-medium">
                  Dashboard
                </a>
              </Link>
              <Link href="/">
                <a className="text-slate-600 hover:text-slate-900 font-medium">
                  Home
                </a>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {affiliate.affiliateCode ? 'Partner Dashboard' : 'Become a Partner'}
          </h1>
          <p className="text-lg text-slate-600">
            {affiliate.affiliateCode 
              ? 'Earn 50% commission on every referral to Professional Diver platform'
              : 'Join our affiliate program and earn 50% commission on every referral. Build your own network of partners!'
            }
          </p>
          {!affiliate.affiliateCode && (
            <div className="mt-4">
              <Card className="bg-gradient-to-r from-blue-50 to-white border-blue-200">
                <CardContent className="p-6">
                  <p className="text-slate-700 mb-4">
                    As a partner, you'll get:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-slate-600 mb-4">
                    <li>50% commission on all referrals</li>
                    <li>Your own unique affiliate code and referral link</li>
                    <li>Ability to manage your own network of sub-affiliates</li>
                    <li>Real-time tracking of referrals and earnings</li>
                    <li>Monthly payouts via PayPal or bank transfer</li>
                  </ul>
                  <p className="text-sm text-slate-500 italic">
                    Your affiliate account will be created automatically when you access this page.
                    Refresh to see your dashboard!
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Referral Link Card - Always show if we have user email (will auto-create affiliate) */}
        {!isLoading && userEmail && (
          <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-blue-600" />
                Your Referral Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              {finalAffiliate.affiliateCode && finalAffiliate.referralLink ? (
                <>
                  <div className="flex gap-2">
                    <Input 
                      value={finalAffiliate.referralLink}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-referral-link"
                    />
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(finalAffiliate.referralLink);
                        setCopiedLink(true);
                        toast({
                          title: "Copied!",
                          description: "Referral link copied to clipboard",
                        });
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      variant={copiedLink ? "default" : "outline"}
                      className={copiedLink ? "bg-green-600 hover:bg-green-700" : ""}
                      data-testid="button-copy-link"
                    >
                      {copiedLink ? "Copied!" : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-slate-600">
                      Share this link to earn 50% commission on Monthly ($25) and Annual ($250) subscriptions
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Your Affiliate Code:</span>
                      <code className="bg-slate-100 px-2 py-1 rounded font-mono font-semibold text-slate-700">
                        {finalAffiliate.affiliateCode}
                      </code>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-600 mb-2">Creating your affiliate account...</p>
                  <p className="text-sm text-slate-500 mb-4">Your affiliate link will appear here once your account is ready.</p>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-2"
                    variant="outline"
                  >
                    Refresh to Load Link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${((stats.totalEarnings || 0) / 100).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Monthly Earnings</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${((stats.monthlyEarnings || 0) / 100).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Referrals</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalReferrals || 0}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.conversionRate || 0}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sub-Affiliates Management Section - For Partner Admins */}
        {canManageAffiliates && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Manage Your Affiliates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="list" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="list">My Affiliates ({subAffiliates.length})</TabsTrigger>
                    <TabsTrigger value="create">Create New Affiliate</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="list">
                    {subAffiliates.length > 0 ? (
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Affiliate Code</TableHead>
                                <TableHead>Referrals</TableHead>
                                <TableHead>Earnings</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subAffiliates.map((sub: any) => (
                                <TableRow key={sub.id}>
                                  <TableCell className="font-medium">{sub.name}</TableCell>
                                  <TableCell>{sub.email}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-mono">
                                      {sub.affiliateCode}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{sub.totalReferrals || 0}</TableCell>
                                  <TableCell className="text-green-600 font-medium">
                                    ${((sub.totalEarnings || 0) / 100).toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={sub.isActive ? "default" : "secondary"}>
                                      {sub.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-600">
                        <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                        <p>No sub-affiliates yet. Create your first affiliate to get started!</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="create">
                    <form onSubmit={handleCreateSubAffiliate} className="space-y-4">
                      <div>
                        <label htmlFor="affiliate-name" className="block text-sm font-medium text-slate-700 mb-2">
                          Affiliate Name
                        </label>
                        <Input
                          id="affiliate-name"
                          type="text"
                          value={newAffiliateName}
                          onChange={(e) => setNewAffiliateName(e.target.value)}
                          placeholder="Enter affiliate name"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="affiliate-email" className="block text-sm font-medium text-slate-700 mb-2">
                          Affiliate Email
                        </label>
                        <Input
                          id="affiliate-email"
                          type="email"
                          value={newAffiliateEmail}
                          onChange={(e) => setNewAffiliateEmail(e.target.value)}
                          placeholder="affiliate@example.com"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={createSubAffiliateMutation.isPending || !newAffiliateName || !newAffiliateEmail}
                        className="w-full"
                      >
                        {createSubAffiliateMutation.isPending ? "Creating..." : "Create Affiliate"}
                      </Button>
                      <p className="text-sm text-slate-500">
                        A new affiliate account will be created with a unique affiliate code. 
                        They'll be able to share their referral link and earn commissions.
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Monthly Referrals</span>
                <Badge variant="secondary">{stats.monthlyReferrals || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Clicks</span>
                <Badge variant="outline">{stats.totalClicks || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Conversions</span>
                <Badge variant="outline">{stats.totalConversions || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Avg. Order Value</span>
                <Badge variant="secondary">
                  ${((stats.averageOrderValue || 0) / 100).toFixed(2)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Commission Rate</span>
                <Badge variant="default" className="bg-green-600">50%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Partner Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(leaderboard || []).slice(0, 10).map((partner: any, index: number) => (
                  <div key={partner.affiliateCode} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{partner.name}</div>
                        <div className="text-sm text-slate-500">{partner.affiliateCode}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ${(partner.monthlyEarnings / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-500">
                        {partner.totalReferrals} referrals
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Tabs */}
        <Tabs defaultValue="referrals" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="referrals">Recent Referrals</TabsTrigger>
            <TabsTrigger value="clicks">Recent Clicks</TabsTrigger>
          </TabsList>

          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Recent Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                {recentReferrals.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentReferrals.map((referral: any) => (
                        <TableRow key={referral.id}>
                          <TableCell>
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{referral.referredUserId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{referral.subscriptionType}</Badge>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            ${(referral.commissionEarned / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={referral.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className={referral.status === 'ACTIVE' ? 'bg-green-600' : ''}
                            >
                              {referral.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No referrals yet. Start sharing your link to earn commissions!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clicks">
            <Card>
              <CardHeader>
                <CardTitle>Recent Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                {recentClicks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Landing Page</TableHead>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Converted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentClicks.map((click: any) => (
                        <TableRow key={click.id}>
                          <TableCell>
                            {new Date(click.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {click.landingPage || '/'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {click.referrerUrl ? new URL(click.referrerUrl).hostname : 'Direct'}
                          </TableCell>
                          <TableCell>
                            {click.converted ? (
                              <Badge className="bg-green-600">Converted</Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No clicks tracked yet. Share your referral link to start tracking!
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Commission Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Commission Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Subscription Plans</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium">Monthly Plan</div>
                      <div className="text-sm text-slate-600">$25/month</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">$12.50</div>
                      <div className="text-sm text-slate-600">50% commission</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium">Annual Plan</div>
                      <div className="text-sm text-slate-600">$250/year</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">$125.00</div>
                      <div className="text-sm text-slate-600">50% commission</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Payment Information</h4>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>• Commissions are paid monthly via PayPal or bank transfer</p>
                  <p>• Minimum payout threshold: $50</p>
                  <p>• Payments processed on the 1st of each month</p>
                  <p>• Recurring commissions for active subscriptions</p>
                  <p>• Real-time tracking and transparent reporting</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}