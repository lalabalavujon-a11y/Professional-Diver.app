import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  Filter, 
  GitCommit, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Rocket,
  Bug,
  Sparkles,
  Shield,
  Zap,
  Palette,
  ChevronRight,
  ExternalLink,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface FeatureUpdate {
  id: string;
  title: string;
  description: string;
  category: "FEATURE" | "BUGFIX" | "ENHANCEMENT" | "SECURITY" | "PERFORMANCE" | "UI_UX";
  status: "PLANNED" | "IN_PROGRESS" | "TESTING" | "DEPLOYED" | "ROLLED_BACK";
  version?: string;
  commitHash?: string;
  pullRequestUrl?: string;
  affectedComponents: string[];
  technicalDetails?: string;
  breakingChanges: boolean;
  deployedAt?: string;
  createdAt: string;
}

const categoryConfig = {
  FEATURE: { icon: Rocket, color: "bg-blue-500", label: "Feature" },
  BUGFIX: { icon: Bug, color: "bg-red-500", label: "Bug Fix" },
  ENHANCEMENT: { icon: Sparkles, color: "bg-purple-500", label: "Enhancement" },
  SECURITY: { icon: Shield, color: "bg-orange-500", label: "Security" },
  PERFORMANCE: { icon: Zap, color: "bg-yellow-500", label: "Performance" },
  UI_UX: { icon: Palette, color: "bg-pink-500", label: "UI/UX" },
};

const statusConfig = {
  PLANNED: { color: "bg-gray-500", label: "Planned" },
  IN_PROGRESS: { color: "bg-blue-500", label: "In Progress" },
  TESTING: { color: "bg-yellow-500", label: "Testing" },
  DEPLOYED: { color: "bg-green-500", label: "Deployed" },
  ROLLED_BACK: { color: "bg-red-500", label: "Rolled Back" },
};

