/**
 * Dive Execution Component
 * 
 * Real-time operation tracking with:
 * - Status updates by phase
 * - Timer for bottom time, decompression
 * - Incident logging
 * - Quick access to emergency contacts
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PlayCircle,
  Pause,
  Square,
  Clock,
  AlertCircle,
  Phone,
  Moon,
  Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ExecutionState {
  phase: string;
  startTime?: string;
  elapsedTime: number;
  isRunning: boolean;
}

export default function DiveExecution({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const [executionState, setExecutionState] = useState<ExecutionState>({
    phase: "PRE_DIVE",
    elapsedTime: 0,
    isRunning: false,
  });

  // Fetch operations
  const { data: operations = [] } = useQuery({
    queryKey: ["/api/dive-supervisor/operations"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/operations?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch operations');
      return response.json();
    },
  });

  // Fetch dive plan to check for night ops
  const { data: divePlan } = useQuery({
    queryKey: ["/api/dive-supervisor/dive-plans", operationId],
    queryFn: async () => {
      if (!operationId) return null;
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/dive-plans?email=${email}&operationId=${operationId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!operationId,
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (executionState.isRunning) {
      interval = setInterval(() => {
        setExecutionState(prev => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [executionState.isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setExecutionState(prev => ({
      ...prev,
      isRunning: true,
      startTime: new Date().toISOString(),
    }));
  };

  const handlePause = () => {
    setExecutionState(prev => ({
      ...prev,
      isRunning: false,
    }));
  };

  const handleStop = () => {
    setExecutionState(prev => ({
      ...prev,
      isRunning: false,
      elapsedTime: 0,
    }));
  };

  const phases = [
    { value: "PRE_DIVE", label: "Pre-Dive", color: "blue" },
    { value: "DIVE", label: "Dive", color: "cyan" },
    { value: "DECOMPRESSION", label: "Decompression", color: "orange" },
    { value: "POST_DIVE", label: "Post-Dive", color: "green" },
  ];

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to track execution</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={operationId || "none"}
              onValueChange={(value) => onOperationSelect(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Operation</SelectItem>
                {operations.map((op: any) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dive Execution</h2>
          <p className="text-sm text-muted-foreground">
            Real-time operation tracking and monitoring
          </p>
        </div>
        <Select
          value={operationId}
          onValueChange={(value) => onOperationSelect(value)}
        >
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operations.map((op: any) => (
              <SelectItem key={op.id} value={op.id}>
                {op.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timer Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Operation Timer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-6xl font-mono font-bold">
              {formatTime(executionState.elapsedTime)}
            </div>
            <div className="flex justify-center space-x-2">
              {!executionState.isRunning ? (
                <Button onClick={handleStart} size="lg">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Start
                </Button>
              ) : (
                <>
                  <Button onClick={handlePause} variant="outline" size="lg">
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={handleStop} variant="destructive" size="lg">
                    <Square className="w-5 h-5 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {phases.map((phase) => (
              <Button
                key={phase.value}
                variant={executionState.phase === phase.value ? "default" : "outline"}
                onClick={() => setExecutionState(prev => ({ ...prev, phase: phase.value }))}
                className="flex flex-col items-center space-y-2 h-auto py-4"
              >
                <span className="text-sm font-medium">{phase.label}</span>
                {executionState.phase === phase.value && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Emergency Contacts (Blue Light Services)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start" onClick={() => window.location.href = "tel:999"}>
              <Phone className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Emergency Services</div>
                <div className="text-xs text-muted-foreground">999 (UK)</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => window.location.href = "tel:112"}>
              <Phone className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Emergency Services</div>
                <div className="text-xs text-muted-foreground">112 (EU)</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start">
              <Phone className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Diving Doctor</div>
                <div className="text-xs text-muted-foreground">See Contacts tab</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start">
              <Phone className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">A&E / Critical Care</div>
                <div className="text-xs text-muted-foreground">See Contacts tab</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start">
              <Phone className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Harbour Master</div>
                <div className="text-xs text-muted-foreground">See Contacts tab</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start">
              <Phone className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">VTS</div>
                <div className="text-xs text-muted-foreground">See Contacts tab</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Night Ops Alert */}
      {divePlan?.isNightOps && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-900">
              <Moon className="w-5 h-5" />
              <span>Night Operations Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-yellow-800">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4" />
                <span>Enhanced lighting required</span>
              </div>
              {divePlan.nightOpsConsiderations && typeof divePlan.nightOpsConsiderations === 'object' && (
                <div className="mt-2 space-y-1">
                  {Object.entries(divePlan.nightOpsConsiderations).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="font-semibold">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Log */}
      <Card>
        <CardHeader>
          <CardTitle>Status Log</CardTitle>
          <CardDescription>Recent operation status updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Operation started</span>
              <span className="text-muted-foreground">
                {executionState.startTime ? format(new Date(executionState.startTime), "HH:mm:ss") : "Not started"}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Current phase: {phases.find(p => p.value === executionState.phase)?.label}</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            {divePlan?.isNightOps && (
              <div className="flex items-center justify-between p-2 border rounded bg-yellow-50">
                <span className="flex items-center space-x-2">
                  <Moon className="w-4 h-4" />
                  <span>Night Operations Mode</span>
                </span>
                <Badge variant="outline" className="bg-yellow-100">Active</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

