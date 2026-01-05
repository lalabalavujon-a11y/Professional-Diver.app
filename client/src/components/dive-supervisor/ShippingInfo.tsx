/**
 * Shipping Info Component
 * 
 * Vessel traffic, shipping schedules, and port operations
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Ship,
  Plus,
  Calendar,
  Edit,
  Trash2,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ShippingInfo {
  id: string;
  operationId: string;
  vesselName?: string;
  vesselType?: string;
  eta?: string;
  etd?: string;
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
}

export default function ShippingInfo({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState<ShippingInfo | null>(null);
  const [formData, setFormData] = useState({
    vesselName: "",
    vesselType: "",
    eta: "",
    etd: "",
    contact: {
      name: "",
      phone: "",
      email: "",
    },
    notes: "",
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

  // Fetch shipping info
  const { data: shippingInfo = [] } = useQuery<ShippingInfo[]>({
    queryKey: ["/api/dive-supervisor/shipping", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/shipping?email=${email}&operationId=${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch shipping info');
      return response.json();
    },
    enabled: !!operationId,
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<ShippingInfo>) => {
      if (!operationId) throw new Error('No operation selected');
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = editingInfo 
        ? `/api/dive-supervisor/shipping/${editingInfo.id}`
        : '/api/dive-supervisor/shipping';
      const response = await fetch(url, {
        method: editingInfo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, operationId, email }),
      });
      if (!response.ok) throw new Error('Failed to save shipping info');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/shipping"] });
      setIsDialogOpen(false);
      setEditingInfo(null);
      setFormData({
        vesselName: "",
        vesselType: "",
        eta: "",
        etd: "",
        contact: { name: "", phone: "", email: "" },
        notes: "",
      });
      toast({
        title: "Success",
        description: editingInfo ? "Shipping info updated" : "Shipping info added",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/dive-supervisor/shipping/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete shipping info');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/shipping"] });
      toast({ title: "Success", description: "Shipping info deleted" });
    },
  });

  const handleAdd = () => {
    setEditingInfo(null);
    setFormData({
      vesselName: "",
      vesselType: "",
      eta: "",
      etd: "",
      contact: { name: "", phone: "", email: "" },
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (info: ShippingInfo) => {
    setEditingInfo(info);
    setFormData({
      vesselName: info.vesselName || "",
      vesselType: info.vesselType || "",
      eta: info.eta ? format(new Date(info.eta), "yyyy-MM-dd'T'HH:mm") : "",
      etd: info.etd ? format(new Date(info.etd), "yyyy-MM-dd'T'HH:mm") : "",
      contact: info.contact || { name: "", phone: "", email: "" },
      notes: info.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      vesselName: formData.vesselName,
      vesselType: formData.vesselType,
      eta: formData.eta ? new Date(formData.eta).toISOString() : undefined,
      etd: formData.etd ? new Date(formData.etd).toISOString() : undefined,
      contact: formData.contact,
      notes: formData.notes,
    });
  };

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to manage shipping information</CardDescription>
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
          <h2 className="text-2xl font-bold">Shipping Information</h2>
          <p className="text-sm text-muted-foreground">
            Track vessel traffic, shipping schedules, and port operations
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add Vessel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingInfo ? "Edit Shipping Info" : "Add Shipping Info"}</DialogTitle>
                <DialogDescription>Record vessel traffic and shipping information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vesselName">Vessel Name</Label>
                    <Input
                      id="vesselName"
                      value={formData.vesselName}
                      onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vesselType">Vessel Type</Label>
                    <Input
                      id="vesselType"
                      value={formData.vesselType}
                      onChange={(e) => setFormData({ ...formData, vesselType: e.target.value })}
                      placeholder="Container ship, Tanker, etc."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eta">ETA (Estimated Time of Arrival)</Label>
                    <Input
                      id="eta"
                      type="datetime-local"
                      value={formData.eta}
                      onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="etd">ETD (Estimated Time of Departure)</Label>
                    <Input
                      id="etd"
                      type="datetime-local"
                      value={formData.etd}
                      onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Contact Information</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <Input
                      placeholder="Contact Name"
                      value={formData.contact.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, name: e.target.value }
                      })}
                    />
                    <Input
                      type="tel"
                      placeholder="Phone"
                      value={formData.contact.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, phone: e.target.value }
                      })}
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={formData.contact.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        contact: { ...formData.contact, email: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : editingInfo ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Shipping Info List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shippingInfo.map((info) => (
          <Card key={info.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Ship className="w-5 h-5" />
                    <span>{info.vesselName || "Unnamed Vessel"}</span>
                  </CardTitle>
                  {info.vesselType && (
                    <Badge variant="secondary" className="mt-1">
                      {info.vesselType}
                    </Badge>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(info)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this shipping info?")) {
                        deleteMutation.mutate(info.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {info.eta && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>ETA: {format(new Date(info.eta), "PPp")}</span>
                </div>
              )}
              {info.etd && (
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>ETD: {format(new Date(info.etd), "PPp")}</span>
                </div>
              )}
              {info.contact && (info.contact.name || info.contact.phone || info.contact.email) && (
                <div>
                  <div className="text-sm font-semibold mb-1">Contact</div>
                  <div className="text-sm text-muted-foreground">
                    {info.contact.name && <div>{info.contact.name}</div>}
                    {info.contact.phone && <div>Phone: {info.contact.phone}</div>}
                    {info.contact.email && <div>Email: {info.contact.email}</div>}
                  </div>
                </div>
              )}
              {info.notes && (
                <div>
                  <div className="text-sm font-semibold mb-1">Notes</div>
                  <p className="text-sm text-muted-foreground">{info.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {shippingInfo.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ship className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No shipping information recorded yet. Add vessel traffic information.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

