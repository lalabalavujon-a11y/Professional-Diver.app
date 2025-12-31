import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  BookOpen, 
  BarChart3, 
  ChevronDown, 
  Users, 
  Settings, 
  Shield, 
  FileText,
  Brain,
  Wrench,
  UserCheck,
  GraduationCap,
  TrendingUp,
  Repeat,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";
import UserProfileDropdown from "@/components/user-profile-dropdown";
import LauraAssistant from "@/components/laura-assistant";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'LIFETIME';
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
}

export default function RoleBasedNavigation() {
  const [location] = useLocation();

  // Get current user data
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Determine user role and permissions
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isLifetime = currentUser?.subscriptionType === 'LIFETIME' || currentUser?.role === 'LIFETIME';
  const isPaidUser = currentUser?.subscriptionType !== 'TRIAL' && currentUser?.subscriptionType !== undefined;

  // Check if current location is in admin section
  const isAdminSection = ["/admin", "/markdown-editor", "/operations", "/crm", "/analytics"].some(path => 
    location === path || location.startsWith(path)
  );

  // Check if current location is in training section
  const isTrainingSection = ["/tracks", "/lessons", "/dashboard", "/exams"].some(path => 
    location === path || location.startsWith(path)
  );

  // Admin Navigation Items
  const adminNavItems = [
    { href: "/admin", label: "Admin Dashboard", icon: Shield },
    { href: "/crm", label: "CRM", icon: Users },
    { href: "/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/operations", label: "Operations", icon: Wrench },
    { href: "/markdown-editor", label: "Content Editor", icon: FileText },
    { href: "/admin/srs", label: "SRS Admin", icon: Repeat },
  ];

  // Training Navigation Items (for all users)
  const trainingNavItems = [
    { href: "/dashboard", label: "Professional Exams", icon: GraduationCap },
    { href: "/tracks", label: "Learning Tracks", icon: BookOpen },
    { href: "/review", label: "Daily Review (SRS)", icon: Repeat },
    { href: "/learning-path", label: "AI Learning Path", icon: Brain },
  ];

  // Partner/Client Navigation Items
  const partnerNavItems = [
    { href: "/affiliate", label: "Partner Dashboard", icon: UserCheck },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" data-testid="link-home">
              <a className="flex items-center space-x-3">
                <img 
                  src={diverWellLogo} 
                  alt="Professional Diver - Diver Well Training" 
                  className="w-10 h-10 rounded-lg"
                />
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Professional Diver</h1>
                  <p className="text-xs text-slate-500">Diver Well Training</p>
                </div>
              </a>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              {/* Training Section - Visible to all users */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`font-medium transition-colors px-0 h-auto ${
                      isTrainingSection 
                        ? "text-slate-900" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    data-testid="button-training-menu"
                  >
                    Training <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {trainingNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} data-testid={`link-${item.href.replace('/', '')}`}>
                          <a className="w-full flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </a>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Admin Section - Only visible to admins */}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`font-medium transition-colors px-0 h-auto ${
                        isAdminSection 
                          ? "text-slate-900" 
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      data-testid="button-admin-menu"
                    >
                      Admin <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} data-testid={`link-${item.href.replace('/', '')}`}>
                            <a className="w-full flex items-center space-x-2">
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </a>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Partner Section - Visible to paid users */}
              {isPaidUser && (
                <Link href="/affiliate" data-testid="link-partners">
                  <a className={`font-medium transition-colors ${
                    location === "/affiliate" 
                      ? "text-slate-900" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}>
                    Partners
                  </a>
                </Link>
              )}

              {/* Support Menu - Available to all users */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="font-medium transition-colors px-0 h-auto text-slate-600 hover:text-slate-900"
                    data-testid="button-support-menu"
                  >
                    Support <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/chat/laura" data-testid="link-support-laura">
                      <a className="w-full flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat with Laura</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/privacy" data-testid="link-privacy">
                      <a className="w-full flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span>Privacy Policy</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/terms" data-testid="link-terms">
                      <a className="w-full flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Terms of Service</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <button 
                      onClick={() => {
                        const subject = encodeURIComponent('Data Request - Professional Diver Platform');
                        const body = encodeURIComponent('Please specify what data you would like to request:\n\n1. Account information\n2. Learning progress data\n3. Billing history\n4. Account deletion\n5. Data export\n\nPlease provide details about your request:');
                        window.open(`mailto:privacy@diverwell.app?subject=${subject}&body=${body}`, '_blank');
                      }}
                      className="w-full flex items-center space-x-2 text-left"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Data Requests</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <UserProfileDropdown />
          </div>
          
          {/* Fixed position Laura Assistant */}
          <LauraAssistant />
        </div>
      </div>
    </nav>
  );
}
