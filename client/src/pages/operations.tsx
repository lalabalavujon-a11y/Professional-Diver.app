import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Crown, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  Shield, 
  Search,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  Timer,
  Settings,
  Package,
  HeartPulse,
  Phone,
  Mail,
  Globe,
  Navigation,
  Waves,
  GripVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import diverWellLogo from "@assets/DIVER_WELL_TRAINING-500x500-rbg-preview_1756088331820.png";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { useUnitsPreference } from "@/hooks/use-units-preference";
import { formatDepthFromString } from "@/lib/units-converter";
import OperationsCalendarWidget from "@/components/widgets/operations-calendar-widget";
import OperationsWidgetPanel from "@/components/operations-widget-panel";
import EquipmentDashboard from "@/components/equipment/EquipmentDashboard";
import EquipmentInventory from "@/components/equipment/EquipmentInventory";
import EquipmentDetail from "@/components/equipment/EquipmentDetail";
import MaintenanceSchedule from "@/components/equipment/MaintenanceSchedule";
import UseLogForm from "@/components/equipment/UseLogForm";
import MedOpsApp from "@/components/med-ops/MedOpsApp";
import DMTMedOpsApp from "@/components/dmt-med-ops/DMTMedOpsApp";
import DiverWellOperationsApp from "@/components/operations/DiverWellOperationsApp";
import DiveSupervisorControlApp from "@/components/dive-supervisor/DiveSupervisorControlApp";

// Mock operational data - in real app this would come from backend
const operationalData = {
  diveOperations: [
    {
      id: "DO-001",
      title: "Platform Installation - North Sea",
      date: "2025-08-25",
      depth: "45m",
      supervisor: "John Smith",
      divers: 4,
      status: "In Progress",
      type: "Commercial"
    },
    {
      id: "DO-002", 
      title: "Hull Inspection - Port Terminal",
      date: "2025-08-26",
      depth: "12m",
      supervisor: "Sarah Johnson",
      divers: 2,
      status: "Scheduled",
      type: "Inspection"
    }
  ],
  inspectionReports: [
    {
      id: "NDT-001",
      structure: "Pipeline Section A-12",
      inspector: "Mike Wilson",
      date: "2025-08-24",
      findings: "Minor corrosion detected",
      severity: "Low",
      status: "Completed"
    },
    {
      id: "NDT-002",
      structure: "Weld Joint B-08",
      inspector: "Lisa Chen",
      date: "2025-08-25",
      findings: "Crack initiation observed",
      severity: "High",
      status: "Requires Action"
    }
  ],
  lstOperations: [
    {
      id: "LST-001",
      diveId: "DO-001",
      systems: ["Primary Air", "Emergency Gas", "Communications"],
      technician: "Dave Brown",
      status: "Monitoring",
      lastCheck: "2025-08-25 14:30"
    },
    {
      id: "LST-002",
      diveId: "DO-002",
      systems: ["Hot Water", "Umbilical", "Decompression"],
      technician: "Anna Taylor",
      status: "Standby",
      lastCheck: "2025-08-25 12:00"
    }
  ]
};

