/**
 * Tool Box Talks Component
 * 
 * Safety briefing documentation with sign-off tracking
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
  ClipboardList,
  Plus,
  Calendar,
  Users,
  FileText,
  Edit,
  Trash2,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useTeamMembers } from "./hooks/useTeamMembers";

interface ToolBoxTalk {
  id: string;
  operationId: string;
  talkDate: string;
  topics: string[];
  attendees: Array<{ name: string; role: string }>;
  presenter: string;
  signOffs: Array<{ name: string; signature: string; date: string }>;
  notes?: string;
}

export default function ToolBoxTalks({ 
  operationId, 
  onOperationSelect 
}: { 
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { teamMembers } = useTeamMembers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTalk, setEditingTalk] = useState<ToolBoxTalk | null>(null);
  const [formData, setFormData] = useState({
    talkDate: format(new Date(), "yyyy-MM-dd"),
    topics: [] as string[],
    topicsText: "",
    attendees: [] as Array<{ name: string; role: string }>,
    attendeesText: "",
    presenter: "",
    signOffs: [] as Array<{ name: string; signature: string; date: string }>,
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

  // Fetch toolbox talks
  const { data: talks = [] } = useQuery<ToolBoxTalk[]>({
    queryKey: ["/api/dive-supervisor/toolbox-talks", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/toolbox-talks?email=${email}&operationId=${operationId}`);
      if (!response.ok) throw new Error('Failed to fetch toolbox talks');
      return response.json();
    },
    enabled: !!operationId,
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<ToolBoxTalk>) => {
      if (!operationId) throw new Error('No operation selected');
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = editingTalk 
        ? `/api/dive-supervisor/toolbox-talks/${editingTalk.id}`
        : '/api/dive-supervisor/toolbox-talks';
      const response = await fetch(url, {
        method: editingTalk ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, operationId, email }),
      });
      if (!response.ok) throw new Error('Failed to save toolbox talk');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/toolbox-talks"] });
      setIsDialogOpen(false);
      setEditingTalk(null);
      resetForm();
      toast({
        title: "Success",
        description: editingTalk ? "Toolbox talk updated" : "Toolbox talk recorded",
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
      const response = await fetch(`/api/dive-supervisor/toolbox-talks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete toolbox talk');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dive-supervisor/toolbox-talks"] });
      toast({ title: "Success", description: "Toolbox talk deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      talkDate: format(new Date(), "yyyy-MM-dd"),
      topics: [],
      topicsText: "",
      attendees: [],
      attendeesText: "",
      presenter: "",
      signOffs: [],
      notes: "",
    });
  };

  const handleAdd = () => {
    setEditingTalk(null);
    // Auto-populate attendees from team members
    const autoAttendees = teamMembers.map(member => ({
      name: member.name,
      role: member.role || "DIVER",
    }));
    setFormData({
      talkDate: format(new Date(), "yyyy-MM-dd"),
      topics: [],
      topicsText: "",
      attendees: autoAttendees,
      attendeesText: JSON.stringify(autoAttendees, null, 2),
      presenter: "",
      signOffs: [],
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (talk: ToolBoxTalk) => {
    setEditingTalk(talk);
    setFormData({
      talkDate: format(new Date(talk.talkDate), "yyyy-MM-dd"),
      topics: talk.topics || [],
      topicsText: (talk.topics || []).join(", "),
      attendees: talk.attendees || [],
      attendeesText: JSON.stringify(talk.attendees || [], null, 2),
      presenter: talk.presenter,
      signOffs: talk.signOffs || [],
      notes: talk.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const topics = formData.topicsText.split(",").map(t => t.trim()).filter(t => t);
    let attendees = formData.attendees;
    try {
      if (formData.attendeesText) {
        attendees = JSON.parse(formData.attendeesText);
      }
    } catch {
      // Use existing attendees if JSON parse fails
    }
    mutation.mutate({
      talkDate: formData.talkDate,
      topics,
      attendees,
      presenter: formData.presenter,
      signOffs: formData.signOffs,
      notes: formData.notes,
    });
  };

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to manage toolbox talks</CardDescription>
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
          <h2 className="text-2xl font-bold">Tool Box Talks</h2>
          <p className="text-sm text-muted-foreground">
            Document safety briefings with attendee sign-off tracking
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
                Record Talk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTalk ? "Edit Toolbox Talk" : "Record Toolbox Talk"}</DialogTitle>
                <DialogDescription>Document safety briefing details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="talkDate">Talk Date *</Label>
                  <Input
                    id="talkDate"
                    type="date"
                    value={formData.talkDate}
                    onChange={(e) => setFormData({ ...formData, talkDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="presenter">Presenter *</Label>
                  <Input
                    id="presenter"
                    value={formData.presenter}
                    onChange={(e) => setFormData({ ...formData, presenter: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="topicsText">Topics (comma-separated) *</Label>
                  <Input
                    id="topicsText"
                    value={formData.topicsText}
                    onChange={(e) => setFormData({ ...formData, topicsText: e.target.value })}
                    placeholder="Safety procedures, Emergency response, Equipment checks..."
                    required
                  />
                </div>
                <div>
                  <Label>Attendees (JSON array)</Label>
                  <Textarea
                    value={formData.attendeesText}
                    onChange={(e) => setFormData({ ...formData, attendeesText: e.target.value })}
                    placeholder='[{"name": "John Doe", "role": "Diver"}, ...]'
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : editingTalk ? "Update" : "Record"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Talks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {talks.map((talk) => (
          <Card key={talk.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {format(new Date(talk.talkDate), "PPP")}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Presented by: {talk.presenter}
                  </CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(talk)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Delete this toolbox talk?")) {
                        deleteMutation.mutate(talk.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {talk.topics && talk.topics.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-1">Topics</div>
                  <div className="flex flex-wrap gap-1">
                    {talk.topics.map((topic, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {talk.attendees && talk.attendees.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-1">Attendees ({talk.attendees.length})</div>
                  <div className="text-sm text-muted-foreground">
                    {talk.attendees.map((a, idx) => (
                      <div key={idx}>{a.name} ({a.role})</div>
                    ))}
                  </div>
                </div>
              )}
              {talk.signOffs && talk.signOffs.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-1 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Sign-offs ({talk.signOffs.length})</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {talks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No toolbox talks recorded yet. Record your first safety briefing.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

