import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Package } from "lucide-react";

interface EquipmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EquipmentForm({ open, onOpenChange, onSuccess }: EquipmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [equipmentTypeId, setEquipmentTypeId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [status, setStatus] = useState<"OPERATIONAL" | "MAINTENANCE" | "RETIRED" | "RESERVED" | "DECOMMISSIONED">("OPERATIONAL");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const { data: equipmentTypes } = useQuery<any[]>({
    queryKey: ["/api/equipment/types"],
    queryFn: async () => {
      const res = await fetch("/api/equipment/types");
      if (!res.ok) throw new Error("Failed to fetch equipment types");
      return res.json();
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        "/api/equipment/items",
        {
          name,
          equipmentTypeId,
          serialNumber: serialNumber || undefined,
          manufacturer: manufacturer || undefined,
          model: model || undefined,
          purchaseDate: purchaseDate || undefined,
          status,
          location: location || undefined,
          notes: notes || undefined,
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/items"] });
      toast({
        title: "Success",
        description: "Equipment item created successfully",
      });
      // Reset form
      setName("");
      setEquipmentTypeId("");
      setSerialNumber("");
      setManufacturer("");
      setModel("");
      setPurchaseDate("");
      setStatus("OPERATIONAL");
      setLocation("");
      setNotes("");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create equipment item",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !equipmentTypeId) {
      toast({
        title: "Validation Error",
        description: "Name and Equipment Type are required",
        variant: "destructive",
      });
      return;
    }
    createEquipmentMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Add New Equipment</span>
          </DialogTitle>
          <DialogDescription>
            Add a new equipment item to the inventory
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Equipment name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipmentTypeId">Equipment Type *</Label>
            <Select value={equipmentTypeId} onValueChange={setEquipmentTypeId} required>
              <SelectTrigger id="equipmentTypeId">
                <SelectValue placeholder="Select equipment type" />
              </SelectTrigger>
              <SelectContent>
                {equipmentTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Serial number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATIONAL">Operational</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                  <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="Manufacturer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Model"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createEquipmentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEquipmentMutation.isPending || !name || !equipmentTypeId}
            >
              {createEquipmentMutation.isPending ? "Creating..." : "Create Equipment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}








