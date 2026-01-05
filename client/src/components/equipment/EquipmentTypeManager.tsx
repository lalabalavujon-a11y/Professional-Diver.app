import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Settings } from "lucide-react";

interface EquipmentType {
  id: string;
  name: string;
  description?: string | null;
  defaultMaintenanceInterval?: string | null;
}

export default function EquipmentTypeManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: types, isLoading } = useQuery<EquipmentType[]>({
    queryKey: ["/api/equipment/types"],
    queryFn: async () => {
      const res = await fetch("/api/equipment/types");
      if (!res.ok) throw new Error("Failed to fetch equipment types");
      return res.json();
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/equipment/types", {
        name,
        description: description || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment/types"] });
      toast({
        title: "Success",
        description: "Equipment type created successfully",
      });
      setName("");
      setDescription("");
      setShowAddDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create equipment type",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipment Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">Loading equipment types...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Equipment Types</span>
          </CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Equipment Type</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="typeName">Name *</Label>
                  <Input
                    id="typeName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Diving Helmet, Umbilical, Cylinder"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="typeDescription">Description</Label>
                  <Textarea
                    id="typeDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description of this equipment type"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={() => createTypeMutation.mutate()}
                  disabled={!name || createTypeMutation.isPending}
                  className="w-full"
                >
                  {createTypeMutation.isPending ? "Creating..." : "Create Type"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!types || types.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No equipment types configured. Add your first equipment type to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {types.map((type) => (
              <div key={type.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    {type.description && (
                      <p className="text-sm text-slate-600 mt-1">{type.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
