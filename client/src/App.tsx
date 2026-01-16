import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SkipLinks } from "@/components/ui/skip-links";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import TrackDetail from "@/pages/track-detail";
import LessonDetail from "@/pages/lesson-detail";
import Quiz from "@/pages/quiz";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminInvites from "@/pages/admin-invites";
import AdminLessonEditor from "@/pages/admin-lesson-editor";
import AdminBulkUpload from "@/pages/admin-bulk-upload";
import Analytics from "@/pages/analytics";
import CRMDashboard from "@/pages/crm-dashboard";
import EnterpriseHome from "@/pages/enterprise-home";
import Training from "@/pages/training";
import TrialSignup from "@/pages/trial-signup";
import Privacy from "@/pages/privacy";
import Contact from "@/pages/contact";
import AffiliateDashboard from "@/pages/affiliate-dashboard";
import MarkdownEditor from "@/pages/markdown-editor";
import Invite from "@/pages/invite";
import SignIn from "@/pages/signin";
import DemoUsers from "@/pages/demo-users";
import ProfileSettings from "@/pages/profile-settings";
import LearningPath from "@/pages/learning-path";
import ChatLaura from "@/pages/chat-laura";
import ChatDiverWell from "@/pages/chat-diver-well";
import Operations from "@/pages/operations";
import OperationsCalendarShared from "@/pages/operations-calendar-shared";
import Equipment from "@/pages/equipment";
import Tracks from "@/pages/tracks";
import Terms from "@/pages/terms";
import ProfessionalExams from "@/pages/professional-exams";
import ExamInterface from "@/pages/exam-interface";
import SrsReview from "@/pages/srs-review";
import AdminSrs from "@/pages/admin-srs";
import SupportTickets from "@/pages/support-tickets";
import SupportDocuments from "@/pages/support-documents";
import ComingSoon from "@/pages/coming-soon";
import FeatureRouteGuard from "@/components/feature-route-guard";

