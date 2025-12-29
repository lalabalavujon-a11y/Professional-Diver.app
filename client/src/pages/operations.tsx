import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Crown, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  Shield, 
  Search,
  FileText,
  TrendingUp,
  Timer,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RoleBasedNavigation from "@/components/role-based-navigation";

export default function Operations() {
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

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

  // Get access permissions for Partner Admins and Supervisors
  const { data: accessPermissions } = useQuery({
    queryKey: ["/api/users/access-permissions"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/access-permissions?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch access permissions');
      return response.json();
    },
    enabled: currentUser?.role === 'PARTNER_ADMIN' || currentUser?.role === 'SUPERVISOR'
  });

  // Check operations access: Super Admin/Admin always have access, Partner Admin/Supervisor need permission
  const hasOperationsAccess = 
    currentUser?.role === 'SUPER_ADMIN' || 
    currentUser?.role === 'ADMIN' ||
    (currentUser?.subscriptionType === 'LIFETIME' && currentUser?.role !== 'PARTNER_ADMIN' && currentUser?.role !== 'SUPERVISOR') ||
    (currentUser?.role === 'PARTNER_ADMIN' && accessPermissions?.operationsCenter === true) ||
    (currentUser?.role === 'SUPERVISOR' && accessPermissions?.operationsCenter === true);

  const operationalApps = [
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
    }
  ];

  const handleAppAccess = (appId: string) => {
    if (!hasOperationsAccess) {
      setSubscriptionModalOpen(true);
      return;
    }
    setSelectedApp(appId);
  };

  const renderAppContent = (appId: string) => {
    switch (appId) {
      case "dive-supervisor":
        return <DiveSupervisorApp />;
      case "lst-manager":
        return <LSTManagerApp />;
      case "ndt-inspector":
        return <NDTInspectorApp />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <RoleBasedNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {selectedApp ? (
          <div className="space-y-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operationalApps.map((app) => (
              <Card 
                key={app.id} 
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  hasOperationsAccess 
                    ? `border-${app.color}-200 hover:border-${app.color}-300` 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleAppAccess(app.id)}
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
            ))}
          </div>
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
    </div>
  );
}

