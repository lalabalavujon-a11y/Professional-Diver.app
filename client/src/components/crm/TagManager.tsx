import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Tag as TagIcon } from "lucide-react";

interface ClientTag {
  id: string;
  clientId: string;
  tagName: string;
  color: string;
  createdAt: number;
}

interface TagManagerProps {
  clientId: string;
  onTagsChange?: (tags: ClientTag[]) => void;
}

const TAG_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#10b981" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#eab308" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Gray", value: "#6b7280" },
];

const PRESET_TAGS = [
  { name: "Sponsor", color: "#8b5cf6" }, // Purple for sponsors
  { name: "VIP", color: "#f97316" }, // Orange for VIP
  { name: "Enterprise", color: "#6366f1" }, // Indigo for enterprise
  { name: "Training", color: "#10b981" }, // Green for training
];

export default function TagManager({ clientId, onTagsChange }: TagManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tagsData, isLoading } = useQuery<{ success: boolean; tags: ClientTag[] }>({
    queryKey: [`/api/clients/${clientId}/tags`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/clients/${clientId}/tags`);
      return response.json();
    },
  });

  const addTagMutation = useMutation({
    mutationFn: async (data: { tagName: string; color: string }) => {
      const response = await apiRequest("POST", `/api/clients/${clientId}/tags`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/tags`] });
      toast({
        title: "Tag Added",
        description: `Tag "${newTagName}" has been added.`,
      });
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0].value);
      setIsAddDialogOpen(false);
      if (tagsData?.tags && onTagsChange) {
        onTagsChange([...tagsData.tags, { id: "", clientId, tagName: newTagName, color: newTagColor, createdAt: Date.now() }]);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Tag",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await apiRequest("DELETE", `/api/clients/${clientId}/tags/${tagId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/tags`] });
      toast({
        title: "Tag Removed",
        description: "Tag has been removed from this client.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Remove Tag",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const tags = tagsData?.tags || [];

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      toast({
        title: "Tag Name Required",
        description: "Please enter a tag name.",
        variant: "destructive",
      });
      return;
    }
    addTagMutation.mutate({ tagName: newTagName.trim(), color: newTagColor });
  };

  if (isLoading) {
    return <div className="text-sm text-slate-500">Loading tags...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center">
          <TagIcon className="w-4 h-4 mr-2" />
          Tags
        </h4>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7">
              <Plus className="w-3 h-3 mr-1" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
              <DialogDescription>
                Add a tag to help organize and filter this client.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tag Name</label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g., Enterprise, VIP, Training"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag();
                    }
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <Select value={newTagColor} onValueChange={setNewTagColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TAG_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full border border-slate-300"
                            style={{ backgroundColor: color.value }}
                          />
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddTag}
                  disabled={addTagMutation.isPending || !newTagName.trim()}
                >
                  Add Tag
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tags.length === 0 ? (
        <p className="text-sm text-slate-500">No tags added yet. Click "Add Tag" to get started.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="flex items-center space-x-1 px-2 py-1"
              style={{
                backgroundColor: `${tag.color}15`,
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              <span>{tag.tagName}</span>
              <button
                onClick={() => removeTagMutation.mutate(tag.id)}
                className="ml-1 hover:bg-current/20 rounded-full p-0.5"
                aria-label={`Remove ${tag.tagName} tag`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

