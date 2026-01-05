import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Upload } from "lucide-react";
import EquipmentForm from "./EquipmentForm";
import EquipmentImportExport from "./EquipmentImportExport";

interface EquipmentItem {
  id: string;
  name: string;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  status: string;
  location?: string | null;
  equipmentTypeId: string;
  equipmentType?: {
    id: string;
    name: string;
  };
}

interface EquipmentInventoryProps {
  onItemClick?: (item: EquipmentItem) => void;
  onAddNew?: () => void;
}

export default function EquipmentInventory({ onItemClick, onAddNew }: EquipmentInventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  const { data: equipmentItems, isLoading } = useQuery<EquipmentItem[]>({
    queryKey: ["/api/equipment/items"],
    queryFn: async () => {
      const res = await fetch("/api/equipment/items");
      if (!res.ok) throw new Error("Failed to fetch equipment items");
      return res.json();
    },
  });

  const { data: equipmentTypes } = useQuery<any[]>({
    queryKey: ["/api/equipment/types"],
    queryFn: async () => {
      const res = await fetch("/api/equipment/types");
      if (!res.ok) throw new Error("Failed to fetch equipment types");
      return res.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPERATIONAL":
        return "bg-green-100 text-green-800";
      case "MAINTENANCE":
        return "bg-orange-100 text-orange-800";
      case "RETIRED":
        return "bg-gray-100 text-gray-800";
      case "RESERVED":
        return "bg-blue-100 text-blue-800";
      case "DECOMMISSIONED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  };

  const filteredItems = equipmentItems?.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesType = typeFilter === "ALL" || item.equipmentTypeId === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipment Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">Loading equipment...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Equipment Inventory</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setShowImportExport(true)} size="sm" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import/Export
              </Button>
              <Button onClick={() => setShowAddForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by name, serial number, manufacturer, or model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="OPERATIONAL">Operational</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
                <SelectItem value="RETIRED">Retired</SelectItem>
                <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {equipmentTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                No equipment items found matching your filters.
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${
                onItemClick ? "" : "cursor-default"
              }`}
              onClick={() => onItemClick?.(item)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge className={getStatusColor(item.status)}>{getStatusLabel(item.status)}</Badge>
                </div>
                {item.equipmentType && (
                  <p className="text-sm text-slate-600">{item.equipmentType.name}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {item.serialNumber && (
                    <div>
                      <span className="font-medium">Serial:</span> {item.serialNumber}
                    </div>
                  )}
                  {(item.manufacturer || item.model) && (
                    <div>
                      <span className="font-medium">Make/Model:</span> {item.manufacturer || ""}{" "}
                      {item.model || ""}
                    </div>
                  )}
                  {item.location && (
                    <div>
                      <span className="font-medium">Location:</span> {item.location}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredItems.length > 0 && (
        <div className="text-sm text-slate-500 text-center">
          Showing {filteredItems.length} of {equipmentItems?.length || 0} equipment items
        </div>
      )}

      {/* Equipment Form Dialog */}
      <EquipmentForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={() => {
          setShowAddForm(false);
        }}
      />

      {/* Import/Export Dialog */}
      <EquipmentImportExport
        open={showImportExport}
        onOpenChange={setShowImportExport}
        onSuccess={() => {
          setShowImportExport(false);
        }}
      />
    </div>
  );
}
