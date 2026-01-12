import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import RoleBasedNavigation from "@/components/role-based-navigation";
import SupportDocumentsChatWidget from "@/components/support-documents-chat-widget";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, BookOpen, GraduationCap, Brain, Settings, CreditCard, Shield, HelpCircle, Terminal, MessageCircle, ChevronRight, ExternalLink, Play, FileText, Users, BarChart3, Calendar, Navigation, Stethoscope, Wrench, Package, Database, Smartphone, Globe, RefreshCw, Clock, AlertCircle } from "lucide-react";

interface DocumentationSection {
  id: string;
  category: string;
  title: string;
  content: string;
  subsections?: Array<{ title: string; content: string }>;
  relatedLinks?: Array<{ label: string; href: string }>;
  keywords: string[];
}

const documentationSections: DocumentationSection[] = [
  // Getting Started
  {
    id: 'platform-overview',
    category: 'Getting Started',
    title: 'Platform Overview',
    content: 'The Professional Diver Training Platform is a comprehensive learning management system designed for commercial diving professionals. The platform offers 9 specialized training tracks covering Non-Destructive Testing (NDT), Life Support Technician (LST), Assistant Life Support Technician (ALST), Dive Medical Technician (DMT), Commercial Supervisor, Saturation Diving, Underwater Welding, Hyperbaric Operations, and Air Diver Certification.',
    keywords: ['overview', 'platform', 'introduction', 'what is', 'about'],
    relatedLinks: [
      { label: 'Training Tracks', href: '/tracks' },
      { label: 'Start Free Trial', href: '/trial-signup' }
    ]
  },
  {
    id: 'account-setup',
    category: 'Getting Started',
    title: 'Account Setup',
    content: 'To create an account, visit the trial signup page and provide your email address, name, and password. You\'ll receive a confirmation email to verify your account. Once verified, you can log in and start exploring the platform. Your trial account gives you access to all features for a limited period.',
    keywords: ['account', 'setup', 'signup', 'register', 'create account', 'trial'],
    relatedLinks: [
      { label: 'Trial Signup', href: '/trial-signup' },
      { label: 'Login', href: '/login' }
    ]
  },
  {
    id: 'first-login',
    category: 'Getting Started',
    title: 'First Login Guide',
    content: 'After logging in for the first time, you\'ll be directed to your home dashboard. Take a moment to explore the navigation menu on the left side. Update your profile by clicking on your profile picture in the top right corner. Navigate to the Training section to view available tracks, or start with the Professional Exams dashboard to see certification options.',
    keywords: ['first login', 'getting started', 'dashboard', 'home', 'profile'],
    relatedLinks: [
      { label: 'Home Dashboard', href: '/home' },
      { label: 'Profile Settings', href: '/profile-settings' }
    ]
  },
  {
    id: 'profile-setup',
    category: 'Getting Started',
    title: 'Profile Setup',
    content: 'Your profile contains important information about your account. Access it by clicking your profile picture in the top right corner. You can update your name, email, profile picture, timezone preferences, and notification settings. Complete profiles help us provide better personalized recommendations and support.',
    keywords: ['profile', 'settings', 'preferences', 'account settings', 'user info'],
    relatedLinks: [
      { label: 'Profile Settings', href: '/profile-settings' }
    ]
  },
  // Learning Features
  {
    id: 'training-tracks',
    category: 'Learning Features',
    title: 'Training Tracks',
    content: 'The platform offers 9 comprehensive training tracks, each designed for specific professional diving roles. Each track contains multiple lessons with interactive content, quizzes, and practical exercises. Tracks are organized by difficulty level (Beginner, Intermediate, Advanced, Expert) and estimated completion time.',
    subsections: [
      {
        title: 'Available Tracks',
        content: '1. NDT Inspection & Testing\n2. Life Support Technician (LST)\n3. Assistant Life Support Technician (ALST)\n4. Dive Medical Technician (DMT)\n5. Commercial Dive Supervisor\n6. Saturation Diving\n7. Underwater Welding\n8. Hyperbaric Operations\n9. Air Diver Certification'
      },
      {
        title: 'Track Features',
        content: 'Each track includes: interactive lessons with markdown content, podcast audio support, PDF reference guides, Notebook LM integration, progress tracking, completion certificates, and AI tutor support.'
      }
    ],
    keywords: ['tracks', 'courses', 'training', 'lessons', 'curriculum', 'learning paths'],
    relatedLinks: [
      { label: 'View All Tracks', href: '/tracks' },
      { label: 'Learning Path', href: '/learning-path' }
    ]
  },
  {
    id: 'lessons-content',
    category: 'Learning Features',
    title: 'Lessons & Content',
    content: 'Lessons are the core learning units in each track. Each lesson contains markdown-formatted content with rich media support including videos, images, PDFs, and podcasts. Lessons have clear learning objectives and are designed to build upon each other sequentially.',
    subsections: [
      {
        title: 'Lesson Features',
        content: 'Interactive markdown content, podcast audio support (M4A format), PDF reference guides, Notebook LM integration for AI-powered learning assistance, estimated completion time, required vs. optional lessons, progress tracking, and completion certificates.'
      },
      {
        title: 'Accessing Lessons',
        content: 'Navigate to a track detail page to see all lessons in that track. Click on any lesson to view its content. Complete lessons to unlock subsequent content. Your progress is automatically saved as you work through lessons.'
      }
    ],
    keywords: ['lessons', 'content', 'learning', 'materials', 'courses', 'study'],
    relatedLinks: [
      { label: 'Browse Tracks', href: '/tracks' }
    ]
  },
  {
    id: 'quizzes-exams',
    category: 'Learning Features',
    title: 'Quizzes & Exams',
    content: 'Quizzes accompany most lessons to test your understanding. Professional exams are comprehensive assessments covering entire tracks. Quizzes have time limits and passing scores, while exams are more rigorous and may be required for certification.',
    subsections: [
      {
        title: 'Quiz Types',
        content: 'Practice Quizzes: Self-assessment with immediate feedback\nLesson Quizzes: Required to complete lessons\nExams: Comprehensive professional certification assessments'
      },
      {
        title: 'Taking Quizzes',
        content: 'Access quizzes from lesson pages. Read each question carefully, select your answer, and submit when complete. Results are shown immediately with explanations for incorrect answers. You can retake quizzes to improve your score.'
      },
      {
        title: 'Professional Exams',
        content: 'Exams are comprehensive assessments covering entire tracks. They have strict time limits and passing requirements. Exam results are saved and can be reviewed. Passing exams may be required for certification or professional recognition.'
      }
    ],
    keywords: ['quizzes', 'exams', 'tests', 'assessments', 'certification', 'questions'],
    relatedLinks: [
      { label: 'Professional Exams', href: '/exams' },
      { label: 'Dashboard', href: '/dashboard' }
    ]
  },
  {
    id: 'progress-tracking',
    category: 'Learning Features',
    title: 'Progress Tracking',
    content: 'Your progress is automatically tracked as you complete lessons, quizzes, and exams. The platform records completion rates, time spent, quiz scores, and overall track progress. View your progress dashboard to see detailed statistics and achievements.',
    keywords: ['progress', 'tracking', 'stats', 'statistics', 'completion', 'achievements'],
    relatedLinks: [
      { label: 'Home Dashboard', href: '/home' },
      { label: 'Professional Exams', href: '/exams' }
    ]
  },
  {
    id: 'spaced-repetition',
    category: 'Learning Features',
    title: 'Spaced Repetition System (SRS)',
    content: 'The Spaced Repetition System helps you retain information by scheduling review sessions at optimal intervals. Cards are scheduled based on your performance, with items you struggle with appearing more frequently. Regular review sessions improve long-term retention.',
    keywords: ['srs', 'spaced repetition', 'review', 'retention', 'flashcards', 'study'],
    relatedLinks: [
      { label: 'SRS Review', href: '/review' }
    ]
  },
  {
    id: 'learning-paths',
    category: 'Learning Features',
    title: 'AI-Generated Learning Paths',
    content: 'The platform uses AI to generate personalized learning paths based on your career goals, experience level, and available time. Learning paths recommend the optimal sequence of tracks and lessons to achieve your objectives efficiently.',
    keywords: ['learning path', 'ai', 'personalized', 'recommendations', 'goals', 'career'],
    relatedLinks: [
      { label: 'Learning Path', href: '/learning-path' },
      { label: 'Learning Path Suggestions', href: '/learning-path-suggestions' }
    ]
  },
  // AI Features
  {
    id: 'laura-oracle',
    category: 'AI Features',
    title: 'Laura Platform Oracle',
    content: 'Laura is the Platform Oracle AI Assistant with comprehensive knowledge of all platform features, operations, and administration. She can help with account questions, technical issues, feature guidance, and platform optimization. Laura operates from the LangSmith domain and continuously learns from platform interactions.',
    subsections: [
      {
        title: 'Capabilities',
        content: 'Platform administration guidance, support ticket handling, platform analytics, troubleshooting assistance, feature explanations, account management help, and system health monitoring.'
      },
      {
        title: 'Voice Features',
        content: 'Laura supports low-latency live voice via Gemini Live (native audio over WebSocket). You can toggle Live Voice on/off, talk hands-free, and stop audio instantly (barge-in style).'
      }
    ],
    keywords: ['laura', 'oracle', 'ai assistant', 'help', 'support', 'chat'],
    relatedLinks: [
      { label: 'Chat with Laura', href: '/chat/laura' }
    ]
  },
  {
    id: 'ai-tutors',
    category: 'AI Features',
    title: 'AI Tutors (9 Discipline Experts)',
    content: 'The platform features 9 specialized AI tutors, each an expert in their respective discipline. These tutors provide personalized guidance and answer questions related to their specific areas of expertise.',
    subsections: [
      {
        title: 'Available Tutors',
        content: 'Sarah (NDT) - Non-Destructive Testing and Inspection\nMaria (LST) - Life Support Technician\nElena (ALST) - Assistant Life Support Technician\nJames (DMT) - Dive Medical Technician\nDavid - Commercial Dive Supervisor\nMarcus - Saturation Diving Systems\nLisa - Underwater Welding Operations\nMichael (Hyperbaric) - Hyperbaric Operations\nMichael (Air Diving) - Air Diver Certification / Diving Physics'
      },
      {
        title: 'Using AI Tutors',
        content: 'AI tutors are automatically available when viewing lessons in their respective tracks. You can ask questions about course content, get explanations, request examples, and receive personalized guidance. Each tutor has comprehensive knowledge of their discipline.'
      }
    ],
    keywords: ['ai tutors', 'tutors', 'sarah', 'maria', 'elena', 'james', 'david', 'marcus', 'lisa', 'michael', 'help'],
    relatedLinks: [
      { label: 'Training Tracks', href: '/tracks' }
    ]
  },
  {
    id: 'diver-well',
    category: 'AI Features',
    title: 'Diver Well Operations Consultant',
    content: 'Diver Well is an AI Operations Consultant specializing in commercial diving operations. She provides expert guidance on dive planning, safety protocols, equipment selection, industry regulations, and operational best practices. Diver Well is ideal for dive supervisors and operations managers.',
    keywords: ['diver well', 'operations', 'consultant', 'dive planning', 'safety', 'operations'],
    relatedLinks: [
      { label: 'Chat with Diver Well', href: '/chat/diver-well' }
    ]
  },
  // Platform Features
  {
    id: 'operations-calendar',
    category: 'Platform Features',
    title: 'Operations Calendar',
    content: 'The Operations Calendar helps you schedule and track dive operations, inspections, maintenance, training sessions, and other activities. You can create calendar events, share calendars with team members, sync with external calendar systems, and set reminders.',
    keywords: ['calendar', 'operations', 'schedule', 'events', 'planning'],
    relatedLinks: [
      { label: 'Operations Calendar', href: '/operations' }
    ]
  },
  {
    id: 'navigation-widgets',
    category: 'Platform Features',
    title: 'Navigation Widgets',
    content: 'Navigation widgets provide real-time information essential for dive operations. Available widgets include GPS location tracking, weather data, tide information, moon phase indicators, AIS vessel tracking, and port information. Widgets can be customized and positioned on your dashboard.',
    subsections: [
      {
        title: 'Available Widgets',
        content: 'GPS Location: Track your current position\nWeather: Real-time weather conditions\nTides: Tide charts and predictions\nMoon Phase: Lunar cycle information\nNavigation: Waypoints and routes\nAIS: Vessel tracking data\nPorts: Port information database'
      }
    ],
    keywords: ['navigation', 'widgets', 'gps', 'weather', 'tides', 'location'],
    relatedLinks: [
      { label: 'Widgets', href: '/widgets' },
      { label: 'Operations', href: '/operations' }
    ]
  },
  {
    id: 'medical-facilities',
    category: 'Platform Features',
    title: 'Medical Facilities Directory',
    content: 'Access a comprehensive directory of medical facilities including A&E departments, critical care units, diving doctors, and hyperbaric chambers. Facilities are searchable by location and include contact information, emergency numbers, and specialized services.',
    keywords: ['medical', 'facilities', 'hospitals', 'hyperbaric', 'emergency', 'health'],
    relatedLinks: [
      { label: 'Operations', href: '/operations' }
    ]
  },
  {
    id: 'equipment-management',
    category: 'Platform Features',
    title: 'Equipment Management',
    content: 'Track and manage diving equipment including maintenance schedules, usage logs, inspection records, and equipment inventory. The system helps ensure equipment safety and compliance with maintenance requirements.',
    keywords: ['equipment', 'maintenance', 'tools', 'inventory', 'management'],
    relatedLinks: [
      { label: 'Equipment Dashboard', href: '/equipment' }
    ]
  },
  {
    id: 'crm-management',
    category: 'Platform Features',
    title: 'CRM & Client Management',
    content: 'The CRM system helps manage client relationships, track communications, manage subscriptions, and analyze client data. Features include client profiles, communication history, tags, notes, and HighLevel CRM integration via webhooks.',
    keywords: ['crm', 'clients', 'management', 'customers', 'contacts'],
    relatedLinks: [
      { label: 'CRM Dashboard', href: '/crm' }
    ]
  },
  // Account & Billing
  {
    id: 'subscription-types',
    category: 'Account & Billing',
    title: 'Subscription Types',
    content: 'The platform offers several subscription options: Trial (limited time access), Monthly (recurring monthly subscription), Annual (yearly subscription with savings), Lifetime (one-time payment for permanent access), Affiliate (for partners), and Enterprise (for organizations).',
    keywords: ['subscription', 'billing', 'plans', 'pricing', 'payment'],
    relatedLinks: [
      { label: 'Profile Settings', href: '/profile-settings' }
    ]
  },
  {
    id: 'trial-management',
    category: 'Account & Billing',
    title: 'Trial Management',
    content: 'Trial accounts provide full access to all platform features for a limited period. When your trial expires, you\'ll need to subscribe to continue accessing the platform. Check your trial expiration date in your profile settings.',
    keywords: ['trial', 'expiration', 'free trial', 'trial period'],
    relatedLinks: [
      { label: 'Profile Settings', href: '/profile-settings' },
      { label: 'Start Free Trial', href: '/trial-signup' }
    ]
  },
  {
    id: 'role-based-access',
    category: 'Account & Billing',
    title: 'Role-based Access',
    content: 'The platform uses role-based access control with the following roles: USER (standard user), ADMIN (administrative access), SUPER_ADMIN (full platform access), LIFETIME (lifetime subscriber), AFFILIATE (affiliate partner), and ENTERPRISE (enterprise organization). Each role has different permissions and features.',
    keywords: ['roles', 'permissions', 'access', 'user role', 'admin', 'privileges'],
    relatedLinks: [
      { label: 'Profile Settings', href: '/profile-settings' }
    ]
  },
  // Admin Features
  {
    id: 'user-management',
    category: 'Admin Features',
    title: 'User Management',
    content: 'Administrators can create, edit, and manage user accounts. Features include role assignment, subscription management, permission configuration, account activation/deactivation, and user analytics. Access the admin dashboard to manage users.',
    keywords: ['admin', 'users', 'management', 'accounts', 'administrator'],
    relatedLinks: [
      { label: 'Admin Dashboard', href: '/admin' }
    ]
  },
  {
    id: 'content-management',
    category: 'Admin Features',
    title: 'Content Management',
    content: 'Admin users can create and edit tracks, lessons, quizzes, and questions. The content editor supports markdown, media uploads, podcast integration, PDF attachments, and Notebook LM integration. Content can be published or saved as drafts.',
    keywords: ['content', 'editor', 'lessons', 'admin', 'create', 'edit'],
    relatedLinks: [
      { label: 'Admin Dashboard', href: '/admin' }
    ]
  },
  {
    id: 'analytics-dashboard',
    category: 'Admin Features',
    title: 'Analytics Dashboard',
    content: 'The analytics dashboard provides comprehensive platform metrics including user statistics, content performance, quiz analytics, exam results, revenue tracking, and system health. Analytics help administrators make data-driven decisions.',
    keywords: ['analytics', 'stats', 'metrics', 'dashboard', 'reports'],
    relatedLinks: [
      { label: 'Analytics', href: '/analytics' }
    ]
  },
  {
    id: 'invite-system',
    category: 'Admin Features',
    title: 'Invite System',
    content: 'Administrators can create invitation links to onboard new users. Invites can be customized with roles, expiration dates, and access permissions. Track invite usage and manage pending invitations from the admin dashboard.',
    keywords: ['invites', 'invitations', 'onboarding', 'admin'],
    relatedLinks: [
      { label: 'Admin Invites', href: '/admin/invites' }
    ]
  },
  // Support & Help
  {
    id: 'support-tickets',
    category: 'Support & Help',
    title: 'Creating Support Tickets',
    content: 'To create a support ticket, visit the Contact page or Support Tickets page. Fill out the form with your name, email, subject, message, and priority level. Support tickets are automatically assigned to the support team, and you\'ll receive email confirmations and responses.',
    keywords: ['support', 'tickets', 'help', 'contact', 'issues'],
    relatedLinks: [
      { label: 'Contact Support', href: '/contact' },
      { label: 'Support Tickets', href: '/support-tickets' }
    ]
  },
  {
    id: 'troubleshooting',
    category: 'Support & Help',
    title: 'Troubleshooting Common Issues',
    content: 'Common issues include login problems (check email/password, clear cookies), progress not saving (check internet connection, try refreshing), quiz errors (verify quiz exists, check browser console), and API errors (check server status, try again later). For detailed troubleshooting, chat with Laura.',
    keywords: ['troubleshooting', 'errors', 'issues', 'problems', 'fix', 'help'],
    relatedLinks: [
      { label: 'Chat with Laura', href: '/chat/laura' },
      { label: 'Support Tickets', href: '/support-tickets' }
    ]
  },
  // Technical Information
  {
    id: 'api-endpoints',
    category: 'Technical Information',
    title: 'API Endpoints Overview',
    content: 'The platform provides RESTful API endpoints for authentication, user management, content access, AI services, support tickets, CRM operations, and more. API documentation is available for developers. Key endpoints include /api/auth/*, /api/users/*, /api/tracks/*, /api/laura-oracle/*, and /api/support/*.',
    keywords: ['api', 'endpoints', 'developer', 'integration', 'technical'],
    relatedLinks: []
  },
  {
    id: 'mobile-app',
    category: 'Technical Information',
    title: 'Mobile App (iOS & Android)',
    content: 'The platform is available as native mobile apps for iOS and Android built with Capacitor. Mobile apps provide full feature parity with the web platform, offline access where possible, push notifications, and native device integration (camera, GPS, etc.).',
    keywords: ['mobile', 'app', 'ios', 'android', 'capacitor', 'native'],
    relatedLinks: []
  },
  {
    id: 'browser-requirements',
    category: 'Technical Information',
    title: 'Browser Requirements',
    content: 'The platform works best in modern browsers including Chrome (latest), Firefox (latest), Safari (latest), and Edge (latest). JavaScript must be enabled. Some features require modern browser APIs for audio playback, camera access, and geolocation.',
    keywords: ['browser', 'requirements', 'compatibility', 'technical'],
    relatedLinks: []
  },
  {
    id: 'data-privacy',
    category: 'Technical Information',
    title: 'Data Privacy & Security',
    content: 'The platform takes data privacy and security seriously. User data is encrypted in transit (HTTPS) and at rest. We comply with GDPR and other privacy regulations. Users can request their data, delete their accounts, and manage privacy preferences. See the Privacy Policy for detailed information.',
    keywords: ['privacy', 'security', 'data', 'gdpr', 'protection'],
    relatedLinks: [
      { label: 'Privacy Policy', href: '/privacy' }
    ]
  }
];

