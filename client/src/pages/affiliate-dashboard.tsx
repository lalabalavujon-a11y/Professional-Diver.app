import { useState } from "react";
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
  RefreshCw,
  CreditCard
} from "lucide-react";
import { Link } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import AffiliatePaymentMethod from "@/components/affiliate-payment-method";

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
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

  // Get user email for affiliate dashboard
  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  // Fetch affiliate dashboard data
  const { data: dashboardData, isLoading, refetch: refetchDashboard } = useQuery<DashboardData>({
    queryKey: ['/api/affiliate/dashboard', userEmail],
    queryFn: async () => {
      const response = await fetch(`/api/affiliate/dashboard?email=${encodeURIComponent(userEmail)}`);
      if (!response.ok) throw new Error('Failed to fetch affiliate dashboard');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch affiliate leaderboard
  const { data: leaderboard } = useQuery<any[]>({
    queryKey: ['/api/affiliate/leaderboard'],
    refetchInterval: 60000, // Refresh every minute
  });

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

  const handleRefreshReferralLink = async () => {
    try {
      await refetchDashboard();
      toast({
        title: "Refreshed!",
        description: "Referral link data has been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh referral link. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center" data-sidebar-content="true">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Loading affiliate dashboard...</p>
          </div>
        </div>
      </>
    );
  }

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
  const recentReferrals = dashboardData?.recentReferrals || [];
  const recentClicks = dashboardData?.recentClicks || [];

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Partner Dashboard
          </h1>
          <p className="text-lg text-slate-600">
            Earn 50% commission on every referral to Professional Diver platform
          </p>
        </div>

        {/* Referral Link Card */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600" />
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input 
                value={affiliate.referralLink || ''}
                readOnly
                className="font-mono text-sm"
                data-testid="input-referral-link"
              />
              <Button 
                onClick={handleRefreshReferralLink}
                variant="outline"
                data-testid="button-refresh-link"
                title="Refresh referral link"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button 
                onClick={copyReferralLink}
                variant={copiedLink ? "default" : "outline"}
                className={copiedLink ? "bg-green-600 hover:bg-green-700" : ""}
                data-testid="button-copy-link"
              >
                {copiedLink ? "Copied!" : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Share this link to earn 50% commission on Monthly ($25) and Annual ($250) subscriptions
            </p>
          </CardContent>
        </Card>

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
                  <p>• Commissions are paid monthly via Stripe Connect, PayPal, or bank transfer</p>
                  <p>• Minimum payout threshold: $50</p>
                  <p>• Payments processed on the 1st of each month</p>
                  <p>• Recurring commissions for active subscriptions</p>
                  <p>• Real-time tracking and transparent reporting</p>
                  <p>• Stripe Connect offers fastest, automatic payouts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </main>
      </div>
    </>
  );
}