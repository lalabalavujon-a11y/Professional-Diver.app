import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
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
  HelpCircle,
  Waves,
  Search,
  Package,
  HeartPulse,
  Calendar,
  AlertTriangle,
  Keyboard
} from "lucide-react";
import { operationalApps } from "@/pages/operations";
import { supervisorContainers } from "@/components/dive-supervisor/DiveSupervisorControlApp";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CommandMenu, useCommandMenu } from "@/components/ui/command-menu";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";
import UserProfileDropdown from "@/components/user-profile-dropdown";
import LauraAssistant from "@/components/laura-assistant";
import HeaderWidgetBar from "@/components/widgets/header-widget-bar";
import { useFeaturePermissions } from "@/hooks/use-feature-permissions";
import RolePreviewDropdown from "@/components/role-preview-dropdown";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'LIFETIME' | 'AFFILIATE' | 'ENTERPRISE';
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
}

type SidebarMode = 'expanded' | 'collapsed' | 'hover';

export default function RoleBasedNavigation() {
  const [location] = useLocation();
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('expanded');
  const [isHovering, setIsHovering] = useState(false);
  const { open: commandMenuOpen, setOpen: setCommandMenuOpen } = useCommandMenu();

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

  // Get feature permissions
  const { hasFeature, isPreviewMode, previewRole } = useFeaturePermissions();

  // Check for preview mode in URL
  const urlParams = new URLSearchParams(window.location.search);
  const previewRoleFromUrl = urlParams.get("previewRole");
  const isInPreviewMode = !!previewRoleFromUrl;

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
  // In preview mode, use the preview role instead of actual role
  const effectiveRole = isInPreviewMode && previewRoleFromUrl ? previewRoleFromUrl : currentUser?.role;
  const isAdmin = effectiveRole === 'ADMIN' || effectiveRole === 'SUPER_ADMIN';
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN';
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

  // Admin Navigation Items with feature mapping
  const allAdminNavItems = [
    { href: "/admin", label: "Admin Dashboard", icon: Shield, featureId: "admin_dashboard" },
    { href: "/crm", label: "CRM", icon: Users, featureId: "crm" },
    { href: "/analytics", label: "Analytics", icon: TrendingUp, featureId: "analytics" },
    { href: "/operations", label: "Operations", icon: Wrench, featureId: "operations_center" },
    { href: "/markdown-editor", label: "Content Editor", icon: FileText, featureId: "content_editor" },
    { href: "/admin/srs", label: "SRS Admin", icon: Repeat, featureId: "srs_admin" },
  ];

  // Filter admin nav items based on feature permissions
  const adminNavItems = allAdminNavItems.filter((item) => {
    // SUPER_ADMIN always sees all admin features (unless in preview mode)
    if (isSuperAdmin && !isInPreviewMode) {
      return true;
    }
    
    // In preview mode, check permissions for the preview role
    if (isInPreviewMode) {
      return hasFeature(item.featureId);
    }
    
    // For other roles, check permissions
    // If permissions are still loading, show based on role
    // Admin/SUPER_ADMIN get all features while loading
    if (isLoading) {
      return isAdmin || isSuperAdmin;
    }
    
    // Normal mode - check user's actual permissions
    // If permission check fails or returns false, fall back to role check for admins
    const hasPermission = hasFeature(item.featureId);
    if (!hasPermission && (isAdmin || isSuperAdmin)) {
      // For admins, if permission system isn't working, show all features
      return true;
    }
    return hasPermission;
  });

  // Check if user has any admin features (to show Admin section)
  const hasAdminFeatures = adminNavItems.length > 0;

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
                {/* Admin Section - Visible to all users, filtered by permissions */}
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isAdminSection}
                        tooltip="Admin"
                      >
                        <Shield className="w-4 h-4" />
                        <span>
                          Admin
                          {effectiveRole && (
                            <span className="ml-2 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                              ({effectiveRole === 'SUPER_ADMIN' ? 'Super Admin' : 
                                effectiveRole === 'ADMIN' ? 'Admin' : 
                                effectiveRole === 'AFFILIATE' ? 'Partner Admin' : 
                                effectiveRole === 'ENTERPRISE' ? 'Enterprise' : 
                                'User'})
                            </span>
                          )}
                        </span>
                        <ChevronDown className="ml-auto w-4 h-4" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {adminNavItems.length > 0 ? (
                        adminNavItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <DropdownMenuItem 
                              key={item.href} 
                              asChild
                              disabled={isInPreviewMode}
                            >
                              <Link 
                                href={item.href} 
                                data-testid={`link-${item.href.replace('/', '')}`} 
                                className="w-full flex items-center space-x-2"
                                onClick={(e) => {
                                  if (isInPreviewMode) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })
                      ) : (
                        <DropdownMenuItem disabled className="text-slate-500">
                          No admin features available
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>

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

                {/* Operations Section - Visible to all users with all features */}
                <SidebarMenuItem>
                    <Collapsible className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                          isActive={isOperations}
                          tooltip="Operations"
                        >
                          <Wrench className="w-4 h-4" />
                          <span>Operations</span>
                          <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={location === "/operations"}>
                              <Link href="/operations" data-testid="link-operations-center">
                                <Wrench className="w-4 h-4" />
                                <span>Operations Center</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={location.includes("/operations") && new URLSearchParams(window.location.search).get("app") === "calendar"}>
                              <Link href="/operations?app=calendar">
                                <Calendar className="w-4 h-4" />
                                <span>Calendar</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                          {operationalApps.map((app) => {
                            // Get icon component based on app id
                            const getIcon = () => {
                              switch (app.id) {
                                case "diver-well":
                                  return <Waves className="w-4 h-4" />;
                                case "dive-supervisor":
                                  return <Shield className="w-4 h-4" />;
                                case "ndt-inspector":
                                  return <Search className="w-4 h-4" />;
                                case "equipment-manager":
                                  return <Package className="w-4 h-4" />;
                                case "med-ops":
                                case "dmt-med-ops":
                                  return <HeartPulse className="w-4 h-4" />;
                                default:
                                  return <Wrench className="w-4 h-4" />;
                              }
                            };
                            
                            if (app.id === "dive-supervisor") {
                              return (
                                <SidebarMenuSubItem key={app.id}>
                                  <Collapsible className="group/nested-collapsible">
                                    <div className="flex items-center">
                                      <SidebarMenuSubButton asChild className="flex-1">
                                        <Link href={`/operations?app=${app.id}`}>
                                          {getIcon()}
                                          <span>{app.title}</span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                      <CollapsibleTrigger asChild>
                                        <SidebarMenuSubButton className="w-8 p-0">
                                          <ChevronRight className="w-4 h-4 transition-transform duration-200 group-data-[state=open]/nested-collapsible:rotate-90" />
                                        </SidebarMenuSubButton>
                                      </CollapsibleTrigger>
                                    </div>
                                    <CollapsibleContent>
                                      <SidebarMenuSub>
                                        {supervisorContainers.map((container) => {
                                          const ContainerIcon = container.icon;
                                          const isContainerActive = location.includes("/operations") && 
                                            new URLSearchParams(window.location.search).get("app") === "dive-supervisor" &&
                                            new URLSearchParams(window.location.search).get("container") === container.id;
                                          return (
                                            <SidebarMenuSubItem key={container.id}>
                                              <SidebarMenuSubButton asChild isActive={isContainerActive} size="sm">
                                                <Link href={`/operations?app=dive-supervisor&container=${container.id}`}>
                                                  <ContainerIcon className="w-4 h-4" />
                                                  <span>{container.title}</span>
                                                </Link>
                                              </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                          );
                                        })}
                                      </SidebarMenuSub>
                                    </CollapsibleContent>
                                  </Collapsible>
                                </SidebarMenuSubItem>
                              );
                            }
                            
                            const isAppActive = location.includes("/operations") && 
                              new URLSearchParams(window.location.search).get("app") === app.id;
                            
                            return (
                              <SidebarMenuSubItem key={app.id}>
                                <SidebarMenuSubButton asChild isActive={isAppActive}>
                                  <Link href={`/operations?app=${app.id}`}>
                                    {getIcon()}
                                    <span>{app.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>

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
            {/* Role Preview Dropdown - Only for SUPER_ADMIN */}
            {isSuperAdmin && !isInPreviewMode && (
              <div className="mb-3">
                <RolePreviewDropdown currentRole={effectiveRole || ""} />
              </div>
            )}
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
        {/* Preview Mode Banner */}
        {isInPreviewMode && previewRoleFromUrl && (
          <Alert className="m-4 mb-0 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              Preview Mode: Viewing as <strong>{previewRoleFromUrl === "AFFILIATE" ? "Partner Admin" : previewRoleFromUrl === "ENTERPRISE" ? "Enterprise User" : "User"}</strong>. Navigation is read-only.
            </AlertDescription>
          </Alert>
        )}
        {/* Header - Fixed position to stay at top, CSS handles positioning */}
        <header 
          className="fixed top-0 right-0 z-50 flex min-h-20 shrink-0 items-center gap-3 md:gap-4 border-b bg-background/95 backdrop-blur-sm px-3 sm:px-4 py-2" 
          data-testid="navigation-header"
        >
          <SidebarTrigger className="-ml-1 h-9 w-9 md:h-10 md:w-10 flex-shrink-0" />
          <HeaderWidgetBar />
          <div className="flex items-center justify-end gap-2 md:gap-4 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-muted-foreground"
              onClick={() => setCommandMenuOpen(true)}
              aria-label="Open command menu"
            >
              <Search className="h-4 w-4" />
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <UserProfileDropdown />
          </div>
        </header>
      </SidebarInset>

      {/* Command Menu */}
      <CommandMenu open={commandMenuOpen} onOpenChange={setCommandMenuOpen} />

      {/* Fixed position Laura Assistant */}
      <LauraAssistant />
    </SidebarProvider>
  );
}