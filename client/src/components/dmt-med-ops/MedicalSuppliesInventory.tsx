/**
 * Medical Supplies Inventory Component
 * 
 * Separate inventory for consumable medical supplies (MS) - distinct from equipment
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Upload, AlertCircle, CheckCircle } from "lucide-react";
import MedicalSuppliesForm from "./MedicalSuppliesForm";
import MedicalSuppliesImportExport from "./MedicalSuppliesImportExport";

export interface MedicalSupplyItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumStock: number;
  currentStock: number;
  location?: string;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  lastRestocked?: string;
  notes?: string;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "EXPIRED";
}

interface MedicalSuppliesInventoryProps {
  onRestock?: (supplyId: string) => void;
}

const SUPPLY_CATEGORIES = [
  "Diagnostic Equipment",
  "Airway Management",
  "Oxygen Supplies",
  "Wound Care",
  "Orthopedic Supplies",
  "Medications",
  "Protective Equipment",
  "Miscellaneous",
];

export default function MedicalSuppliesInventory({ onRestock }: MedicalSuppliesInventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  const { data: supplyItems = [], isLoading } = useQuery<MedicalSupplyItem[]>({
    queryKey: ["/api/dmt-med-ops/supplies"],
    queryFn: async () => {
      // Mock data - in production this would come from API
      return [
        {
          id: "1",
          name: "Sterile Gauze Pads 4x4",
          category: "Wound Care",
          quantity: 500,
          unit: "pads",
          minimumStock: 100,
          currentStock: 450,
          location: "Medical Bay - Shelf A",
          expiryDate: "2026-12-31",
          batchNumber: "GAU-2024-001",
          supplier: "MedSupply Co.",
          lastRestocked: "2025-01-15T10:00:00Z",
          status: "IN_STOCK",
        },
        {
          id: "2",
          name: "Oxygen Masks - Non-rebreather",
          category: "Oxygen Supplies",
          quantity: 50,
          unit: "masks",
          minimumStock: 20,
          currentStock: 15,
          location: "Medical Bay - Shelf B",
          status: "LOW_STOCK",
        },
        {
          id: "3",
          name: "Epinephrine Auto-injectors",
          category: "Medications",
          quantity: 10,
          unit: "units",
          minimumStock: 5,
          currentStock: 3,
          location: "Refrigerated Storage",
          expiryDate: "2025-06-30",
          batchNumber: "EPI-2024-042",
          status: "LOW_STOCK",
        },
        {
          id: "4",
          name: "SAM Splints",
          category: "Orthopedic Supplies",
          quantity: 20,
          unit: "splints",
          minimumStock: 10,
          currentStock: 22,
          location: "Medical Bay - Shelf C",
          status: "IN_STOCK",
        },
        {
          id: "5",
          name: "Ibuprofen 200mg Tablets",
          category: "Medications",
          quantity: 500,
          unit: "tablets",
          minimumStock: 100,
          currentStock: 0,
          location: "Medication Cabinet",
          expiryDate: "2025-08-15",
          status: "OUT_OF_STOCK",
        },
        {
          id: "6",
          name: "Non-latex Gloves - Large",
          category: "Protective Equipment",
          quantity: 1000,
          unit: "pairs",
          minimumStock: 200,
          currentStock: 850,
          location: "Medical Bay - Dispenser",
          status: "IN_STOCK",
        },
        {
          id: "7",
          name: "Stethoscope",
          category: "Diagnostic Equipment",
          quantity: 5,
          unit: "units",
          minimumStock: 2,
          currentStock: 5,
          location: "Medical Bay - Equipment Rack",
          status: "IN_STOCK",
        },
      ];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-green-100 text-green-800";
      case "LOW_STOCK":
        return "bg-yellow-100 text-yellow-800";
      case "OUT_OF_STOCK":
        return "bg-red-100 text-red-800";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  };

  const filteredItems = supplyItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medical Supplies Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">Loading medical supplies...</div>
        </CardContent>
      </Card>
    );
  }

  const lowStockItems = supplyItems.filter((item) => item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK");
  const expiredItems = supplyItems.filter((item) => item.status === "EXPIRED");

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">
                {lowStockItems.length} item(s) need restocking
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      {expiredItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">
                {expiredItems.length} item(s) expired - Remove from service
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Medical Supplies Inventory (MS)</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setShowImportExport(true)} size="sm" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import/Export
              </Button>
              <Button onClick={() => setShowAddForm(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Supply
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by name, category, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {SUPPLY_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="IN_STOCK">In Stock</SelectItem>
                <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Supplies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supplies List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supply Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Minimum Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      No medical supplies found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <span
                          className={
                            item.currentStock <= item.minimumStock
                              ? "font-semibold text-red-600"
                              : "font-medium"
                          }
                        >
                          {item.currentStock}
                        </span>
                      </TableCell>
                      <TableCell>{item.minimumStock}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.location || "-"}</TableCell>
                      <TableCell>{item.expiryDate || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {onRestock && (
                          <Button size="sm" variant="outline" onClick={() => onRestock(item.id)}>
                            Restock
                          </Button>
                        )}
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
          Showing {filteredItems.length} of {supplyItems.length} supply items
        </div>
      )}

      {/* Forms */}
      <MedicalSuppliesForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={() => {
          setShowAddForm(false);
        }}
      />

      <MedicalSuppliesImportExport
        open={showImportExport}
        onOpenChange={setShowImportExport}
        onSuccess={() => {
          setShowImportExport(false);
        }}
      />
    </div>
  );
}