// Operational apps configuration - defined before component to avoid hoisting issues
const operationalApps = [
  {
    id: "diver-well",
    title: "Diver Well AI Consultant",
    description: "Commercial diving operations AI consultant - dive planning, safety protocols, operational guidance, and expert advice",
    icon: <Waves className="w-8 h-8 text-cyan-600" />,
    color: "cyan",
    features: [
      "Dive Planning & Risk Assessment",
      "Safety Protocols & Procedures",
      "Operational Guidance & Best Practices",
      "Equipment Recommendations",
      "Emergency Response Procedures",
      "Industry Standards & Compliance"
    ],
    userRole: "All Operations Personnel"
  },
  {
    id: "dive-supervisor",
    title: "Dive Supervisor Operations",
    description: "Comprehensive dive operation management, crew coordination, and safety oversight tools",
    icon: <Shield className="w-8 h-8 text-blue-600" />,
    color: "blue",
    features: [
      "Real-time dive monitoring",
      "Crew assignment & scheduling", 
      "Safety protocol management",
      "Emergency response coordination",
      "Dive log management",
      "Equipment status tracking"
    ],
    userRole: "Dive Supervisor"
  },
  {
    id: "lst-manager",
    title: "Life Support Technician (LST)",
    description: "Life support systems monitoring, maintenance scheduling, and critical equipment management",
    icon: <Wrench className="w-8 h-8 text-green-600" />,
    color: "green", 
    features: [
      "Life support system monitoring",
      "Equipment maintenance tracking",
      "Gas supply management",
      "Emergency backup systems",
      "Pressure & flow monitoring",
      "System diagnostics & alerts"
    ],
    userRole: "Life Support Technician"
  },
  {
    id: "ndt-inspector",
    title: "NDT Underwater Inspection Controller",
    description: "Non-destructive testing inspection management, reporting, and quality assurance tools",
    icon: <Search className="w-8 h-8 text-purple-600" />,
    color: "purple",
    features: [
      "Inspection planning & scheduling",
      "NDT method selection & protocols",
      "Real-time inspection data capture",
      "Defect analysis & reporting",
      "Quality assurance workflows",
      "Certification compliance tracking"
    ],
    userRole: "NDT Inspector"
  },
  {
    id: "equipment-manager",
    title: "Equipment Manager",
    description: "Comprehensive equipment maintenance scheduling, inventory management, and use log tracking",
    icon: <Package className="w-8 h-8 text-teal-600" />,
    color: "teal",
    features: [
      "Equipment inventory management",
      "Maintenance schedule tracking",
      "Before/after use logs",
      "Maintenance task management",
      "Equipment status tracking",
      "Maintenance history & reporting"
    ],
    userRole: "Equipment Manager"
  },
  {
    id: "med-ops",
    title: "MED OPS / Emergency OPS",
    description: "Emergency medical operations - connect with nearest A&E, Critical Care, and Diving Doctors worldwide",
    icon: <HeartPulse className="w-8 h-8 text-red-600" />,
    color: "red",
    features: [
      "Find nearest A&E facilities",
      "Locate Critical Care units",
      "Connect with Diving Doctors",
      "Hyperbaric chamber locations",
      "24/7 emergency contact",
      "Location-based facility search"
    ],
    userRole: "Medical Operations"
  },
  {
    id: "dmt-med-ops",
    title: "DMT Diver Medic Operations",
    description: "Medical equipment management, incident reporting, and medical documentation for Diver Medic Technicians",
    icon: <HeartPulse className="w-8 h-8 text-pink-600" />,
    color: "pink",
    features: [
      "Medical equipment inventory (O2 Cylinders, etc.)",
      "Before/after use checks",
      "CSV/Excel import & export",
      "Incident report forms",
      "Glaucoma screening forms",
      "Medical documentation management"
    ],
    userRole: "Diver Medic Technician"
  }
] as const;

// Sortable Item Component
interface SortableItemProps {
  app: typeof operationalApps[number];
  hasOperationsAccess: boolean;
  onAppClick: (appId: string) => void;
}