const categories = [
  { id: 'all', name: 'All Sections', icon: BookOpen },
  { id: 'Getting Started', name: 'Getting Started', icon: Play },
  { id: 'Learning Features', name: 'Learning Features', icon: GraduationCap },
  { id: 'AI Features', name: 'AI Features', icon: Brain },
  { id: 'Platform Features', name: 'Platform Features', icon: Settings },
  { id: 'Account & Billing', name: 'Account & Billing', icon: CreditCard },
  { id: 'Admin Features', name: 'Admin Features', icon: Shield },
  { id: 'Support & Help', name: 'Support & Help', icon: HelpCircle },
  { id: 'Technical Information', name: 'Technical Information', icon: Terminal }
];

const categoryIcons: Record<string, any> = {
  'Getting Started': Play,
  'Learning Features': GraduationCap,
  'AI Features': Brain,
  'Platform Features': Settings,
  'Account & Billing': CreditCard,
  'Admin Features': Shield,
  'Support & Help': HelpCircle,
  'Technical Information': Terminal
};

interface ApiDocumentationSection {
  id: string;
  sectionId: string;
  category: string;
  title: string;
  content: string;
  subsections?: Array<{ title: string; content: string }>;
  relatedLinks?: Array<{ label: string; href: string }>;
  keywords: string[];
  version?: number;
  lastUpdated?: string | Date;
  updatedBy?: string;
  changeType?: string;
  isActive?: boolean;
}

