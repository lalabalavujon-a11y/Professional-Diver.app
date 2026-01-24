import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Lightbulb,
  Rocket,
  TestTube,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Target,
  DollarSign,
  Timer,
  Layers,
  ChevronRight,
  ChevronDown,
  Settings2,
  Sparkles,
  Brain,
  Workflow
} from "lucide-react";
import { format } from "date-fns";

interface SmartBuildFeature {
  id: string;
  name: string;
  description: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  phase: "PLANNING" | "EXECUTION" | "TESTING" | "COMPLETE" | "ON_HOLD";
  order: number;
  planDetails?: string;
  executionNotes?: string;
  testCases: string[];
  testResults: { case: string; passed: boolean; notes?: string }[];
  testPassRate?: number;
  estimatedHours?: number;
  actualHours?: number;
  costEstimate?: number;
  actualCost?: number;
}

interface SmartBuildProject {
  id: string;
  name: string;
  description: string;
  targetPlatform: string;
  currentPhase: "PLANNING" | "EXECUTION" | "TESTING" | "COMPLETE" | "ON_HOLD";
  overallProgress: number;
  estimatedCost?: number;
  actualCost?: number;
  costSavings?: number;
  startDate?: string;
  targetDate?: string;
  features: SmartBuildFeature[];
}

const phaseConfig = {
  PLANNING: { icon: Lightbulb, color: "bg-yellow-500", label: "Plan Strategically" },
  EXECUTION: { icon: Rocket, color: "bg-blue-500", label: "Execute Precisely" },
  TESTING: { icon: TestTube, color: "bg-purple-500", label: "Test Meticulously" },
  COMPLETE: { icon: CheckCircle2, color: "bg-green-500", label: "Complete" },
  ON_HOLD: { icon: Pause, color: "bg-gray-500", label: "On Hold" },
};

const priorityConfig = {
  CRITICAL: { color: "bg-red-500 text-white", label: "Critical" },
  HIGH: { color: "bg-orange-500 text-white", label: "High" },
  MEDIUM: { color: "bg-yellow-500 text-black", label: "Medium" },
  LOW: { color: "bg-green-500 text-white", label: "Low" },
};

// Sample project data
const sampleProjects: SmartBuildProject[] = [
  {
    id: "1",
    name: "Professional Diver Training Platform",
    description: "Comprehensive AI-powered diving education platform with training tracks, certifications, and enterprise features.",
    targetPlatform: "web",
    currentPhase: "EXECUTION",
    overallProgress: 75,
    estimatedCost: 5000000, // $50,000
    actualCost: 3500000, // $35,000
    costSavings: 1500000, // $15,000 saved
    startDate: "2025-12-01T00:00:00Z",
    targetDate: "2026-03-01T00:00:00Z",
    features: [
      {
        id: "f1",
        name: "Learning Tracks System",
        description: "Complete learning tracks with lessons, quizzes, and progress tracking",
        priority: "CRITICAL",
        phase: "COMPLETE",
        order: 1,
        planDetails: "Design modular track system with AI tutors, progress tracking, and certification paths",
        executionNotes: "Implemented using React Query for caching, Drizzle ORM for data layer",
        testCases: ["Track creation", "Lesson completion", "Quiz functionality", "Progress tracking"],
        testResults: [
          { case: "Track creation", passed: true },
          { case: "Lesson completion", passed: true },
          { case: "Quiz functionality", passed: true },
          { case: "Progress tracking", passed: true },
        ],
        testPassRate: 100,
        estimatedHours: 40,
        actualHours: 35,
        costEstimate: 400000,
        actualCost: 350000,
      },
      {
        id: "f2",
        name: "AI Tutor Integration",
        description: "Diver Well AI tutors for each training track with contextual assistance",
        priority: "HIGH",
        phase: "COMPLETE",
        order: 2,
        planDetails: "Integrate OpenAI/Anthropic APIs with track-specific context and personality",
        executionNotes: "Unified under 'Diver Well' branding, implemented lazy loading for performance",
        testCases: ["AI response quality", "Context awareness", "Rate limiting", "Error handling"],
        testResults: [
          { case: "AI response quality", passed: true },
          { case: "Context awareness", passed: true },
          { case: "Rate limiting", passed: true },
          { case: "Error handling", passed: true },
        ],
        testPassRate: 100,
        estimatedHours: 30,
        actualHours: 28,
      },
      {
        id: "f3",
        name: "Enterprise Calendar System",
        description: "Multi-provider calendar integration with AI monitoring",
        priority: "HIGH",
        phase: "TESTING",
        order: 3,
        planDetails: "Support Google, Outlook, HighLevel, Calendly with conflict resolution and AI insights",
        executionNotes: "Implemented provider registry pattern, LangSmith tracking for AI operations",
        testCases: ["Google sync", "Outlook sync", "Conflict detection", "AI recommendations"],
        testResults: [
          { case: "Google sync", passed: true },
          { case: "Outlook sync", passed: true },
          { case: "Conflict detection", passed: true, notes: "Minor edge case with recurring events" },
          { case: "AI recommendations", passed: false, notes: "Needs fine-tuning for context" },
        ],
        testPassRate: 75,
        estimatedHours: 50,
        actualHours: 48,
      },
      {
        id: "f4",
        name: "Feature Update Log",
        description: "Track all deployments and changes in Super Admin dashboard",
        priority: "MEDIUM",
        phase: "EXECUTION",
        order: 4,
        planDetails: "Create searchable log with categories, version tracking, and component tagging",
        testCases: [],
        testResults: [],
        estimatedHours: 15,
      },
      {
        id: "f5",
        name: "Smart Build Tracking",
        description: "Strategic build planning with PLAN-EXECUTE-TEST methodology",
        priority: "MEDIUM",
        phase: "PLANNING",
        order: 5,
        planDetails: "Implement Ralph-inspired strategic build methodology with cost tracking and automation",
        testCases: [],
        testResults: [],
        estimatedHours: 20,
      },
    ],
  },
];