function SortableItem({ app, hasOperationsAccess, onAppClick }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`relative cursor-pointer transition-all hover:shadow-lg ${
          hasOperationsAccess 
            ? `border-${app.color}-200 hover:border-${app.color}-300` 
            : 'border-gray-200 hover:border-gray-300'
        } ${isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}
        onClick={() => onAppClick(app.id)}
      >
        {!hasOperationsAccess && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Subscription Required</p>
            </div>
          </div>
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {app.icon}
                <Badge variant="outline" className="text-xs">
                  {app.userRole}
                </Badge>
              </div>
              <CardTitle className="text-lg">{app.title}</CardTitle>
              <CardDescription className="text-sm">
                {app.description}
              </CardDescription>
            </div>
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Key Features:</h4>
              <ul className="text-xs text-slate-600 space-y-1">
                {app.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
                {app.features.length > 4 && (
                  <li className="text-xs text-slate-400">
                    +{app.features.length - 4} more features
                  </li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Operations() {
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [appsOrder, setAppsOrder] = useState<string[]>([]);
  const appContentRef = useRef<HTMLDivElement>(null);

  // Get current user to check subscription status
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Load saved order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('operationsAppsOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        // Validate that all app IDs are present
        const defaultOrder = operationalApps.map(app => app.id);
        const validOrder = parsedOrder.filter((id: string) => defaultOrder.includes(id));
        // Add any missing apps to the end
        const missingApps = defaultOrder.filter(id => !validOrder.includes(id));
        setAppsOrder([...validOrder, ...missingApps]);
      } catch {
        // If parsing fails, use default order
        setAppsOrder(operationalApps.map(app => app.id));
      }
    } else {
      // Default order
      setAppsOrder(operationalApps.map(app => app.id));
    }
  }, []);

  // Save order to localStorage whenever it changes
  useEffect(() => {
    if (appsOrder.length > 0) {
      localStorage.setItem('operationsAppsOrder', JSON.stringify(appsOrder));
    }
  }, [appsOrder]);

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setAppsOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Get ordered apps based on saved order
  const orderedApps = appsOrder.length > 0
    ? appsOrder
        .map(id => operationalApps.find(app => app.id === id))
        .filter((app): app is typeof operationalApps[number] => app !== undefined)
        .concat(operationalApps.filter(app => !appsOrder.includes(app.id)))
    : operationalApps;

  // Get user preferences for operations calendar
  const { data: preferences } = useQuery({
    queryKey: ['/api/users/preferences'],
    queryFn: async () => {
      const storedPrefs = localStorage.getItem('userPreferences');
      if (storedPrefs) {
        try {
          return JSON.parse(storedPrefs);
        } catch {
          return { enableOperationsCalendar: false, timezone: 'UTC' };
        }
      }
      return { enableOperationsCalendar: false, timezone: 'UTC' };
    },
    staleTime: 5 * 60 * 1000,
  });

  const hasOperationsAccess = currentUser?.subscriptionType === 'LIFETIME' || currentUser?.role === 'ADMIN';

  const handleAppAccess = (appId: string) => {
    if (!hasOperationsAccess) {
      setSubscriptionModalOpen(true);
      return;
    }
    setSelectedApp(appId);
  };

  // Scroll to app content when an app is selected
  useEffect(() => {
    if (selectedApp && appContentRef.current) {
      // Small delay to ensure the content is rendered
      setTimeout(() => {
        appContentRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [selectedApp]);

  const renderAppContent = (appId: string) => {
    switch (appId) {
      case "diver-well":
        return <DiverWellOperationsApp />;
      case "dive-supervisor":
        return <DiveSupervisorControlApp />;
      case "lst-manager":
        return <LSTManagerApp />;
      case "ndt-inspector":
        return <NDTInspectorApp />;
      case "equipment-manager":
        return <EquipmentManagerApp />;
      case "med-ops":
        return <MedOpsApp />;
      case "dmt-med-ops":
        return <DMTMedOpsApp />;
      default:
        return null;
    }
  };

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <div className="flex h-[calc(100vh-5rem)] mt-20 overflow-hidden">
          {/* Main Content Area */}
          <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            <ResizablePanel defaultSize={75} minSize={50} className="overflow-auto">
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full overflow-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Operations Center</h1>
              <p className="text-lg text-slate-600">
                Professional operational management applications for diving professionals
              </p>
            </div>
            {hasOperationsAccess && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Operations Access Enabled
              </Badge>
            )}
          </div>
        </div>

        {/* Operations Calendar Widget */}
        {preferences?.enableOperationsCalendar && (
          <div className="mb-8">
            <OperationsCalendarWidget timezone={preferences.timezone || 'UTC'} />
          </div>
        )}

        {selectedApp ? (
          <div ref={appContentRef} className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedApp(null)}
                className="flex items-center space-x-2"
              >
                ← Back to Operations
              </Button>
              <h2 className="text-xl font-semibold text-slate-900">
                {operationalApps.find(app => app.id === selectedApp)?.title}
              </h2>
            </div>
            {renderAppContent(selectedApp)}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedApps.map(app => app.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orderedApps.map((app) => (
                  <SortableItem
                    key={app.id}
                    app={app}
                    hasOperationsAccess={hasOperationsAccess}
                    onAppClick={handleAppAccess}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Subscription Modal */}
        <Dialog open={subscriptionModalOpen} onOpenChange={setSubscriptionModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-yellow-600" />
                <span>Operations Access Required</span>
              </DialogTitle>
              <DialogDescription>
                Access to operational management applications requires an active subscription or lifetime membership.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Professional Operations Suite</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      These specialized operational management tools are designed for professional diving operations 
                      and require subscription access to ensure quality, support, and regular updates.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Included in Operations Access:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Complete operational management suite</li>
                  <li>• Real-time monitoring & reporting</li>
                  <li>• Compliance & safety tracking</li>
                  <li>• Advanced analytics & insights</li>
                  <li>• 24/7 technical support</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={() => setSubscriptionModalOpen(false)}
                variant="outline" 
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button 
                onClick={() => {
                  setSubscriptionModalOpen(false);
                  toast({
                    title: "Contact Sales",
                    description: "Please contact our sales team for subscription options.",
                  });
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Upgrade Subscription
              </Button>
            </div>
          </DialogContent>
        </Dialog>
              </main>
            </ResizablePanel>
            
            <ResizableHandle withHandle className="w-2 bg-slate-200 hover:bg-slate-300 transition-colors" />
            
            {/* Widget Control Panel - Right Sidebar */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="hidden lg:block">
              <OperationsWidgetPanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </>
  );
}


function LSTManagerApp() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-green-600" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {operationalData.lstOperations.map((operation) => (
                <div key={operation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Dive {operation.diveId}</h4>
                    <Badge variant={operation.status === 'Monitoring' ? 'default' : 'secondary'}>
                      {operation.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    <div>Technician: {operation.technician}</div>
                    <div>Last Check: {operation.lastCheck}</div>
                    <div className="mt-2">
                      <span className="font-medium">Systems: </span>
                      {operation.systems.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Timer className="w-5 h-5 text-orange-600" />
              <span>Maintenance Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="border-l-4 border-orange-500 pl-3">
                <div className="font-medium">Primary Air System</div>
                <div className="text-sm text-slate-600">Due: Today</div>
              </div>
              <div className="border-l-4 border-blue-500 pl-3">
                <div className="font-medium">Emergency Gas Supply</div>
                <div className="text-sm text-slate-600">Due: Tomorrow</div>
              </div>
              <div className="border-l-4 border-green-500 pl-3">
                <div className="font-medium">Communication System</div>
                <div className="text-sm text-slate-600">Due: Next Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NDTInspectorApp() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-purple-600" />
              <span>Inspection Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {operationalData.inspectionReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{report.structure}</h4>
                    <Badge variant={report.severity === 'High' ? 'destructive' : 'secondary'}>
                      {report.severity} Risk
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                    <div>Inspector: {report.inspector}</div>
                    <div>Date: {report.date}</div>
                    <div className="col-span-2">Findings: {report.findings}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Compliance Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Inspections Complete</span>
                <span className="font-semibold text-green-600">24/25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Critical Findings</span>
                <span className="font-semibold text-red-600">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Compliance Rate</span>
                <span className="font-semibold text-blue-600">96%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function EquipmentManagerApp() {
  const [view, setView] = useState<"dashboard" | "inventory" | "detail" | "maintenance" | "use-log">("dashboard");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showUseLogForm, setShowUseLogForm] = useState(false);

  return (
    <div className="space-y-6">
      {view === "dashboard" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Equipment Dashboard</h2>
            <Button onClick={() => setView("inventory")} variant="outline">
              View Inventory
            </Button>
          </div>
          <EquipmentDashboard />
        </>
      )}

      {view === "inventory" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Equipment Inventory</h2>
            <Button onClick={() => setView("dashboard")} variant="outline">
              Back to Dashboard
            </Button>
          </div>
          <EquipmentInventory
            onItemClick={(item) => {
              setSelectedItemId(item.id);
              setView("detail");
            }}
          />
        </>
      )}

      {view === "detail" && selectedItemId && (
        <EquipmentDetail
          itemId={selectedItemId}
          onBack={() => setView("inventory")}
          onLogUse={() => setShowUseLogForm(true)}
        />
      )}

      {showUseLogForm && selectedItemId && (
        <div className="max-w-2xl mx-auto">
          <UseLogForm
            equipmentItemId={selectedItemId}
            onComplete={() => setShowUseLogForm(false)}
          />
        </div>
      )}

      {view === "maintenance" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Maintenance Schedule</h2>
            <Button onClick={() => setView("dashboard")} variant="outline">
              Back to Dashboard
            </Button>
          </div>
          <MaintenanceSchedule />
        </>
      )}
    </div>
  );
}