function Router() {
  const [location, setLocation] = useLocation();
  
  // Auto-login SUPER_ADMIN on app startup if credentials exist
  useEffect(() => {
    // Initialize SUPER_ADMIN credentials if they don't exist (first time setup)
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    const superAdminEmail = 'lalabalavu.jon@gmail.com';
    const superAdminPassword = 'Admin123';
    
    if (!rememberedEmail || !rememberedPassword) {
      // First time - set SUPER_ADMIN credentials
      console.log('[App] Initializing SUPER_ADMIN credentials');
      localStorage.setItem('rememberedEmail', superAdminEmail);
      localStorage.setItem('rememberedPassword', superAdminPassword);
      localStorage.setItem('userEmail', superAdminEmail);
      localStorage.setItem('isSuperAdmin', 'true');
    }
    
    // If on signin page and SUPER_ADMIN credentials exist, auto-redirect to dashboard
    if (location === '/signin' || location === '/login') {
      const currentUserEmail = localStorage.getItem('userEmail');
      const isSuperAdmin = localStorage.getItem('isSuperAdmin') === 'true';
      
      if (currentUserEmail && isSuperAdmin) {
        const normalizedEmail = currentUserEmail.toLowerCase().trim();
        const superAdminEmails = ['lalabalavu.jon@gmail.com', 'sephdee@hotmail.com'];
        if (superAdminEmails.includes(normalizedEmail)) {
          console.log('[App] SUPER_ADMIN detected on signin page, redirecting to dashboard');
          setLocation('/dashboard');
        }
      }
    }
  }, [location, setLocation]);
  
  // Aggressively scroll to top on route change and initial load
  useEffect(() => {
    // Force scroll to top immediately
    const forceScrollTop = () => {
      window.scrollTo(0, 0);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      // Also try setting scroll position on window object
      if (window.scrollY !== undefined) {
        try {
          (window as any).scrollY = 0;
        } catch {}
      }
      if (window.pageYOffset !== undefined) {
        try {
          (window as any).pageYOffset = 0;
        } catch {}
      }
    };
    
    // Immediate scroll
    forceScrollTop();
    
    // Also try after a microtask to catch any layout shifts
    Promise.resolve().then(() => {
      forceScrollTop();
    });
    
    // Also try after a short delay to catch any async rendering
    const timeoutId = setTimeout(() => {
      forceScrollTop();
    }, 0);
    
    // Also try after a longer delay to catch any late layout shifts
    const timeoutId2 = setTimeout(() => {
      forceScrollTop();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [location]);
  
  // Also scroll to top on mount
  useEffect(() => {
    const forceScrollTop = () => {
      window.scrollTo(0, 0);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    forceScrollTop();
    
    // Try again after a brief delay
    const timeoutId = setTimeout(forceScrollTop, 0);
    const timeoutId2 = setTimeout(forceScrollTop, 100);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, []);
  
  return (
    <Switch>
      <Route path="/">
        <FeatureRouteGuard
          featureId="enterprise_features"
          featureName="Enterprise Platform"
          featureDescription="Complete enterprise operations platform for commercial diving operations"
        >
          <EnterpriseHome />
        </FeatureRouteGuard>
      </Route>
      <Route path="/coming-soon" component={ComingSoon} />
      <Route path="/training" component={Training} />
      <Route path="/home" component={Home} />
      <Route path="/trial-signup" component={TrialSignup} />
      <Route path="/login" component={SignIn} />
      <Route path="/dashboard" component={ProfessionalExams} />
      <Route path="/exams" component={ProfessionalExams} />
      <Route path="/exams/:slug/start" component={ExamInterface} />
      <Route path="/exams/:slug/results" component={ExamInterface} />
      <Route path="/review" component={SrsReview} />
      <Route path="/tracks/:slug" component={TrackDetail} />
      <Route path="/lessons/:id" component={LessonDetail} />
      <Route path="/lessons/:id/quiz" component={Quiz} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/invites" component={AdminInvites} />
      <Route path="/admin/lessons/:id" component={AdminLessonEditor} />
      <Route path="/admin/bulk-upload" component={AdminBulkUpload} />
      <Route path="/admin/srs" component={AdminSrs} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/crm" component={CRMDashboard} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/contact" component={Contact} />
      <Route path="/support" component={SupportTickets} />
      <Route path="/support-tickets" component={SupportTickets} />
      <Route path="/support-documents" component={SupportDocuments} />
      <Route path="/affiliate" component={AffiliateDashboard} />
      <Route path="/markdown-editor" component={MarkdownEditor} />
      <Route path="/invite/:token" component={Invite} />
      <Route path="/signin" component={SignIn} />
      <Route path="/demo-users" component={DemoUsers} />
      <Route path="/profile-settings" component={ProfileSettings} />
      <Route path="/learning-path" component={LearningPath} />
      <Route path="/chat/laura" component={ChatLaura} />
      <Route path="/chat/diver-well" component={ChatDiverWell} />
      <Route path="/operations">
        <FeatureRouteGuard
          featureId="enterprise_features"
          featureName="Operations Center"
          featureDescription="Dive operations management and enterprise tools"
        >
          <Operations />
        </FeatureRouteGuard>
      </Route>
      <Route path="/operations-calendar/shared/:token">
        <FeatureRouteGuard
          featureId="enterprise_features"
          featureName="Operations Calendar"
          featureDescription="Shared operations calendar"
        >
          <OperationsCalendarShared />
        </FeatureRouteGuard>
      </Route>
      <Route path="/equipment">
        <FeatureRouteGuard
          featureId="enterprise_features"
          featureName="Equipment Management"
          featureDescription="Equipment tracking and management"
        >
          <Equipment />
        </FeatureRouteGuard>
      </Route>
      <Route path="/tracks" component={Tracks} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SkipLinks />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
