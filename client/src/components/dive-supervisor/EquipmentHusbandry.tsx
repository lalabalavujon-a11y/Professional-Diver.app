/**
 * Equipment Husbandry Component
 * 
 * Integration with existing equipment system for operation-specific checklists
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package,
  CheckCircle,
  XCircle,
  ListChecks
} from "lucide-react";
import EquipmentDashboard from "@/components/equipment/EquipmentDashboard";
import EquipmentInventory from "@/components/equipment/EquipmentInventory";

export default function EquipmentHusbandry({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const [view, setView] = useState<"dashboard" | "inventory" | "checklist">("dashboard");

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

  // Fetch dive plan equipment
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

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to manage equipment</CardDescription>
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

  const equipmentList = divePlan?.equipment || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Equipment List & Husbandry</h2>
          <p className="text-sm text-muted-foreground">
            Equipment checklists and husbandry for dive operations
          </p>
        </div>
        <div className="flex space-x-2">
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
          <div className="flex space-x-2">
            <Button
              variant={view === "dashboard" ? "default" : "outline"}
              onClick={() => setView("dashboard")}
            >
              Dashboard
            </Button>
            <Button
              variant={view === "inventory" ? "default" : "outline"}
              onClick={() => setView("inventory")}
            >
              Inventory
            </Button>
            <Button
              variant={view === "checklist" ? "default" : "outline"}
              onClick={() => setView("checklist")}
            >
              Checklist
            </Button>
          </div>
        </div>
      </div>

      {view === "dashboard" && (
        <EquipmentDashboard />
      )}

      {view === "inventory" && (
        <EquipmentInventory
          onItemClick={() => {}}
        />
      )}

      {view === "checklist" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ListChecks className="w-5 h-5" />
              <span>Operation Equipment Checklist</span>
            </CardTitle>
            <CardDescription>
              Equipment required for this dive operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {equipmentList.length > 0 ? (
              <div className="space-y-2">
                {equipmentList.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="flex-1">{item}</span>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No equipment specified in dive plan. Add equipment to the dive plan first.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


