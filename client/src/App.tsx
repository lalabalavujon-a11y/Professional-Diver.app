import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import TrackDetail from "@/pages/track-detail";
import LessonDetail from "@/pages/lesson-detail";
import Quiz from "@/pages/quiz";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminInvites from "@/pages/admin-invites";
import AdminLessonEditor from "@/pages/admin-lesson-editor";
import Analytics from "@/pages/analytics";
import CRMDashboard from "@/pages/crm-dashboard";
import Landing from "@/pages/landing";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
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
      <Route path="/admin/srs" component={AdminSrs} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/crm" component={CRMDashboard} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/contact" component={Contact} />
      <Route path="/affiliate" component={AffiliateDashboard} />
      <Route path="/markdown-editor" component={MarkdownEditor} />
      <Route path="/invite/:token" component={Invite} />
      <Route path="/signin" component={SignIn} />
      <Route path="/demo-users" component={DemoUsers} />
      <Route path="/profile-settings" component={ProfileSettings} />
      <Route path="/learning-path" component={LearningPath} />
      <Route path="/chat/laura" component={ChatLaura} />
      <Route path="/chat/diver-well" component={ChatDiverWell} />
            <Route path="/operations" component={Operations} />
            <Route path="/operations-calendar/shared/:token" component={OperationsCalendarShared} />
            <Route path="/equipment" component={Equipment} />
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
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
