/**
 * Welfare Component
 * 
 * Crew welfare tracking, accommodation, meals, and rest periods
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Heart,
  Plus,
  Calendar,
  Home,
  UtensilsCrossed,
  Moon,
  Edit,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface WelfareRecord {
  id: string;
  operationId: string;
  recordDate: string;
  accommodation: {
    type?: string;
    location?: string;
    facilities?: string[];
    notes?: string;
  };
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    snacks?: string;
    dietaryRequirements?: string[];
    notes?: string;
  };
  restPeriods: Array<{
    crewMember: string;
    startTime: string;
    endTime: string;
    hours: number;
  }>;
  healthNotes?: string;
}

export default function Welfare({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WelfareRecord | null>(null);
  const [formData, setFormData] = useState({
    recordDate: format(new Date(), "yyyy-MM-dd"),
    accommodation: {
      type: "",
      location: "",
      facilities: [] as string[],
      notes: "",
    },
    meals: {
      breakfast: "",
      lunch: "",
      dinner: "",
      snacks: "",
      dietaryRequirements: [] as string[],
      notes: "",
    },
    restPeriods: [] as Array<{ crewMember: string; startTime: string; endTime: string; hours: number }>,
    healthNotes: "",
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

  // Fetch welfare records
  const { data: records = [] } = useQuery<WelfareRecord[]>({
    queryKey: ["/api/dive-supervisor/welfare", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/welfare?email=${email}&operationId=${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch welfare records');
      return response.json();
    },
    enabled: !!operationId,
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<WelfareRecord>) => {
      if (!operationId) throw new Error('No operation selected');
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = editingRecord 
        ? `/api/dive-supervisor/welfare/${editingRecord.id}`
        : '/api/dive-supervisor/welfare';
      const response = await fetch(url, {
        method: editingRecord ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, operationId, email }),
      });
      if (!response.ok) throw new Error('Failed to save welfare record');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/welfare"] });
      setIsDialogOpen(false);
      setEditingRecord(null);
      resetForm();
      toast({
        title: "Success",
        description: editingRecord ? "Welfare record updated" : "Welfare record saved",
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
      const response = await fetch(`/api/dive-supervisor/welfare/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete welfare record');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/welfare"] });
      toast({ title: "Success", description: "Welfare record deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      recordDate: format(new Date(), "yyyy-MM-dd"),
      accommodation: { type: "", location: "", facilities: [], notes: "" },
      meals: { breakfast: "", lunch: "", dinner: "", snacks: "", dietaryRequirements: [], notes: "" },
      restPeriods: [],
      healthNotes: "",
    });
  };

  const handleAdd = () => {
    setEditingRecord(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (record: WelfareRecord) => {
    setEditingRecord(record);
    setFormData({
      recordDate: format(new Date(record.recordDate), "yyyy-MM-dd"),
      accommodation: record.accommodation || { type: "", location: "", facilities: [], notes: "" },
      meals: record.meals || { breakfast: "", lunch: "", dinner: "", snacks: "", dietaryRequirements: [], notes: "" },
      restPeriods: record.restPeriods || [],
      healthNotes: record.healthNotes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      recordDate: formData.recordDate,
      accommodation: formData.accommodation,
      meals: formData.meals,
      restPeriods: formData.restPeriods,
      healthNotes: formData.healthNotes,
    });
  };

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to manage welfare records</CardDescription>
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
          <h2 className="text-2xl font-bold">Welfare Management</h2>
          <p className="text-sm text-muted-foreground">
            Track crew accommodation, meals, rest periods, and health
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
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRecord ? "Edit Welfare Record" : "Add Welfare Record"}</DialogTitle>
                <DialogDescription>Document crew welfare information</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="recordDate">Record Date *</Label>
                  <Input
                    id="recordDate"
                    type="date"
                    value={formData.recordDate}
                    onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
                    required
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center space-x-2">
                      <Home className="w-4 h-4" />
                      <span>Accommodation</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>Type</Label>
                      <Input
                        value={formData.accommodation.type}
                        onChange={(e) => setFormData({
                          ...formData,
                          accommodation: { ...formData.accommodation, type: e.target.value }
                        })}
                        placeholder="Hotel, Vessel, Platform..."
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={formData.accommodation.location}
                        onChange={(e) => setFormData({
                          ...formData,
                          accommodation: { ...formData.accommodation, location: e.target.value }
                        })}
                        placeholder="Location address..."
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.accommodation.notes}
                        onChange={(e) => setFormData({
                          ...formData,
                          accommodation: { ...formData.accommodation, notes: e.target.value }
                        })}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center space-x-2">
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>Meals</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Breakfast</Label>
                        <Input
                          value={formData.meals.breakfast}
                          onChange={(e) => setFormData({
                            ...formData,
                            meals: { ...formData.meals, breakfast: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Lunch</Label>
                        <Input
                          value={formData.meals.lunch}
                          onChange={(e) => setFormData({
                            ...formData,
                            meals: { ...formData.meals, lunch: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Dinner</Label>
                        <Input
                          value={formData.meals.dinner}
                          onChange={(e) => setFormData({
                            ...formData,
                            meals: { ...formData.meals, dinner: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Snacks</Label>
                        <Input
                          value={formData.meals.snacks}
                          onChange={(e) => setFormData({
                            ...formData,
                            meals: { ...formData.meals, snacks: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Meal Notes</Label>
                      <Textarea
                        value={formData.meals.notes}
                        onChange={(e) => setFormData({
                          ...formData,
                          meals: { ...formData.meals, notes: e.target.value }
                        })}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <Label htmlFor="healthNotes">Health Notes</Label>
                  <Textarea
                    id="healthNotes"
                    value={formData.healthNotes}
                    onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                    placeholder="General health and wellbeing observations..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : editingRecord ? "Update" : "Save"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {records.map((record) => (
          <Card key={record.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {format(new Date(record.recordDate), "PPP")}
                  </CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(record)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this welfare record?")) {
                        deleteMutation.mutate(record.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {record.accommodation && (record.accommodation.type || record.accommodation.location) && (
                <div>
                  <div className="text-sm font-semibold mb-1 flex items-center space-x-1">
                    <Home className="w-4 h-4" />
                    <span>Accommodation</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {record.accommodation.type && <div>Type: {record.accommodation.type}</div>}
                    {record.accommodation.location && <div>Location: {record.accommodation.location}</div>}
                  </div>
                </div>
              )}
              {record.meals && (record.meals.breakfast || record.meals.lunch || record.meals.dinner) && (
                <div>
                  <div className="text-sm font-semibold mb-1 flex items-center space-x-1">
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Meals</span>
                  </div>
                  <div className="text-sm text-muted-foreground grid grid-cols-3 gap-2">
                    {record.meals.breakfast && <div>Breakfast: {record.meals.breakfast}</div>}
                    {record.meals.lunch && <div>Lunch: {record.meals.lunch}</div>}
                    {record.meals.dinner && <div>Dinner: {record.meals.dinner}</div>}
                  </div>
                </div>
              )}
              {record.healthNotes && (
                <div>
                  <div className="text-sm font-semibold mb-1">Health Notes</div>
                  <p className="text-sm text-muted-foreground">{record.healthNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {records.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No welfare records yet. Add your first record to track crew welfare.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}