// Individual operational app components
function DiveSupervisorApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    depth: "",
    supervisor: "",
    divers: 0,
    status: "Scheduled",
    type: "Commercial",
    location: ""
  });

  const { data: diveOperations = [] } = useQuery({
    queryKey: ["/api/operations/dive-operations"],
    queryFn: async () => {
      const response = await fetch("/api/operations/dive-operations");
      if (!response.ok) throw new Error('Failed to fetch dive operations');
      return response.json();
    }
  });

  const { data: operationsStats } = useQuery({
    queryKey: ["/api/operations/stats"],
    queryFn: async () => {
      const response = await fetch("/api/operations/stats");
      if (!response.ok) throw new Error('Failed to fetch operations stats');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/operations/dive-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create dive operation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations/dive-operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operations/stats"] });
      setCreateDialogOpen(false);
      setFormData({
        title: "",
        date: new Date().toISOString().split('T')[0],
        depth: "",
        supervisor: "",
        divers: 0,
        status: "Scheduled",
        type: "Commercial",
        location: ""
      });
      toast({
        title: "Success",
        description: "Dive operation created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create dive operation",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Active Dive Operations</span>
              </CardTitle>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Operation
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New Dive Operation</DialogTitle>
                    <DialogDescription>
                      Add a new dive operation to track and monitor.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Operation Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Platform Installation - North Sea"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="depth">Depth</Label>
                        <Input
                          id="depth"
                          value={formData.depth}
                          onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                          placeholder="e.g., 45m"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="supervisor">Supervisor *</Label>
                        <Input
                          id="supervisor"
                          value={formData.supervisor}
                          onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                          placeholder="Supervisor name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="divers">Number of Divers</Label>
                        <Input
                          id="divers"
                          type="number"
                          value={formData.divers}
                          onChange={(e) => setFormData({ ...formData, divers: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Scheduled">Scheduled</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Commercial">Commercial</SelectItem>
                            <SelectItem value="Inspection">Inspection</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Training">Training</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., North Sea Platform A"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createMutation.mutate(formData)}
                      disabled={!formData.title || !formData.supervisor || createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creating..." : "Create Operation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diveOperations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No dive operations found. Create your first operation to get started.
                </div>
              ) : (
                diveOperations.map((operation: any) => (
                  <div key={operation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{operation.title}</h4>
                      <Badge variant={operation.status === 'In Progress' ? 'default' : 'secondary'}>
                        {operation.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>Date: {operation.date}</div>
                      <div>Depth: {operation.depth}</div>
                      <div>Supervisor: {operation.supervisor}</div>
                      <div>Divers: {operation.divers}</div>
                      {operation.location && (
                        <div className="col-span-2">Location: {operation.location}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Safety Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Incident-Free Days</span>
                <span className="font-semibold text-green-600">127</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Operations</span>
                <span className="font-semibold">{operationsStats?.diveOperations?.inProgress || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Scheduled Operations</span>
                <span className="font-semibold">{operationsStats?.diveOperations?.scheduled || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Operations</span>
                <span className="font-semibold text-blue-600">{operationsStats?.diveOperations?.total || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LSTManagerApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    diveId: "",
    technician: "",
    status: "Standby",
    systems: [] as string[],
    lastCheck: new Date().toISOString().slice(0, 16)
  });
  const [systemInput, setSystemInput] = useState("");

  const { data: diveOperations = [] } = useQuery({
    queryKey: ["/api/operations/dive-operations"],
    queryFn: async () => {
      const response = await fetch("/api/operations/dive-operations");
      if (!response.ok) throw new Error('Failed to fetch dive operations');
      return response.json();
    }
  });

  const { data: lstOperations = [] } = useQuery({
    queryKey: ["/api/operations/lst-operations"],
    queryFn: async () => {
      const response = await fetch("/api/operations/lst-operations");
      if (!response.ok) throw new Error('Failed to fetch LST operations');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/operations/lst-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create LST operation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations/lst-operations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operations/stats"] });
      setCreateDialogOpen(false);
      setFormData({
        diveId: "",
        technician: "",
        status: "Standby",
        systems: [],
        lastCheck: new Date().toISOString().slice(0, 16)
      });
      setSystemInput("");
      toast({
        title: "Success",
        description: "LST operation created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create LST operation",
        variant: "destructive",
      });
    }
  });

  const addSystem = () => {
    if (systemInput.trim() && !formData.systems.includes(systemInput.trim())) {
      setFormData({ ...formData, systems: [...formData.systems, systemInput.trim()] });
      setSystemInput("");
    }
  };

  const removeSystem = (system: string) => {
    setFormData({ ...formData, systems: formData.systems.filter(s => s !== system) });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-green-600" />
                <span>System Status</span>
              </CardTitle>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create LST Operation
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New LST Operation</DialogTitle>
                    <DialogDescription>
                      Set up life support system monitoring for a dive operation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="diveId">Dive Operation ID *</Label>
                      <Select value={formData.diveId} onValueChange={(value) => setFormData({ ...formData, diveId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select dive operation" />
                        </SelectTrigger>
                        <SelectContent>
                          {diveOperations.map((op: any) => (
                            <SelectItem key={op.id} value={op.id}>{op.id} - {op.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="technician">Technician Name *</Label>
                      <Input
                        id="technician"
                        value={formData.technician}
                        onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                        placeholder="Technician name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standby">Standby</SelectItem>
                          <SelectItem value="Monitoring">Monitoring</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="systems">Systems</Label>
                      <div className="flex gap-2">
                        <Input
                          id="systems"
                          value={systemInput}
                          onChange={(e) => setSystemInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSystem())}
                          placeholder="e.g., Primary Air"
                        />
                        <Button type="button" onClick={addSystem} size="sm">Add</Button>
                      </div>
                      {formData.systems.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.systems.map((system) => (
                            <Badge key={system} variant="secondary" className="cursor-pointer" onClick={() => removeSystem(system)}>
                              {system} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastCheck">Last Check</Label>
                      <Input
                        id="lastCheck"
                        type="datetime-local"
                        value={formData.lastCheck}
                        onChange={(e) => setFormData({ ...formData, lastCheck: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createMutation.mutate(formData)}
                      disabled={!formData.diveId || !formData.technician || createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creating..." : "Create LST Operation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lstOperations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No LST operations found. Create your first operation to get started.
                </div>
              ) : (
                lstOperations.map((operation: any) => (
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
                        {Array.isArray(operation.systems) ? operation.systems.join(', ') : operation.systems}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    structure: "",
    inspector: "",
    date: new Date().toISOString().split('T')[0],
    findings: "",
    severity: "Low",
    status: "Pending",
    method: "Visual Inspection"
  });

  const { data: inspectionReports = [] } = useQuery({
    queryKey: ["/api/operations/ndt-inspections"],
    queryFn: async () => {
      const response = await fetch("/api/operations/ndt-inspections");
      if (!response.ok) throw new Error('Failed to fetch NDT inspections');
      return response.json();
    }
  });

  const { data: operationsStats } = useQuery({
    queryKey: ["/api/operations/stats"],
    queryFn: async () => {
      const response = await fetch("/api/operations/stats");
      if (!response.ok) throw new Error('Failed to fetch operations stats');
      return response.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/operations/ndt-inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create NDT inspection');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operations/ndt-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/operations/stats"] });
      setCreateDialogOpen(false);
      setFormData({
        structure: "",
        inspector: "",
        date: new Date().toISOString().split('T')[0],
        findings: "",
        severity: "Low",
        status: "Pending",
        method: "Visual Inspection"
      });
      toast({
        title: "Success",
        description: "NDT inspection created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create NDT inspection",
        variant: "destructive",
      });
    }
  });

  const completedInspections = operationsStats?.inspections?.completed || 0;
  const totalInspections = operationsStats?.inspections?.total || 0;
  const highSeverityCount = operationsStats?.inspections?.highSeverity || 0;
  const complianceRate = totalInspections > 0 
    ? Math.round((completedInspections / totalInspections) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-purple-600" />
                <span>Inspection Reports</span>
              </CardTitle>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Inspection
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New NDT Inspection</DialogTitle>
                    <DialogDescription>
                      Record a new non-destructive testing inspection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="structure">Structure/Component *</Label>
                      <Input
                        id="structure"
                        value={formData.structure}
                        onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                        placeholder="e.g., Pipeline Section A-12"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="inspector">Inspector Name *</Label>
                        <Input
                          id="inspector"
                          value={formData.inspector}
                          onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                          placeholder="Inspector name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">Inspection Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="method">NDT Method</Label>
                        <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Visual Inspection">Visual Inspection</SelectItem>
                            <SelectItem value="Magnetic Particle Inspection">Magnetic Particle Inspection</SelectItem>
                            <SelectItem value="Ultrasonic Testing">Ultrasonic Testing</SelectItem>
                            <SelectItem value="Radiographic Testing">Radiographic Testing</SelectItem>
                            <SelectItem value="Dye Penetrant Testing">Dye Penetrant Testing</SelectItem>
                            <SelectItem value="Eddy Current Testing">Eddy Current Testing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="severity">Severity</Label>
                        <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Requires Action">Requires Action</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="findings">Findings</Label>
                      <Textarea
                        id="findings"
                        value={formData.findings}
                        onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                        placeholder="Describe inspection findings..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => createMutation.mutate(formData)}
                      disabled={!formData.structure || !formData.inspector || !formData.date || createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creating..." : "Create Inspection"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inspectionReports.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No inspection reports found. Create your first inspection to get started.
                </div>
              ) : (
                inspectionReports.map((report: any) => (
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
                      {report.method && (
                        <div>Method: {report.method}</div>
                      )}
                      <div className="col-span-2">Findings: {report.findings}</div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="text-xs">
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                <span className="font-semibold text-green-600">
                  {completedInspections}/{totalInspections}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">High Severity Findings</span>
                <span className="font-semibold text-red-600">{highSeverityCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Compliance Rate</span>
                <span className="font-semibold text-blue-600">{complianceRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Requires Action</span>
                <span className="font-semibold text-orange-600">
                  {operationsStats?.inspections?.requiresAction || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}