export function SmartBuildTracker() {
  const [selectedProject, setSelectedProject] = useState<SmartBuildProject>(sampleProjects[0]);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewFeatureOpen, setIsNewFeatureOpen] = useState(false);

  const completedFeatures = selectedProject.features.filter(f => f.phase === "COMPLETE").length;
  const totalFeatures = selectedProject.features.length;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Smart Build Tracker
            </CardTitle>
            <CardDescription>
              PLAN Strategically → EXECUTE Precisely → TEST Meticulously
            </CardDescription>
          </div>
          <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Smart Build Project</DialogTitle>
                <DialogDescription>
                  Start a new project with strategic planning methodology
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Project Name</Label>
                  <Input placeholder="My Amazing App" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="What are you building?" />
                </div>
                <div>
                  <Label>Target Platform</Label>
                  <Select defaultValue="web">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web Application</SelectItem>
                      <SelectItem value="mobile">Mobile App</SelectItem>
                      <SelectItem value="desktop">Desktop Application</SelectItem>
                      <SelectItem value="api">API Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewProjectOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsNewProjectOpen(false)}>
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Project Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedProject.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
            </div>
            <Badge className={phaseConfig[selectedProject.currentPhase].color}>
              {phaseConfig[selectedProject.currentPhase].label}
            </Badge>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{selectedProject.overallProgress}%</span>
            </div>
            <Progress value={selectedProject.overallProgress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs">Features</span>
              </div>
              <p className="font-semibold">{completedFeatures}/{totalFeatures}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Timer className="h-4 w-4" />
                <span className="text-xs">Est. Hours</span>
              </div>
              <p className="font-semibold">
                {selectedProject.features.reduce((acc, f) => acc + (f.estimatedHours || 0), 0)}h
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Est. Cost</span>
              </div>
              <p className="font-semibold">
                ${((selectedProject.estimatedCost || 0) / 100).toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs">Savings</span>
              </div>
              <p className="font-semibold text-green-500">
                ${((selectedProject.costSavings || 0) / 100).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Methodology Banner */}
        <div className="flex items-center justify-between bg-muted rounded-lg p-3 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-yellow-500 text-white">
                <Lightbulb className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">PLAN</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-blue-500 text-white">
                <Rocket className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">EXECUTE</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-purple-500 text-white">
                <TestTube className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">TEST</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-green-500 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">DEPLOY</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsNewFeatureOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </div>

        {/* Features List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {selectedProject.features
              .sort((a, b) => a.order - b.order)
              .map((feature) => {
                const PhaseIcon = phaseConfig[feature.phase].icon;
                const isExpanded = expandedFeature === feature.id;
                
                return (
                  <div key={feature.id} className="border rounded-lg">
                    <div 
                      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${phaseConfig[feature.phase].color} text-white`}>
                            <PhaseIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{feature.name}</span>
                              <Badge className={priorityConfig[feature.priority].color} variant="secondary">
                                {feature.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {feature.testPassRate !== undefined && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Test Pass Rate</p>
                              <p className={`font-semibold ${feature.testPassRate === 100 ? 'text-green-500' : feature.testPassRate >= 75 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {feature.testPassRate}%
                              </p>
                            </div>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t pt-4">
                        <Tabs defaultValue="plan">
                          <TabsList className="mb-4">
                            <TabsTrigger value="plan" className="flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" />
                              Plan
                            </TabsTrigger>
                            <TabsTrigger value="execute" className="flex items-center gap-1">
                              <Rocket className="h-3 w-3" />
                              Execute
                            </TabsTrigger>
                            <TabsTrigger value="test" className="flex items-center gap-1">
                              <TestTube className="h-3 w-3" />
                              Test
                            </TabsTrigger>
                            <TabsTrigger value="metrics" className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Metrics
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="plan">
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Strategic Plan</Label>
                                {feature.planDetails ? (
                                  <p className="text-sm bg-muted p-3 rounded">{feature.planDetails}</p>
                                ) : (
                                  <div className="border-2 border-dashed rounded p-4 text-center text-muted-foreground">
                                    <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No plan documented yet</p>
                                    <Button variant="outline" size="sm" className="mt-2">
                                      Add Plan Details
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="execute">
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Execution Notes</Label>
                                {feature.executionNotes ? (
                                  <p className="text-sm bg-muted p-3 rounded">{feature.executionNotes}</p>
                                ) : (
                                  <div className="border-2 border-dashed rounded p-4 text-center text-muted-foreground">
                                    <Rocket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Execution not started</p>
                                    <Button variant="outline" size="sm" className="mt-2">
                                      Start Execution
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="test">
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Test Cases & Results</Label>
                                {feature.testResults.length > 0 ? (
                                  <div className="space-y-2 mt-2">
                                    {feature.testResults.map((test, idx) => (
                                      <div key={idx} className="flex items-center justify-between bg-muted p-2 rounded">
                                        <div className="flex items-center gap-2">
                                          {test.passed ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                          ) : (
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                          )}
                                          <span className="text-sm">{test.case}</span>
                                        </div>
                                        {test.notes && (
                                          <span className="text-xs text-muted-foreground">{test.notes}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed rounded p-4 text-center text-muted-foreground mt-2">
                                    <TestTube className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No tests defined yet</p>
                                    <Button variant="outline" size="sm" className="mt-2">
                                      Add Test Cases
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="metrics">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-muted p-3 rounded">
                                <p className="text-xs text-muted-foreground">Estimated Hours</p>
                                <p className="font-semibold">{feature.estimatedHours || '-'}h</p>
                              </div>
                              <div className="bg-muted p-3 rounded">
                                <p className="text-xs text-muted-foreground">Actual Hours</p>
                                <p className="font-semibold">{feature.actualHours || '-'}h</p>
                              </div>
                              <div className="bg-muted p-3 rounded">
                                <p className="text-xs text-muted-foreground">Est. Cost</p>
                                <p className="font-semibold">
                                  ${((feature.costEstimate || 0) / 100).toLocaleString()}
                                </p>
                              </div>
                              <div className="bg-muted p-3 rounded">
                                <p className="text-xs text-muted-foreground">Actual Cost</p>
                                <p className="font-semibold">
                                  ${((feature.actualCost || 0) / 100).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </ScrollArea>

        {/* New Feature Dialog */}
        <Dialog open={isNewFeatureOpen} onOpenChange={setIsNewFeatureOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Feature</DialogTitle>
              <DialogDescription>
                Define a new feature to build with the PLAN-EXECUTE-TEST methodology
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Feature Name</Label>
                <Input placeholder="User Authentication" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="What does this feature do?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select defaultValue="MEDIUM">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estimated Hours</Label>
                  <Input type="number" placeholder="20" />
                </div>
              </div>
              <div>
                <Label>Strategic Plan</Label>
                <Textarea placeholder="How will you plan this feature strategically and meticulously?" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewFeatureOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsNewFeatureOpen(false)}>
                Add Feature
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
