import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, BookOpen, BarChart3, ChevronDown, Menu, X, Settings, ExternalLink, MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
// Logo import removed for build compatibility
import UserProfileDropdown from "@/components/user-profile-dropdown";
import LauraAssistant from "@/components/laura-assistant";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'LIFETIME';
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
}

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Get current user data to check admin access
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const isMoreMenuActive = ["/admin", "/markdown-editor", "/learning-path", "/operations", "/crm", "/analytics"].some(path => 
    location === path || location.startsWith(path)
  );

  const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
    const isActive = location === href || location.startsWith(href);
    return (
      <Link href={href} onClick={onClick}>
        <a className={`block px-4 py-3.5 text-base font-medium transition-colors rounded-lg min-h-[48px] flex items-center touch-manipulation ${
          isActive 
            ? "text-slate-900 bg-slate-100 font-semibold" 
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100"
        }`}>
          {children}
        </a>
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8 flex-1 min-w-0">
            <Link href="/" data-testid="link-home">
              <a className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                <img 
                  src="/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png" 
                  alt="Professional Diver - Diver Well Training" 
                  className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg object-contain flex-shrink-0"
                  style={{ display: 'block' }}
                />
                <div className="hidden sm:block">
                  <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-tight">Professional Diver</h1>
                  <p className="text-xs text-slate-500 leading-tight">Diver Well Training</p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-sm font-bold text-slate-900 leading-tight">Diver Well</h1>
                </div>
              </a>
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/dashboard" data-testid="link-dashboard">
                <a className={`font-medium transition-colors ${
                  location === "/dashboard" 
                    ? "text-slate-900" 
                    : "text-slate-600 hover:text-slate-900"
                }`}>
                  Professional Exams
                </a>
              </Link>
              <Link href="/tracks" data-testid="link-tracks">
                <a className={`font-medium transition-colors ${
                  location === "/tracks" 
                    ? "text-slate-900" 
                    : "text-slate-600 hover:text-slate-900"
                }`}>
                  Study Materials
                </a>
              </Link>
              
              {/* More Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`font-medium transition-colors px-0 h-auto ${
                      isMoreMenuActive 
                        ? "text-slate-900" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    data-testid="button-more-menu"
                  >
                    More <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/crm" data-testid="link-crm">
                      <a className="w-full flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>CRM</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/analytics" data-testid="link-analytics">
                      <a className="w-full flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>Analytics</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" data-testid="link-admin">
                      <a className="w-full flex items-center space-x-2">
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Admin</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/markdown-editor" data-testid="link-markdown-editor">
                      <a className="w-full flex items-center space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Content Editor</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/learning-path" data-testid="link-learning-path">
                      <a className="w-full flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                        </svg>
                        <span>AI Learning Path</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/operations" data-testid="link-operations">
                      <a className="w-full flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                        </svg>
                        <span>Operations</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  
                  <div className="border-t my-2"></div>
                  
                  {/* Platform Links */}
                  <DropdownMenuItem asChild>
                    <Link href="/tracks" data-testid="link-tracks-menu">
                      <a className="w-full flex items-center space-x-2">
                        <BookOpen className="w-4 h-4" />
                        <span>Learning Tracks</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  {/* Removed Free Trial and Login - these are for public access, not dashboard users */}
                  
                  <div className="border-t my-2"></div>
                  
                  {/* Legal Links */}
                  <DropdownMenuItem asChild>
                    <Link href="/privacy" data-testid="link-privacy">
                      <a className="w-full flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                        <span>Privacy Policy</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/terms" data-testid="link-terms">
                      <a className="w-full flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span>Terms of Service</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button 
                      onClick={() => {
                        const subject = encodeURIComponent('Data Request - Professional Diver Platform');
                        const body = encodeURIComponent('Please specify what data you would like to request:\n\n1. Account information\n2. Learning progress data\n3. Billing history\n4. Account deletion\n5. Data export\n\nPlease provide details about your request:');
                        window.open(`mailto:privacy@diverwell.app?subject=${subject}&body=${body}`, '_blank');
                      }}
                      className="w-full flex items-center space-x-2 text-left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <span>Data Requests</span>
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={isAdmin ? "/chat/laura" : "/chat/support"} data-testid="link-support-laura">
                      <a className="w-full flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>{isAdmin ? "Laura Oracle (Admin)" : "Support (Chat with Laura)"}</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Operations Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`font-medium transition-colors px-0 h-auto ${
                      location === "/operations" || location === "/chat/diver-well"
                        ? "text-slate-900" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    data-testid="button-operations-menu"
                  >
                    Operations <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase">
                    Diver Well AI Consultant
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/chat/diver-well" data-testid="link-diver-well-platform">
                      <a className="w-full flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4 text-teal-600" />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">Diver Well AI Consultant</div>
                          <div className="text-xs text-slate-500">Platform Integrated (Recommended)</div>
                        </div>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      onClick={() => {
                        window.open('https://chatgpt.com/g/g-6897d42d3ba48191b48883a4839c09bf-diver-well-commercial-diver-ai-consultant', '_blank');
                      }}
                      className="w-full flex items-center space-x-2 text-left"
                      data-testid="link-diver-well-openai"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">Diver Well AI Consultant</div>
                        <div className="text-xs text-slate-500">OpenAI GPT Version</div>
                      </div>
                    </button>
                  </DropdownMenuItem>
                  
                  <div className="border-t my-2"></div>
                  
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase">
                    Operational Tools
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/operations" data-testid="link-operations-center">
                      <a className="w-full flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span>Operations Center</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Support Menu Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`font-medium transition-colors px-0 h-auto ${
                      location === "/chat/support" || location === "/chat/laura"
                        ? "text-slate-900" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    data-testid="button-support-menu"
                  >
                    Support <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href={isAdmin ? "/chat/laura" : "/chat/support"} data-testid="link-support-laura-menu">
                      <a className="w-full flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4" />
                        <span>{isAdmin ? "Laura Oracle (Admin)" : "Laura AI Assistant"}</span>
                      </a>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-12 w-12 mr-1 min-h-[48px] min-w-[48px]">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-[400px] p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
                  <SheetTitle className="flex items-center space-x-3">
                    <img 
                      src="/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png" 
                      alt="Professional Diver" 
                      className="w-12 h-12 rounded-lg object-contain flex-shrink-0"
                      style={{ display: 'block' }}
                    />
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-slate-900 leading-tight">Professional Diver</div>
                      <div className="text-xs text-slate-500 leading-tight">Diver Well Training</div>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-0 px-4 py-6 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
                  <NavLink href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    Professional Exams
                  </NavLink>
                  <NavLink href="/tracks" onClick={() => setMobileMenuOpen(false)}>
                    Study Materials
                  </NavLink>
                  <NavLink href="/crm" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>CRM</span>
                    </div>
                  </NavLink>
                  <NavLink href="/analytics" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics</span>
                    </div>
                  </NavLink>
                  {isAdmin && (
                    <NavLink href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center space-x-2">
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Admin</span>
                      </div>
                    </NavLink>
                  )}
                  <NavLink href="/markdown-editor" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Content Editor</span>
                    </div>
                  </NavLink>
                  <NavLink href="/learning-path" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                      </svg>
                      <span>AI Learning Path</span>
                    </div>
                  </NavLink>
                  <NavLink href="/operations" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                      </svg>
                      <span>Operations</span>
                    </div>
                  </NavLink>
                  <div className="border-t my-4"></div>
                  <NavLink href="/affiliate" onClick={() => setMobileMenuOpen(false)}>
                    Partners
                  </NavLink>
                  <div className="border-t my-4 mx-4"></div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operations</div>
                  <NavLink href="/chat/diver-well" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-teal-600" />
                      <div>
                        <div className="font-medium">Diver Well AI Consultant</div>
                        <div className="text-xs text-slate-500">Platform Integrated</div>
                      </div>
                    </div>
                  </NavLink>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.open('https://chatgpt.com/g/g-6897d42d3ba48191b48883a4839c09bf-diver-well-commercial-diver-ai-consultant', '_blank');
                    }}
                    className="block w-full text-left px-4 py-3 text-base font-medium transition-colors rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  >
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-medium">Diver Well AI Consultant</div>
                        <div className="text-xs text-slate-500">OpenAI GPT Version</div>
                      </div>
                    </div>
                  </button>
                  <NavLink href="/operations" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Operations Center</span>
                    </div>
                  </NavLink>
                  <div className="border-t my-4 mx-4"></div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Support</div>
                  <NavLink href={isAdmin ? "/chat/laura" : "/chat/support"} onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>{isAdmin ? "Laura Oracle" : "Support"}</span>
                    </div>
                  </NavLink>
                  <div className="border-t my-4"></div>
                  <NavLink href="/privacy" onClick={() => setMobileMenuOpen(false)}>
                    Privacy Policy
                  </NavLink>
                  <NavLink href="/terms" onClick={() => setMobileMenuOpen(false)}>
                    Terms of Service
                  </NavLink>
                </nav>
              </SheetContent>
            </Sheet>
            
            <Link href="/affiliate" data-testid="link-partners" className="hidden md:block">
              <a className="text-slate-600 hover:text-slate-900 font-medium">
                Partners
              </a>
            </Link>
            {/* Removed duplicate AI Consultant - Laura handles all AI assistance */}
            <UserProfileDropdown />
          </div>
          
          {/* Fixed position Laura Assistant */}
          <LauraAssistant />
        </div>
      </div>
    </nav>
  );
}