import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  CreditCard,
  BookOpen,
  Share2,
  BarChart3,
  Settings,
  Download,
  QrCode,
  Sparkles
} from "lucide-react";
import { Link } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import AffiliatePaymentMethod from "@/components/affiliate-payment-method";
import AffiliateSharingGuide from "@/components/affiliate-sharing-guide";
import BackButton from "@/components/ui/back-button";

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
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
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

  const copyAffiliateCode = async () => {
    if (dashboardData?.affiliate?.affiliateCode) {
      await navigator.clipboard.writeText(dashboardData.affiliate.affiliateCode);
      setCopiedCode(true);
      toast({
        title: "Copied!",
        description: "Affiliate code copied to clipboard",
      });
      setTimeout(() => setCopiedCode(false), 2000);
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

  // Generate QR Code URL for the referral link
  const getQRCodeUrl = (link: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
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
          {/* Back Button */}
          <div className="mb-4">
            <BackButton fallbackRoute="/dashboard" label="Back to Dashboard" />
          </div>
          
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">
                Partner Dashboard
              </h1>
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Sparkles className="w-3 h-3 mr-1" />
                50% Commission
              </Badge>
            </div>
            <p className="text-lg text-slate-600">
              Earn 50% commission on every referral to Professional Diver Training platform
            </p>
          </div>

          {/* Main Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Referrals</span>
              </TabsTrigger>
              <TabsTrigger value="sharing" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">How to Share</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Resources</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              {/* Referral Link Card */}
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-blue-600" />
                    Your Referral Link
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 space-y-3">
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
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-slate-600">Affiliate Code:</span>
                        <Badge variant="secondary" className="font-mono text-sm">
                          {affiliate.affiliateCode}
                        </Badge>
                        <Button 
                          onClick={copyAffiliateCode}
                          variant="ghost"
                          size="sm"
                          className={copiedCode ? "text-green-600" : ""}
                        >
                          {copiedCode ? "Copied!" : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600">
                        Share this link to earn 50% commission on Monthly ($25) and Annual ($250) subscriptions
                      </p>
                    </div>
                    {affiliate.referralLink && (
                      <div className="flex flex-col items-center gap-2">
                        <img 
                          src={getQRCodeUrl(affiliate.referralLink)} 
                          alt="QR Code for referral link"
                          className="w-24 h-24 border rounded-lg"
                        />
                        <span className="text-xs text-slate-500">Scan to visit</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      {(leaderboard || []).slice(0, 10).map((partner: { affiliateCode: string; name: string; earnings: number; monthlyEarnings: number; totalReferrals: number }, index: number) => (
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
                      {(!leaderboard || leaderboard.length === 0) && (
                        <div className="text-center py-8 text-slate-500">
                          No leaderboard data yet. Be the first to make referrals!
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Commission Information */}
              <Card>
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
            </TabsContent>

            {/* REFERRALS TAB */}
            <TabsContent value="referrals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          {recentReferrals.map((referral) => (
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
                          {recentClicks.map((click: DashboardData["recentClicks"][0]) => (
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
              </div>
            </TabsContent>

            {/* HOW TO SHARE TAB */}
            <TabsContent value="sharing">
              <AffiliateSharingGuide 
                referralLink={affiliate.referralLink || ''} 
                affiliateCode={affiliate.affiliateCode || ''} 
              />
            </TabsContent>

            {/* RESOURCES TAB */}
            <TabsContent value="resources" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-600" />
                    Marketing Resources
                  </CardTitle>
                  <CardDescription>
                    Download ready-to-use marketing materials to promote your affiliate link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-6 text-center">
                        <QrCode className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                        <h4 className="font-semibold mb-2">QR Code</h4>
                        <p className="text-sm text-slate-600 mb-4">
                          Download your personalized QR code for business cards or flyers
                        </p>
                        {affiliate.referralLink && (
                          <a 
                            href={getQRCodeUrl(affiliate.referralLink)}
                            download={`affiliate-qr-${affiliate.affiliateCode}.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" className="w-full">
                              <Download className="w-4 h-4 mr-2" />
                              Download QR
                            </Button>
                          </a>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-dashed">
                      <CardContent className="p-6 text-center">
                        <ExternalLink className="w-12 h-12 mx-auto mb-3 text-green-600" />
                        <h4 className="font-semibold mb-2">Link Shortener</h4>
                        <p className="text-sm text-slate-600 mb-4">
                          Your affiliate link is already optimized for sharing
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={copyReferralLink}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-dashed">
                      <CardContent className="p-6 text-center">
                        <Share2 className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                        <h4 className="font-semibold mb-2">Email Signature</h4>
                        <p className="text-sm text-slate-600 mb-4">
                          Add to your email signature for passive promotion
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            const signature = `\n---\nAdvance your diving career: ${affiliate.referralLink}`;
                            navigator.clipboard.writeText(signature);
                            toast({
                              title: "Copied!",
                              description: "Email signature copied to clipboard",
                            });
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Signature
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Selling Points</CardTitle>
                  <CardDescription>
                    Use these points when sharing with potential customers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">For Individuals</h4>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">1</Badge>
                          AI-powered tutors that adapt to your learning style
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">2</Badge>
                          Industry-recognized certifications (NDT, Diver Medic, etc.)
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">3</Badge>
                          Interactive practice scenarios based on real situations
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">4</Badge>
                          Podcast lessons for learning on the go
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">5</Badge>
                          Progress tracking and completion certificates
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold">For Companies</h4>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">1</Badge>
                          Team training management dashboard
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">2</Badge>
                          Compliance tracking and reporting
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">3</Badge>
                          Custom learning paths for different roles
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">4</Badge>
                          Enterprise pricing for large teams
                        </li>
                        <li className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">5</Badge>
                          Integration with existing HR systems
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold mb-2">How does the 50% commission work?</h4>
                      <p className="text-sm text-slate-600">
                        You earn 50% of the first payment when someone signs up using your link. 
                        For monthly plans ($25), you earn $12.50. For annual plans ($250), you earn $125.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold mb-2">When do I get paid?</h4>
                      <p className="text-sm text-slate-600">
                        Commissions are paid monthly on the 1st of each month. Minimum payout threshold 
                        is $50. You can choose between Stripe Connect (fastest), PayPal, or bank transfer.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold mb-2">How long does the cookie last?</h4>
                      <p className="text-sm text-slate-600">
                        When someone clicks your affiliate link, they have 30 days to sign up and 
                        you'll still get credit for the referral, even if they don't sign up immediately.
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Can I refer myself or family members?</h4>
                      <p className="text-sm text-slate-600">
                        Self-referrals are not allowed. However, you can refer family members or 
                        colleagues as long as they are genuine users who will benefit from the platform.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings">
              <AffiliatePaymentMethod />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