export default function SupportDocuments() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentSection, setCurrentSection] = useState<string>('');

  // Fetch documentation from API
  const { data: apiData, isLoading: isLoadingApi, error: apiError, refetch: refetchDocs } = useQuery<{
    success: boolean;
    sections: ApiDocumentationSection[];
    count: number;
  }>({
    queryKey: ['/api/support-documents/sections'],
    queryFn: async () => {
      const response = await fetch('/api/support-documents/sections');
      if (!response.ok) {
        throw new Error('Failed to fetch documentation');
      }
      return response.json();
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Use API data if available, otherwise fall back to static content
  const allSections = useMemo(() => {
    if (apiData?.sections && apiData.sections.length > 0) {
      // Convert API sections to match expected format
      return apiData.sections.map((section: ApiDocumentationSection) => ({
        id: section.sectionId || section.id,
        category: section.category,
        title: section.title,
        content: section.content,
        subsections: section.subsections || [],
        relatedLinks: section.relatedLinks || [],
        keywords: Array.isArray(section.keywords) ? section.keywords : [],
        lastUpdated: section.lastUpdated,
        updatedBy: section.updatedBy,
        version: section.version,
        changeType: section.changeType,
      }));
    }
    // Fallback to static content
    return documentationSections.map(section => ({
      ...section,
      lastUpdated: undefined,
      updatedBy: undefined,
      version: undefined,
    }));
  }, [apiData]);

  // Filter sections based on category and search
  const filteredSections = useMemo(() => {
    let filtered = allSections;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(section => section.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(section => {
        const matchesTitle = section.title.toLowerCase().includes(query);
        const matchesContent = section.content.toLowerCase().includes(query);
        const matchesKeywords = section.keywords.some(keyword => keyword.toLowerCase().includes(query));
        const matchesSubsections = section.subsections?.some(sub => 
          sub.title.toLowerCase().includes(query) || sub.content.toLowerCase().includes(query)
        );
        return matchesTitle || matchesContent || matchesKeywords || matchesSubsections;
      });
    }

    return filtered;
  }, [selectedCategory, searchQuery, allSections]);

  const handleSectionClick = (sectionId: string) => {
    setCurrentSection(sectionId);
    // Scroll to section (if needed)
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                  <BookOpen className="w-10 h-10 text-blue-600" />
                  Platform Support Documents
                </h1>
                <p className="text-xl text-slate-600 max-w-3xl">
                  Comprehensive documentation for all platform features, capabilities, and usage guides. 
                  Need help? Chat with Laura using the chat widget on the right.
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Category Navigation */}
            <div className="lg:col-span-3">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="p-4 space-y-1">
                      {categories.map((category) => {
                        const Icon = category.icon;
                        const count = category.id === 'all' 
                          ? documentationSections.length 
                          : documentationSections.filter(s => s.category === category.id).length;
                        
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category.id);
                              setCurrentSection('');
                            }}
                            className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                              selectedCategory === category.id
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{category.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {count}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9">
              {/* Loading State */}
              {isLoadingApi && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <RefreshCw className="w-8 h-8 mx-auto text-blue-600 mb-4 animate-spin" />
                    <p className="text-slate-600">Loading documentation...</p>
                  </CardContent>
                </Card>
              )}

              {/* Error State */}
              {apiError && !isLoadingApi && (
                <Card className="border-amber-200 bg-amber-50 mb-4">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900 mb-1">Using Static Documentation</h4>
                        <p className="text-sm text-amber-800 mb-3">
                          Unable to fetch live documentation. Showing cached content. Documentation may not reflect the latest changes.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetchDocs()}
                          className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isLoadingApi && filteredSections.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Search className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Results Found</h3>
                    <p className="text-slate-600 mb-4">
                      Try adjusting your search query or category filter.
                    </p>
                    <Button onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : !isLoadingApi ? (
                <div className="space-y-6">
                  {filteredSections.map((section) => {
                    const CategoryIcon = categoryIcons[section.category] || FileText;
                    return (
                      <Card 
                        key={section.id} 
                        id={section.id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CategoryIcon className="w-5 h-5 text-blue-600" />
                                <Badge variant="outline" className="text-xs">
                                  {section.category}
                                </Badge>
                              </div>
                              <CardTitle className="text-2xl mb-2">{section.title}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Last Updated Indicator */}
                              {section.lastUpdated && (
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Updated {new Date(section.lastUpdated).toLocaleDateString()}
                                    {section.updatedBy && section.updatedBy === 'laura' && (
                                      <Badge variant="outline" className="ml-2 text-xs bg-purple-50 text-purple-700 border-purple-200">
                                        by Laura
                                      </Badge>
                                    )}
                                  </span>
                                </div>
                              )}
                              {/* Recently Updated Badge */}
                              {section.lastUpdated && (
                                (() => {
                                  const updatedDate = new Date(section.lastUpdated);
                                  const daysSinceUpdate = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
                                  if (daysSinceUpdate < 7) {
                                    return (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        Recently Updated
                                      </Badge>
                                    );
                                  }
                                  return null;
                                })()
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSectionClick(section.id)}
                                className="flex items-center gap-1"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Ask Laura
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-slate max-w-none">
                            <p className="text-slate-700 mb-4 whitespace-pre-line">{section.content}</p>
                            
                            {section.subsections && section.subsections.length > 0 && (
                              <Accordion type="single" collapsible className="mb-4">
                                {section.subsections.map((subsection, idx) => (
                                  <AccordionItem key={idx} value={`subsection-${idx}`}>
                                    <AccordionTrigger className="text-left font-semibold">
                                      {subsection.title}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <p className="text-slate-700 whitespace-pre-line">{subsection.content}</p>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            )}

                            {section.relatedLinks && section.relatedLinks.length > 0 && (
                              <div className="mt-6 pt-6 border-t">
                                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                  <ExternalLink className="w-4 h-4" />
                                  Related Links
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {section.relatedLinks.map((link, idx) => (
                                    <Link key={idx} href={link.href}>
                                      <Button variant="outline" size="sm" className="text-sm">
                                        {link.label}
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                      </Button>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : null}

              {/* Results count */}
              {searchQuery && (
                <div className="mt-6 text-center text-slate-600">
                  Found {filteredSections.length} result{filteredSections.length !== 1 ? 's' : ''} for "{searchQuery}"
                </div>
              )}

              {/* Documentation Status Footer */}
              {apiData && !apiError && (
                <div className="mt-8 pt-6 border-t text-center text-sm text-slate-500">
                  <p>
                    Documentation is automatically updated by Laura Platform Oracle when platform changes are detected.
                    {apiData.count > 0 && ` Currently showing ${apiData.count} section${apiData.count !== 1 ? 's' : ''}.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Embedded Laura Chat Widget */}
      <SupportDocumentsChatWidget 
        currentSection={currentSection} 
        onSectionChange={setCurrentSection}
      />
    </>
  );
}

