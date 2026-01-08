import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Save, Eye, Hash, Link, Bold, Italic, Upload, X, Volume2, ExternalLink } from "lucide-react";
import { Link as RouterLink } from "wouter";
import EnhancedMarkdownEditor from "@/components/enhanced-markdown-editor";
import type { Lesson, Track } from "@shared/schema";

export default function AdminLessonEditor() {
  const [, params] = useRoute("/admin/lessons/:id");
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(1);
  const [content, setContent] = useState("");
  const [trackId, setTrackId] = useState("");
  const [podcastUrl, setPodcastUrl] = useState<string | null>(null);
  const [podcastDuration, setPodcastDuration] = useState<number | undefined>(undefined);
  const [notebookLmUrl, setNotebookLmUrl] = useState<string | null>(null);
  const [isUploadingPodcast, setIsUploadingPodcast] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery<Lesson>({
    queryKey: ["/api/lessons", params?.id],
    enabled: !!params?.id,
  });

  const { data: tracks } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  // Initialize form when lesson data loads
  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || "");
      setOrder(lesson.order || 1);
      setContent(lesson.content || "");
      setTrackId(lesson.trackId || "");
      setPodcastUrl((lesson as any).podcastUrl || null);
      setPodcastDuration((lesson as any).podcastDuration || undefined);
      setNotebookLmUrl((lesson as any).notebookLmUrl || null);
    }
  }, [lesson]);

  const updateLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      return apiRequest("PATCH", `/api/lessons/${params?.id}`, lessonData);
    },
    onSuccess: () => {
      toast({
        title: "Lesson Updated!",
        description: "The lesson has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", params?.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update lesson. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateLessonMutation.mutate({
      title,
      order,
      content,
      trackId,
      podcastUrl,
      podcastDuration,
      notebookLmUrl,
    });
  };

  const handlePodcastFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - M4A files can have different MIME types
    const allowedMimeTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 
      'audio/mp4', 'audio/x-m4a', // M4A variants
      'audio/ogg', 'audio/aac', 'audio/webm'
    ];
    const allowedExtensions = /\.(mp3|wav|m4a|ogg|aac|mp4)$/i;
    const fileExtension = file.name.match(/\.([^.]+)$/i)?.[1]?.toLowerCase();
    
    // Check if MIME type is allowed OR if extension is .m4a/.mp4 (for M4A files)
    const isValidMimeType = allowedMimeTypes.includes(file.type) || 
                           file.type.startsWith('audio/') && (fileExtension === 'm4a' || fileExtension === 'mp4');
    const isValidExtension = allowedExtensions.test(file.name);
    
    if (!isValidMimeType && !isValidExtension) {
      toast({
        title: "Invalid File Type",
        description: `Please upload an audio file (MP3, WAV, M4A, OGG, or AAC). Detected: ${file.type || 'unknown'} (${fileExtension || 'no extension'})`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 100MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPodcast(true);
    const objectId = `lesson-${params?.id || 'new'}-podcast-${Date.now()}`;
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        objectId
      });

      const response = await fetch(`/api/objects/upload-local/${objectId}`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
      }).catch((networkError) => {
        // Handle network errors (server not reachable, CORS, etc.)
        console.error('Network error:', networkError);
        throw new Error(`Network error: ${networkError.message}. Make sure the server is running on port 5000.`);
      });

      // Check if response is ok before trying to parse JSON
      let result;
      try {
        const responseText = await response.text();
        result = responseText ? JSON.parse(responseText) : {};
      } catch (jsonError) {
        // If JSON parsing fails, use the text as error message
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(result.error || result.message || `Upload failed with status ${response.status}`);
      }
      const fileUrl = result.url || result.path || `/uploads/${result.filename}`;
      
      setPodcastUrl(fileUrl);
      
      // Try to get duration from audio file
      try {
        const audio = new Audio(fileUrl);
        audio.addEventListener('loadedmetadata', () => {
          setPodcastDuration(Math.floor(audio.duration));
        });
        audio.load();
      } catch (error) {
        console.error('Error loading audio metadata:', error);
      }
      
      toast({
        title: "Podcast Uploaded!",
        description: "The podcast file has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || error.error || 'Failed to upload podcast. Please try again.';
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploadingPodcast(false);
      // Reset file input
      e.target.value = '';
    }
  };


  if (isLoading) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="p-6 space-y-6">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </main>
        </div>
      </>
    );
  }

  if (!lesson) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-slate-500" data-testid="text-lesson-not-found">
              Lesson not found
            </p>
          </div>
        </main>
        </div>
      </>
    );
  }

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <RouterLink href="/admin">
                  <button className="text-slate-500 hover:text-slate-700" data-testid="button-back">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </RouterLink>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900" data-testid="text-editor-title">
                    Edit Lesson: {title || lesson.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Lesson {order}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={handleSave}
                  disabled={updateLessonMutation.isPending}
                  className="bg-primary-500 hover:bg-primary-600 text-white"
                  data-testid="button-save"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateLessonMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              {/* Title Field */}
              <div>
                <Label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                  Lesson Title
                </Label>
                <Input 
                  id="title"
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                  placeholder="Enter lesson title"
                  data-testid="input-title"
                />
              </div>

              {/* Order and Track Fields */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="order" className="block text-sm font-medium text-slate-700 mb-2">
                    Lesson Order
                  </Label>
                  <Input 
                    id="order"
                    type="number" 
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                    className="w-full"
                    min="1"
                    data-testid="input-order"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">
                    Track
                  </Label>
                  <Select value={trackId} onValueChange={setTrackId}>
                    <SelectTrigger data-testid="select-track">
                      <SelectValue placeholder="Select a track" />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks?.map((track: any) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Podcast Upload Section */}
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-5 h-5 text-blue-600" />
                  <Label className="text-sm font-medium text-slate-700">
                    Lesson Podcast
                  </Label>
                </div>
                
                {podcastUrl ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Podcast Uploaded</p>
                          <p className="text-xs text-slate-500">{podcastUrl}</p>
                          {podcastDuration && (
                            <p className="text-xs text-slate-500">
                              Duration: {Math.floor(podcastDuration / 60)}:{(podcastDuration % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPodcastUrl(null);
                          setPodcastDuration(undefined);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Duration in seconds (optional)"
                        value={podcastDuration || ''}
                        onChange={(e) => setPodcastDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <div className="flex flex-col items-center justify-center">
                        {isUploadingPodcast ? (
                          <>
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p className="text-sm text-slate-600">Uploading...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-slate-700">Click to upload podcast</p>
                            <p className="text-xs text-slate-500">or drag and drop</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/mp4,audio/x-m4a,audio/ogg,audio/aac,audio/webm,.mp3,.wav,.m4a,.ogg,.aac,.mp4"
                        onChange={handlePodcastFileChange}
                        disabled={isUploadingPodcast}
                      />
                    </label>
                    <p className="text-xs text-slate-500">
                      Supported formats: MP3, WAV, M4A (MP4a), OGG, AAC (Max 100MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Notebook LM Integration */}
              <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-5 h-5 text-purple-600" />
                  <Label className="text-sm font-medium text-slate-700">
                    Notebook LM Integration
                  </Label>
                </div>
                <Input
                  type="url"
                  placeholder="https://notebooklm.google.com/..."
                  value={notebookLmUrl || ''}
                  onChange={(e) => setNotebookLmUrl(e.target.value || null)}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Optional: Link to Notebook LM notebook for this lesson
                </p>
                {notebookLmUrl && (
                  <a
                    href={notebookLmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Notebook LM
                  </a>
                )}
              </div>

              {/* Enhanced Content Editor */}
              <div>
                <Label className="block text-sm font-medium text-slate-700 mb-2">
                  Lesson Content
                </Label>
                <EnhancedMarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write your lesson content using Markdown. Use the toolbar for quick formatting or keyboard shortcuts like Ctrl+B for bold. You can embed images using: ![alt text](image-url)"
                  height="600px"
                  showWordCount={true}
                  showPreview={true}
                />
                <p className="text-xs text-slate-500 mt-2">
                  💡 Tip: You can embed images directly in the content using Markdown: <code>![Description](/path/to/image.png)</code>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <RouterLink href="/admin">
                  <Button 
                    type="button" 
                    variant="ghost"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </RouterLink>
                <div className="space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    data-testid="button-save-draft"
                  >
                    Save as Draft
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateLessonMutation.isPending}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                    data-testid="button-publish"
                  >
                    {updateLessonMutation.isPending ? "Publishing..." : "Publish Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
    </>
  );
}