// Historical feature updates (to be populated automatically from deployments)
const historicalUpdates: FeatureUpdate[] = [
  {
    id: "1",
    title: "Enterprise Unified Calendar System",
    description: "Complete calendar integration with Google, Outlook, HighLevel, and Calendly for enterprise users with AI monitoring.",
    category: "FEATURE",
    status: "DEPLOYED",
    version: "1.0.3",
    affectedComponents: ["Calendar", "Enterprise Dashboard", "AI Agents"],
    technicalDetails: "Implemented calendar sync with multiple providers, conflict resolution, and LangSmith tracking.",
    breakingChanges: false,
    deployedAt: "2026-01-23T13:50:00Z",
    createdAt: "2026-01-22T10:00:00Z",
  },
  {
    id: "2",
    title: "Client Representative Course",
    description: "Complete 50-module Client Representative training course with exams and certifications.",
    category: "FEATURE",
    status: "DEPLOYED",
    version: "1.0.3",
    affectedComponents: ["Training", "Courses", "Exams", "Certifications"],
    technicalDetails: "Imported comprehensive client rep curriculum with 50 lessons, quizzes, and professional assessments.",
    breakingChanges: false,
    deployedAt: "2026-01-23T01:00:00Z",
    createdAt: "2026-01-22T15:00:00Z",
  },
  {
    id: "3",
    title: "Stripe Connect for Affiliates",
    description: "Integrated Stripe Connect for affiliate payout management and earnings tracking.",
    category: "FEATURE",
    status: "DEPLOYED",
    version: "1.0.2",
    affectedComponents: ["Affiliates", "Payments", "Dashboard"],
    technicalDetails: "Lazy-loaded StripeConnectService to prevent startup crashes when API key is missing.",
    breakingChanges: false,
    deployedAt: "2026-01-22T13:50:00Z",
    createdAt: "2026-01-21T09:00:00Z",
  },
  {
    id: "4",
    title: "WhatsApp Integration",
    description: "Complete WhatsApp business integration for client communications and notifications.",
    category: "FEATURE",
    status: "DEPLOYED",
    version: "1.0.2",
    affectedComponents: ["Communications", "CRM", "Notifications"],
    breakingChanges: false,
    deployedAt: "2026-01-21T18:00:00Z",
    createdAt: "2026-01-20T14:00:00Z",
  },
  {
    id: "5",
    title: "Sponsorship Program System",
    description: "Comprehensive sponsorship management with tiers, benefits tracking, and automated communications.",
    category: "FEATURE",
    status: "DEPLOYED",
    version: "1.0.1",
    affectedComponents: ["Sponsorship", "Dashboard", "Reports"],
    breakingChanges: false,
    deployedAt: "2026-01-20T12:00:00Z",
    createdAt: "2026-01-19T08:00:00Z",
  },
  {
    id: "6",
    title: "Diver Well AI Tutor Rebranding",
    description: "Unified all AI tutors under 'Diver Well' branding for consistent user experience.",
    category: "UI_UX",
    status: "DEPLOYED",
    version: "1.0.1",
    affectedComponents: ["AI Tutors", "Training", "Podcasts"],
    breakingChanges: false,
    deployedAt: "2026-01-19T16:00:00Z",
    createdAt: "2026-01-18T11:00:00Z",
  },
  {
    id: "7",
    title: "Mobile Responsive Improvements",
    description: "Added mobile-not-supported component for complex desktop-only pages with responsive fallbacks.",
    category: "UI_UX",
    status: "DEPLOYED",
    version: "1.0.1",
    affectedComponents: ["UI Components", "Mobile", "Dashboard"],
    breakingChanges: false,
    deployedAt: "2026-01-18T14:00:00Z",
    createdAt: "2026-01-17T10:00:00Z",
  },
  {
    id: "8",
    title: "Database Query Optimization",
    description: "Critical fix: Select only needed columns in getUserIdFromEmail to prevent performance issues.",
    category: "PERFORMANCE",
    status: "DEPLOYED",
    version: "1.0.0",
    affectedComponents: ["Database", "Authentication", "API"],
    technicalDetails: "Optimized SQL queries to reduce payload size and improve response times.",
    breakingChanges: false,
    deployedAt: "2026-01-17T09:00:00Z",
    createdAt: "2026-01-16T15:00:00Z",
  },
  {
    id: "9",
    title: "Auto-Seed Database Feature",
    description: "Automatic database seeding on server startup when production database is empty.",
    category: "FEATURE",
    status: "DEPLOYED",
    version: "1.0.3",
    affectedComponents: ["Server", "Database", "Deployment"],
    technicalDetails: "Created auto-seed.ts that checks for empty database and populates with training tracks and content.",
    breakingChanges: false,
    deployedAt: "2026-01-24T09:10:00Z",
    createdAt: "2026-01-24T09:00:00Z",
  },
  {
    id: "10",
    title: "Cloudflare Cache Purge Workflow Fix",
    description: "Fixed GitHub Actions workflow to use correct CLOUDFLARE_CACHE_PURGE_TOKEN for automatic cache clearing.",
    category: "BUGFIX",
    status: "DEPLOYED",
    version: "1.0.3",
    affectedComponents: ["CI/CD", "Cloudflare", "Deployment"],
    technicalDetails: "Updated workflow to fallback to CLOUDFLARE_CACHE_PURGE_TOKEN when CLOUDFLARE_API_TOKEN lacks permissions.",
    breakingChanges: false,
    deployedAt: "2026-01-24T09:01:00Z",
    createdAt: "2026-01-24T08:50:00Z",
  },
];

