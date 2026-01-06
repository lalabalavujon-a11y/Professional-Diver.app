/**
 * Medical Equipment Inventory Component
 * 
 * Table for tracking medical equipment (O2 Cylinders, etc.) with before/after use checks
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import MedicalEquipmentForm from "./MedicalEquipmentForm";
import MedicalEquipmentImportExport from "./MedicalEquipmentImportExport";

export interface MedicalEquipmentItem {
  id: string;
  name: string;
  equipmentType: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "UNAVAILABLE";
  lastCheckedBefore?: string;
  lastCheckedAfter?: string;
  checkedBy?: string;
  pressure?: number;
  capacity?: string;
  expiryDate?: string;
  notes?: string;
}

interface MedicalEquipmentInventoryProps {
  onCheckEquipment?: (equipmentId: string, type: "before" | "after") => void;
}

export default function MedicalEquipmentInventory({ onCheckEquipment }: MedicalEquipmentInventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  // Mock data - in production this would come from API
  const { data: equipmentItems = [], isLoading } = useQuery<MedicalEquipmentItem[]>({
    queryKey: ["/api/dmt-med-ops/equipment"],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: "1",
          name: "O2 Cylinder - Primary",
          equipmentType: "Oxygen Cylinder",
          serialNumber: "O2-001",
          manufacturer: "Linde",
          model: "D-Type",
          location: "Medical Bay",
          status: "AVAILABLE",
          lastCheckedBefore: "2025-01-20T08:00:00Z",
          lastCheckedAfter: "2025-01-20T18:00:00Z",
          checkedBy: "Dr. Smith",
          pressure: 200,
          capacity: "10L",
          expiryDate: "2026-06-15",
        },
        {
          id: "2",
          name: "O2 Cylinder - Backup",
          equipmentType: "Oxygen Cylinder",
          serialNumber: "O2-002",
          manufacturer: "Linde",
          model: "D-Type",
          location: "Medical Bay",
          status: "AVAILABLE",
          lastCheckedBefore: "2025-01-20T08:00:00Z",
          pressure: 195,
          capacity: "10L",
          expiryDate: "2026-06-15",
        },
        {
          id: "3",
          name: "AED Unit",
          equipmentType: "Defibrillator",
          serialNumber: "AED-001",
          manufacturer: "Philips",
          model: "HeartStart FRx",
          location: "Emergency Station",
          status: "AVAILABLE",
          lastCheckedBefore: "2025-01-19T08:00:00Z",
          lastCheckedAfter: "2025-01-19T18:00:00Z",
          checkedBy: "Nurse Johnson",
          expiryDate: "2025-12-31",
        },
        {
          id: "4",
          name: "First Aid Kit - Primary",
          equipmentType: "First Aid Kit",
          serialNumber: "FAK-001",
          location: "Medical Bay",
          status: "IN_USE",
          lastCheckedBefore: "2025-01-20T08:00:00Z",
          checkedBy: "Dr. Smith",
        },
      ];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "IN_USE":
        return "bg-blue-100 text-blue-800";
      case "MAINTENANCE":
        return "bg-orange-100 text-orange-800";
      case "UNAVAILABLE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  };

  const filteredItems = equipmentItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesType = typeFilter === "ALL" || item.equipmentType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const equipmentTypes = Array.from(new Set(equipmentItems.map((item) => item.equipmentType)));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medical Equipment Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">Loading medical equipment...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Medical Equipment Inventory</CardTitle>
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
                placeholder="Search by name, serial number, type, or location..."
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
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="IN_USE">In Use</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {equipmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Check Before</TableHead>
                  <TableHead>Last Check After</TableHead>
                  <TableHead>Checked By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      No medical equipment found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.equipmentType}</TableCell>
                      <TableCell>{item.serialNumber || "-"}</TableCell>
                      <TableCell>{item.location || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.lastCheckedBefore ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">
                              {format(new Date(item.lastCheckedBefore), "MMM dd, yyyy HH:mm")}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-slate-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">Not checked</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.lastCheckedAfter ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">
                              {format(new Date(item.lastCheckedAfter), "MMM dd, yyyy HH:mm")}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-slate-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">Not checked</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{item.checkedBy || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {onCheckEquipment && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onCheckEquipment(item.id, "before")}
                              >
                                Check Before
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onCheckEquipment(item.id, "after")}
                              >
                                Check After
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredItems.length > 0 && (
        <div className="text-sm text-slate-500 text-center">
          Showing {filteredItems.length} of {equipmentItems.length} equipment items
        </div>
      )}

      {/* Equipment Form Dialog */}
      <MedicalEquipmentForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={() => {
          setShowAddForm(false);
        }}
      />

      {/* Import/Export Dialog */}
      <MedicalEquipmentImportExport
        open={showImportExport}
        onOpenChange={setShowImportExport}
        onSuccess={() => {
          setShowImportExport(false);
        }}
      />
    </div>
  );
}



