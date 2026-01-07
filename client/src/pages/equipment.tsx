import { useState } from "react";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EquipmentDashboard from "@/components/equipment/EquipmentDashboard";
import EquipmentInventory from "@/components/equipment/EquipmentInventory";
import EquipmentDetail from "@/components/equipment/EquipmentDetail";
import MaintenanceSchedule from "@/components/equipment/MaintenanceSchedule";
import UseLogHistory from "@/components/equipment/UseLogHistory";
import UseLogForm from "@/components/equipment/UseLogForm";
import { Package } from "lucide-react";

export default function EquipmentPage() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showUseLogForm, setShowUseLogForm] = useState(false);

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Package className="w-8 h-8 text-teal-600" />
              <h1 className="text-3xl font-bold text-slate-900">Equipment Management</h1>
            </div>
            <p className="text-lg text-slate-600">
              Comprehensive equipment maintenance scheduling, inventory management, and use log tracking
            </p>
          </div>

          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance Schedule</TabsTrigger>
              <TabsTrigger value="history">Use History</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <EquipmentDashboard />
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6">
              <EquipmentInventory
                onItemClick={(item) => {
                  setSelectedItemId(item.id);
                }}
              />
              {selectedItemId && (
                <div className="mt-6">
                  <EquipmentDetail
                    itemId={selectedItemId}
                    onBack={() => setSelectedItemId(null)}
                    onLogUse={() => setShowUseLogForm(true)}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6">
              <MaintenanceSchedule />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <UseLogHistory itemId={selectedItemId || undefined} />
            </TabsContent>
          </Tabs>

          {showUseLogForm && selectedItemId && (
            <div className="mt-6 max-w-2xl mx-auto">
              <UseLogForm
                equipmentItemId={selectedItemId}
                onComplete={() => setShowUseLogForm(false)}
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
}



