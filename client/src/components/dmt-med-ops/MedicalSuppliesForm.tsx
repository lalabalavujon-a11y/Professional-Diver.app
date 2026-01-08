/**
 * Medical Supplies Form Component
 * 
 * Form for adding/editing medical supplies (consumables)
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { MedicalSupplyItem } from "./MedicalSuppliesInventory";

interface MedicalSuppliesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  supplyId?: string;
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

const UNITS = [
  "units",
  "pads",
  "masks",
  "pairs",
  "tablets",
  "bottles",
  "boxes",
  "rolls",
  "splints",
  "bandages",
  "tubes",
  "vials",
  "syringes",
  "other",
];

export default function MedicalSuppliesForm({
  open,
  onOpenChange,
  onSuccess,
  supplyId,
}: MedicalSuppliesFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "units",
    minimumStock: "",
    currentStock: "",
    location: "",
    expiryDate: "",
    batchNumber: "",
    supplier: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: supplyId || Date.now().toString(), ...data }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmt-med-ops/supplies"] });
      toast({
        title: "Success",
        description: supplyId ? "Supply updated successfully" : "Supply added successfully",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save supply",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentStock = parseInt(formData.currentStock);
    const minimumStock = parseInt(formData.minimumStock);
    let status: MedicalSupplyItem["status"] = "IN_STOCK";
    
    if (currentStock === 0) {
      status = "OUT_OF_STOCK";
    } else if (currentStock <= minimumStock) {
      status = "LOW_STOCK";
    }
    
    // Check expiry date
    if (formData.expiryDate) {
      const expiry = new Date(formData.expiryDate);
      const today = new Date();
      if (expiry < today) {
        status = "EXPIRED";
      }
    }

    mutation.mutate({
      ...formData,
      quantity: parseInt(formData.quantity) || 0,
      minimumStock: parseInt(formData.minimumStock) || 0,
      currentStock: parseInt(formData.currentStock) || 0,
      status,
      expiryDate: formData.expiryDate || undefined,
    });
  };

  const handleReset = () => {
    setFormData({
      name: "",
      category: "",
      quantity: "",
      unit: "units",
      minimumStock: "",
      currentStock: "",
      location: "",
      expiryDate: "",
      batchNumber: "",
      supplier: "",
      notes: "",
    });
  };

  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplyId ? "Edit Medical Supply" : "Add Medical Supply"}</DialogTitle>
          <DialogDescription>
            {supplyId
              ? "Update medical supply information"
              : "Add new medical supply to the inventory"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Supply Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Sterile Gauze Pads 4x4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLY_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Total Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g., 500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentStock">
                Current Stock <span className="text-red-500">*</span>
              </Label>
              <Input
                id="currentStock"
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                required
                placeholder="e.g., 450"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">
                Unit <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
                required
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minimumStock">
                Minimum Stock Level <span className="text-red-500">*</span>
              </Label>
              <Input
                id="minimumStock"
                type="number"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                required
                placeholder="e.g., 100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Storage Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Medical Bay - Shelf A"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g., GAU-2024-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="e.g., MedSupply Co."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or comments..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : supplyId ? "Update" : "Add Supply"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}




