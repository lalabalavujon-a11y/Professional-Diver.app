/**
 * Medical Equipment Form Component
 * 
 * Form for adding/editing medical equipment items
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

interface MedicalEquipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  equipmentId?: string;
}

const EQUIPMENT_TYPES = [
  // Major Equipment
  "Oxygen Cylinder",
  "Defibrillator (AED)",
  "Stretcher",
  "Oxygen Regulator",
  "Bag-Valve-Mask (BVM)",
  "Medical Monitor",
  "Spine Board",
  "Suction Device",
  
  // Diagnostic Equipment
  "Stethoscope",
  "Sphygmomanometer (BP Cuff)",
  "Thermometer",
  "Otoscope",
  "Ophthalmoscope",
  "Reflex Hammer",
  "Pulse Oximeter",
  
  // Airway Management
  "Oropharyngeal Airway (OPA)",
  "Nasopharyngeal Airway (NPA)",
  "Laryngeal Mask Airway (LMA)",
  "CPR Pocket Mask",
  "Face Shield",
  
  // Oxygen Supplies
  "Oxygen Mask (Non-rebreather)",
  "Oxygen Mask (Simple)",
  "Oxygen Mask (Venturi)",
  "Nasal Cannula",
  "Oxygen Tubing",
  "Oxygen Humidifier",
  
  // Wound Care Supplies
  "Sterile Gauze Pads",
  "Gauze Rolls",
  "Adhesive Bandages",
  "Antiseptic Solution/Wipes",
  "Burn Dressings",
  "Wound Closure Strips",
  "Hemostatic Agent",
  "Adhesive Tape",
  
  // Orthopedic Supplies
  "SAM Splint",
  "Triangular Bandage",
  "Elastic Bandage (Ace Wrap)",
  "Cervical Collar",
  "Traction Splint",
  
  // Medications & Injectables
  "Epinephrine Auto-injector",
  "Pain Medication Supply",
  "Antihistamine Supply",
  "Antacid Supply",
  "Topical Antibiotic",
  "Hydrocortisone Cream",
  
  // Miscellaneous Medical Supplies
  "Non-latex Gloves",
  "Emergency Blanket",
  "Medical Scissors",
  "Tweezers",
  "Cold Compress",
  "Hot Compress",
  "Biohazard Bag",
  "Sharps Container",
  
  // Kits
  "First Aid Kit",
  "Trauma Kit",
  "Medication Kit",
  
  // Other
  "Other",
];

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_USE", label: "In Use" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "UNAVAILABLE", label: "Unavailable" },
];

export default function MedicalEquipmentForm({
  open,
  onOpenChange,
  onSuccess,
  equipmentId,
}: MedicalEquipmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    equipmentType: "",
    serialNumber: "",
    manufacturer: "",
    model: "",
    location: "",
    status: "AVAILABLE",
    pressure: "",
    capacity: "",
    expiryDate: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Mock API call - in production this would be a real API endpoint
      return new Promise((resolve) => {
        setTimeout(() => resolve({ id: equipmentId || Date.now().toString(), ...data }), 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dmt-med-ops/equipment"] });
      toast({
        title: "Success",
        description: equipmentId ? "Equipment updated successfully" : "Equipment added successfully",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save equipment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      pressure: formData.pressure ? parseFloat(formData.pressure) : undefined,
      expiryDate: formData.expiryDate || undefined,
    });
  };

  const handleReset = () => {
    setFormData({
      name: "",
      equipmentType: "",
      serialNumber: "",
      manufacturer: "",
      model: "",
      location: "",
      status: "AVAILABLE",
      pressure: "",
      capacity: "",
      expiryDate: "",
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
          <DialogTitle>{equipmentId ? "Edit Medical Equipment" : "Add Medical Equipment"}</DialogTitle>
          <DialogDescription>
            {equipmentId
              ? "Update medical equipment information"
              : "Add new medical equipment to the inventory"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Equipment Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., O2 Cylinder - Primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentType">
                Equipment Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.equipmentType}
                onValueChange={(value) => setFormData({ ...formData, equipmentType: value })}
                required
              >
                <SelectTrigger id="equipmentType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="e.g., O2-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Medical Bay"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="e.g., Linde"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g., D-Type"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pressure">Pressure (PSI/Bar)</Label>
              <Input
                id="pressure"
                type="number"
                value={formData.pressure}
                onChange={(e) => setFormData({ ...formData, pressure: e.target.value })}
                placeholder="e.g., 200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g., 10L"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                required
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
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
              {mutation.isPending ? "Saving..." : equipmentId ? "Update" : "Add Equipment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

