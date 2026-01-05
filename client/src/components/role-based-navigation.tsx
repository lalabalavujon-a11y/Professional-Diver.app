import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  BookOpen, 
  ChevronDown, 
  Users, 
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";
import UserProfileDropdown from "@/components/user-profile-dropdown";
import LauraAssistant from "@/components/laura-assistant";
import HeaderWidgetBar from "@/components/widgets/header-widget-bar";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'LIFETIME';
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
}

type SidebarMode = 'expanded' | 'collapsed' | 'hover';

export default function RoleBasedNavigation() {
  const [location] = useLocation();
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('expanded');
  const [isHovering, setIsHovering] = useState(false);

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

  // Load sidebar mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('sidebarMode') as SidebarMode;
    if (savedMode) {
      setSidebarMode(savedMode);
    }
  }, []);

  // Save sidebar mode to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarMode', sidebarMode);
  }, [sidebarMode]);

  // Determine user role and permissions
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isPaidUser = currentUser?.subscriptionType !== 'TRIAL' && currentUser?.subscriptionType !== undefined;

  // Check if current location is in admin section
  const isAdminSection = ["/admin", "/markdown-editor", "/operations", "/crm", "/analytics"].some(path => 
    location === path || location.startsWith(path)
  );

  // Check if current location is in training section
  const isTrainingSection = ["/tracks", "/lessons", "/dashboard", "/exams"].some(path => 
    location === path || location.startsWith(path)
  );

  // Check if current location is operations
  const isOperations = location === "/operations" || location.startsWith("/operations");

  // Check if current location is affiliate/partner
  const isAffiliate = location === "/affiliate" || location.startsWith("/affiliate");

  // Check if current location is support related
  const isSupport = ["/chat/laura", "/privacy", "/terms"].some(path => 
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

  // Determine sidebar open state based on mode
  const isSidebarOpen = sidebarMode === 'expanded' || (sidebarMode === 'hover' && isHovering);
  const collapsibleMode = sidebarMode === 'collapsed' ? 'icon' : sidebarMode === 'hover' ? 'icon' : 'offcanvas';

  // Update CSS variable for content spacing based on sidebar state
  useEffect(() => {
    const sidebarWidth = sidebarMode === 'expanded' || (sidebarMode === 'hover' && isHovering) 
      ? '16rem' 
      : sidebarMode === 'collapsed' 
        ? '3rem' 
        : '3rem';
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
    // Also update for collapsed state
    document.documentElement.style.setProperty('--sidebar-width-icon', '3rem');
  }, [sidebarMode, isHovering]);

  const handleSidebarModeChange = (mode: SidebarMode) => {
    setSidebarMode(mode);
    // Reset hovering state when changing modes
    if (mode !== 'hover') {
      setIsHovering(false);
    }
  };

  // Handle sidebar open state changes (e.g., from SidebarTrigger button)
  const handleOpenChange = (open: boolean) => {
    if (sidebarMode === 'hover') {
      // In hover mode, toggle the hovering state
      setIsHovering(open);
    } else if (sidebarMode === 'expanded') {
      // In expanded mode, clicking the trigger should switch to collapsed
      if (!open) {
        setSidebarMode('collapsed');
      }
    } else if (sidebarMode === 'collapsed') {
      // In collapsed mode, clicking the trigger should switch to expanded
      if (open) {
        setSidebarMode('expanded');
      }
    }
  };

  return (
    <SidebarProvider 
      defaultOpen={sidebarMode === 'expanded'}
      open={isSidebarOpen}
      onOpenChange={handleOpenChange}
    >
      <Sidebar 
        collapsible={collapsibleMode}
        onMouseEnter={() => {
          if (sidebarMode === 'hover') {
            setIsHovering(true);
          }
        }}
        onMouseLeave={() => {
          if (sidebarMode === 'hover') {
            setIsHovering(false);
          }
        }}
      >
        <SidebarHeader className="p-4">
          <Link href="/" data-testid="link-home" className="flex items-center space-x-3">
            <img 
              src={diverWellLogo} 
              alt="Professional Diver - Diver Well Training" 
              className="w-10 h-10 rounded-lg flex-shrink-0"
            />
            <div className="group-data-[collapsible=icon]:hidden">
              <h1 className="text-lg font-bold text-sidebar-foreground">Professional Diver</h1>
              <p className="text-xs text-sidebar-foreground/70">Diver Well Training</p>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Training Section - Visible to all users */}
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isTrainingSection}
                        tooltip="Training"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Training</span>
                        <ChevronDown className="ml-auto w-4 h-4" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {trainingNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem key={item.href} asChild>
                            <Link href={item.href} data-testid={`link-${item.href.replace('/', '')}`} className="w-full flex items-center space-x-2">
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>

                {/* Admin Section - Only visible to admins */}
                {isAdmin && (
                  <SidebarMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton 
                          isActive={isAdminSection}
                          tooltip="Admin"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin</span>
                          <ChevronDown className="ml-auto w-4 h-4" />
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {adminNavItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <DropdownMenuItem key={item.href} asChild>
                              <Link href={item.href} data-testid={`link-${item.href.replace('/', '')}`} className="w-full flex items-center space-x-2">
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                )}

                {/* Become a Partner Section - Visible to paid users */}
                {isPaidUser && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isAffiliate}
                      tooltip="Become a Partner"
                    >
                      <Link href="/affiliate" data-testid="link-partners">
                        <UserCheck className="w-4 h-4" />
                        <span>Become a Partner</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Operations Section - Only visible to admins */}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isOperations}
                      tooltip="Operations"
                    >
                      <Link href="/operations" data-testid="link-operations">
                        <Wrench className="w-4 h-4" />
                        <span>Operations</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {/* Support Section - Available to all users */}
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isSupport}
                        tooltip="Support"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Support</span>
                        <ChevronDown className="ml-auto w-4 h-4" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link href="/chat/laura" data-testid="link-support-laura" className="w-full flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Chat with Laura</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/privacy" data-testid="link-privacy" className="w-full flex items-center space-x-2">
                          <Shield className="w-4 h-4" />
                          <span>Privacy Policy</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/terms" data-testid="link-terms" className="w-full flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>Terms of Service</span>
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
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t">
          <div className="space-y-2">
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 mb-2 group-data-[collapsible=icon]:hidden">
              Sidebar control
            </SidebarGroupLabel>
            <RadioGroup 
              value={sidebarMode} 
              onValueChange={(value) => handleSidebarModeChange(value as SidebarMode)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 group-data-[collapsible=icon]:hidden">
                <RadioGroupItem value="expanded" id="expanded" />
                <Label htmlFor="expanded" className="text-sm cursor-pointer">
                  Expanded
                </Label>
              </div>
              <div className="flex items-center space-x-2 group-data-[collapsible=icon]:hidden">
                <RadioGroupItem value="collapsed" id="collapsed" />
                <Label htmlFor="collapsed" className="text-sm cursor-pointer">
                  Collapsed
                </Label>
              </div>
              <div className="flex items-center space-x-2 group-data-[collapsible=icon]:hidden">
                <RadioGroupItem value="hover" id="hover" />
                <Label htmlFor="hover" className="text-sm cursor-pointer">
                  Expand on hover
                </Label>
              </div>
            </RadioGroup>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        {/* Header - Fixed position to stay at top, CSS handles positioning */}
        <header 
          className="fixed top-0 right-0 z-50 flex min-h-20 shrink-0 items-center gap-3 md:gap-4 border-b bg-background/95 backdrop-blur-sm px-3 sm:px-4 py-2" 
          data-testid="navigation-header"
        >
          <SidebarTrigger className="-ml-1 h-9 w-9 md:h-10 md:w-10 flex-shrink-0" />
          <HeaderWidgetBar />
          <div className="flex items-center justify-end gap-2 md:gap-4 flex-shrink-0">
            <UserProfileDropdown />
          </div>
        </header>
      </SidebarInset>

      {/* Fixed position Laura Assistant */}
      <LauraAssistant />
    </SidebarProvider>
  );
}