export function FeatureUpdateLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<FeatureUpdate | null>(null);
  const queryClient = useQueryClient();

  // Filter updates based on search and category
  const filteredUpdates = historicalUpdates.filter((update) => {
    const matchesSearch = 
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.affectedComponents.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || update.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group updates by month
  const groupedUpdates = filteredUpdates.reduce((acc, update) => {
    const month = format(new Date(update.deployedAt || update.createdAt), "MMMM yyyy");
    if (!acc[month]) acc[month] = [];
    acc[month].push(update);
    return acc;
  }, {} as Record<string, FeatureUpdate[]>);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              Feature Update Log
            </CardTitle>
            <CardDescription>
              Track all feature deployments, bug fixes, and system updates
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {filteredUpdates.length} Updates
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search updates, components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter by Category</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2 pt-4">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  onClick={() => setSelectedCategory(null)}
                  className="justify-start"
                >
                  All Categories
                </Button>
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? "default" : "outline"}
                      onClick={() => setSelectedCategory(key)}
                      className="justify-start"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const count = filteredUpdates.filter(u => u.category === key).length;
            if (count === 0) return null;
            const Icon = config.icon;
            return (
              <Badge
                key={key}
                variant={selectedCategory === key ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {config.label} ({count})
              </Badge>
            );
          })}
        </div>

        {/* Updates Timeline */}
        <ScrollArea className="h-[500px] pr-4">
          {Object.entries(groupedUpdates).map(([month, updates]) => (
            <div key={month} className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {month}
              </h3>
              <div className="space-y-3">
                {updates.map((update) => {
                  const CategoryIcon = categoryConfig[update.category].icon;
                  return (
                    <Dialog key={update.id}>
                      <DialogTrigger asChild>
                        <div className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${categoryConfig[update.category].color} text-white`}>
                                <CategoryIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{update.title}</h4>
                                  {update.version && (
                                    <Badge variant="outline" className="text-xs">
                                      v{update.version}
                                    </Badge>
                                  )}
                                  {update.breakingChanges && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Breaking
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {update.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge className={statusConfig[update.status].color}>
                                    {statusConfig[update.status].label}
                                  </Badge>
                                  {update.affectedComponents.slice(0, 3).map((comp) => (
                                    <Badge key={comp} variant="secondary" className="text-xs">
                                      {comp}
                                    </Badge>
                                  ))}
                                  {update.affectedComponents.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{update.affectedComponents.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                              {update.deployedAt && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  {format(new Date(update.deployedAt), "MMM d, h:mm a")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${categoryConfig[update.category].color} text-white`}>
                              <CategoryIcon className="h-4 w-4" />
                            </div>
                            {update.title}
                          </DialogTitle>
                          <DialogDescription>
                            {update.description}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium mb-1">Status</p>
                              <Badge className={statusConfig[update.status].color}>
                                {statusConfig[update.status].label}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Category</p>
                              <Badge variant="outline">
                                {categoryConfig[update.category].label}
                              </Badge>
                            </div>
                            {update.version && (
                              <div>
                                <p className="text-sm font-medium mb-1">Version</p>
                                <Badge variant="secondary">v{update.version}</Badge>
                              </div>
                            )}
                            {update.deployedAt && (
                              <div>
                                <p className="text-sm font-medium mb-1">Deployed</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(update.deployedAt), "PPpp")}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium mb-2">Affected Components</p>
                            <div className="flex flex-wrap gap-2">
                              {update.affectedComponents.map((comp) => (
                                <Badge key={comp} variant="secondary">
                                  {comp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {update.technicalDetails && (
                            <div>
                              <p className="text-sm font-medium mb-2">Technical Details</p>
                              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                {update.technicalDetails}
                              </p>
                            </div>
                          )}
                          
                          {(update.commitHash || update.pullRequestUrl) && (
                            <div className="flex gap-4">
                              {update.commitHash && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Commit</p>
                                  <code className="text-xs bg-muted px-2 py-1 rounded">
                                    {update.commitHash.slice(0, 7)}
                                  </code>
                                </div>
                              )}
                              {update.pullRequestUrl && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Pull Request</p>
                                  <a 
                                    href={update.pullRequestUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                                  >
                                    View PR <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            </div>
          ))}
          
          {filteredUpdates.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <GitCommit className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No updates found matching your criteria</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
