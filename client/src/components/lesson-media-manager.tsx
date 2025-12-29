import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Video, 
  File, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Music,
  ExternalLink,
  GripVertical
} from "lucide-react";
// import { ObjectUploader } from "./ObjectUploader"; // Temporarily disabled for build
import { useToast } from "@/hooks/use-toast";

export interface MediaItem {
  id: string;
  title?: string;
  url: string;
  description?: string;
  order?: number;
  // Video specific
  duration?: string;
  thumbnail?: string;
  // Document specific
  type?: string;
  size?: string;
  // Embed specific
  embedType?: "youtube" | "vimeo" | "iframe" | "other";
  // Image specific
  alt?: string;
  caption?: string;
  // Audio specific
  audioDuration?: string;
}

interface LessonMediaManagerProps {
  type: "videos" | "documents" | "embeds" | "links" | "images" | "audio";
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  title: string;
  description?: string;
}

export default function LessonMediaManager({
  type,
  items,
  onChange,
  title,
  description
}: LessonMediaManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const { toast } = useToast();

  const handleAdd = () => {
    const newItem: MediaItem = {
      id: `new-${Date.now()}`,
      url: "",
      title: "",
      description: "",
      order: items.length,
    };
    setEditingItem(newItem);
    setEditingId(newItem.id);
  };

  const handleSave = () => {
    if (!editingItem) return;
    
    if (!editingItem.url.trim()) {
      toast({
        title: "Error",
        description: "URL is required",
        variant: "destructive",
      });
      return;
    }

    const updatedItems = editingId && editingId.startsWith("new-")
      ? [...items, { ...editingItem, id: `item-${Date.now()}` }]
      : items.map(item => item.id === editingId ? editingItem : item);

    onChange(updatedItems);
    setEditingId(null);
    setEditingItem(null);
    toast({
      title: "Success",
      description: `${title} item saved`,
    });
  };

  const handleDelete = (id: string) => {
    onChange(items.filter(item => item.id !== id));
    toast({
      title: "Deleted",
      description: `${title} item removed`,
    });
  };

  const handleEdit = (item: MediaItem) => {
    setEditingItem({ ...item });
    setEditingId(item.id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingItem(null);
  };

  const handleFileUpload = async (uploadResult: any) => {
    if (!editingItem) return;
    
    // Extract URL from upload result
    const fileUrl = uploadResult.successful?.[0]?.uploadURL || uploadResult.successful?.[0]?.url;
    if (fileUrl) {
      setEditingItem({ ...editingItem, url: fileUrl });
      toast({
        title: "File uploaded",
        description: "File URL has been added",
      });
    }
  };

  const getIcon = () => {
    switch (type) {
      case "videos": return <Video className="w-5 h-5" />;
      case "documents": return <File className="w-5 h-5" />;
      case "embeds": return <ExternalLink className="w-5 h-5" />;
      case "links": return <LinkIcon className="w-5 h-5" />;
      case "images": return <ImageIcon className="w-5 h-5" />;
      case "audio": return <Music className="w-5 h-5" />;
    }
  };

  const renderEditForm = () => {
    if (!editingItem) return null;

    return (
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getIcon()}
              {editingId?.startsWith("new-") ? `Add New ${title}` : `Edit ${title}`}
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL *</Label>
            <Input
              value={editingItem.url}
              onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
              placeholder="https://..."
            />
            {(type === "images" || type === "documents" || type === "videos" || type === "audio") && (
              <div className="mt-2">
                <p className="text-sm text-slate-500 mb-2">
                  File upload will be available after deployment. For now, paste the file URL directly above.
                </p>
                {/* File upload will be re-enabled after fixing Uppy build issue */}
              </div>
            )}
          </div>

          <div>
            <Label>Title</Label>
            <Input
              value={editingItem.title || ""}
              onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
              placeholder="Enter title"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={editingItem.description || ""}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          {type === "videos" && (
            <>
              <div>
                <Label>Duration (e.g., 12:45)</Label>
                <Input
                  value={editingItem.duration || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, duration: e.target.value })}
                  placeholder="12:45"
                />
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  value={editingItem.thumbnail || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, thumbnail: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </>
          )}

          {type === "documents" && (
            <>
              <div>
                <Label>File Type (e.g., PDF, DOCX)</Label>
                <Input
                  value={editingItem.type || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                  placeholder="PDF"
                />
              </div>
              <div>
                <Label>File Size (e.g., 2.3 MB)</Label>
                <Input
                  value={editingItem.size || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, size: e.target.value })}
                  placeholder="2.3 MB"
                />
              </div>
            </>
          )}

          {type === "embeds" && (
            <div>
              <Label>Embed Type</Label>
              <select
                value={editingItem.embedType || "other"}
                onChange={(e) => setEditingItem({ ...editingItem, embedType: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="iframe">iFrame</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {type === "images" && (
            <>
              <div>
                <Label>Alt Text</Label>
                <Input
                  value={editingItem.alt || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, alt: e.target.value })}
                  placeholder="Descriptive alt text"
                />
              </div>
              <div>
                <Label>Caption</Label>
                <Input
                  value={editingItem.caption || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, caption: e.target.value })}
                  placeholder="Image caption"
                />
              </div>
            </>
          )}

          {type === "audio" && (
            <div>
              <Label>Duration (e.g., 5:30)</Label>
              <Input
                value={editingItem.audioDuration || ""}
                onChange={(e) => setEditingItem({ ...editingItem, audioDuration: e.target.value })}
                placeholder="5:30"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {getIcon()}
            {title}
          </h3>
          {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>
        {!editingId && (
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add {title.slice(0, -1)}
          </Button>
        )}
      </div>

      {editingId && renderEditForm()}

      <div className="space-y-2">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              No {title.toLowerCase()} added yet. Click "Add {title.slice(0, -1)}" to get started.
            </CardContent>
          </Card>
        ) : (
          items.map((item, index) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GripVertical className="w-4 h-4 text-slate-400" />
                      <h4 className="font-medium">{item.title || `Item ${index + 1}`}</h4>
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-600 mb-2">{item.description}</p>
                    )}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {item.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {type === "videos" && item.duration && (
                      <span className="text-xs text-slate-500 ml-2">Duration: {item.duration}</span>
                    )}
                    {type === "documents" && item.type && (
                      <span className="text-xs text-slate-500 ml-2">{item.type} • {item.size}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(item)}
                      disabled={!!editingId}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      disabled={!!editingId}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

