import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Redirect } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Save, Eye, Hash, Link, Bold, Italic, Lock, FileText, Video, File, Link as LinkIcon, Image, Music } from "lucide-react";
import { Link as RouterLink } from "wouter";
import EnhancedMarkdownEditor from "@/components/enhanced-markdown-editor";
import LessonMediaManager, { type MediaItem } from "@/components/lesson-media-manager";
import type { Lesson, Track } from "@shared/schema";

// Extended lesson type that includes trackSlug
type LessonWithTrackSlug = Lesson & { trackSlug?: string; totalLessons?: number };

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionType: string;
  subscriptionStatus?: string;
  trialExpiresAt?: string;
};

export default function AdminLessonEditor() {
  const [, params] = useRoute("/admin/lessons/:id");
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState(1);
  const [content, setContent] = useState("");
  const [trackId, setTrackId] = useState("");
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [documents, setDocuments] = useState<MediaItem[]>([]);
  const [embeds, setEmbeds] = useState<MediaItem[]>([]);
  const [links, setLinks] = useState<MediaItem[]>([]);
  const [images, setImages] = useState<MediaItem[]>([]);
  const [audio, setAudio] = useState<MediaItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user to check admin access
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Get access permissions for Partner Admins
  const { data: accessPermissions } = useQuery({
    queryKey: ["/api/users/access-permissions"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/users/access-permissions?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch access permissions');
      return response.json();
    },
    enabled: currentUser?.role === 'PARTNER_ADMIN' || currentUser?.role === 'SUPERVISOR'
  });

  // Check if user has admin access (Super Admin, Admin, or Partner Admin with contentEditor permission)
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN' || isSuperAdmin;
  const isPartnerAdmin = currentUser?.role === 'PARTNER_ADMIN';
  const hasContentEditorAccess = 
    isAdmin || 
    isSuperAdmin ||
    (isPartnerAdmin && accessPermissions?.contentEditor === true);

  const { data: lesson, isLoading } = useQuery<LessonWithTrackSlug>({
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
      
      // Parse media fields from JSON (handle both string and object formats)
      const parseMedia = (field: any): MediaItem[] => {
        if (!field) return [];
        if (typeof field === 'string') {
          try {
            return JSON.parse(field);
          } catch {
            return [];
          }
        }
        return Array.isArray(field) ? field : [];
      };

      setVideos(parseMedia((lesson as any).videos));
      setDocuments(parseMedia((lesson as any).documents));
      setEmbeds(parseMedia((lesson as any).embeds));
      setLinks(parseMedia((lesson as any).links));
      setImages(parseMedia((lesson as any).images));
      setAudio(parseMedia((lesson as any).audio));
    }
  }, [lesson]);

  const updateLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      // Include user email for authorization
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const url = `/api/lessons/${params?.id}?email=${encodeURIComponent(email)}`;
      
      // Log what we're sending for debugging
      console.log('Sending lesson update:', {
        id: params?.id,
        dataKeys: Object.keys(lessonData),
        hasContent: !!lessonData.content,
        contentLength: lessonData.content ? String(lessonData.content).length : 0,
        contentPreview: lessonData.content ? String(lessonData.content).substring(0, 100) : '',
        videos: lessonData.videos,
        documents: lessonData.documents,
        videosType: typeof lessonData.videos,
        documentsType: typeof lessonData.documents,
        documentsIsArray: Array.isArray(lessonData.documents),
        documentsLength: Array.isArray(lessonData.documents) ? lessonData.documents.length : 'not array'
      });
      
      try {
        const response = await apiRequest("PATCH", url, lessonData);
        // apiRequest returns Response, we need to parse JSON
        const json = await response.json();
        return json;
      } catch (error: any) {
        console.error('API request error:', error);
        // Try to extract error details from the error message
        let errorDetails = null;
        if (error.message) {
          try {
            // Error message might contain JSON
            const match = error.message.match(/\{.*\}/);
            if (match) {
              errorDetails = JSON.parse(match[0]);
            }
          } catch (e) {
            // Not JSON, that's fine
          }
        }
        throw { ...error, errorDetails };
      }
    },
    onSuccess: () => {
      toast({
        title: "Lesson Updated!",
        description: "The lesson has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons", params?.id] });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Try to extract error from response if it's a fetch error
      let errorMessage = "Failed to update lesson. Please try again.";
      let errorDetails = null;
      
      if (error?.message) {
        // Check if error message contains JSON
        try {
          const jsonMatch = error.message.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const errorObj = JSON.parse(jsonMatch[0]);
            errorMessage = errorObj.message || errorObj.error || error.message;
            errorDetails = errorObj.details;
          } else {
            errorMessage = error.message;
          }
        } catch (e) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorDetails ? `${errorMessage}\n\nDetails: ${JSON.stringify(errorDetails, null, 2)}` : errorMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds to allow reading
      });
    },
  });

  const handleSave = () => {
    updateLessonMutation.mutate({
      title,
      order,
      content,
      trackId,
      videos,
      documents,
      embeds,
      links,
      images,
      audio,
    });
  };


  // Show loading state while checking user access
  if (isLoadingUser || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
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
    );
  }

  // Check access - redirect if not authorized
  if (!hasContentEditorAccess) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-12 text-center">
              <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Access Denied</h2>
              <p className="text-slate-600 mb-6">
                You don't have permission to edit lesson content. This feature is only available to administrators.
              </p>
              <RouterLink href={params?.id ? `/lessons/${params.id}` : "/tracks"}>
                <Button variant="outline">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Lesson
                </Button>
              </RouterLink>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
        <RoleBasedNavigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-slate-500" data-testid="text-lesson-not-found">
              Lesson not found
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans">
      <RoleBasedNavigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <RouterLink href={lesson?.trackSlug ? `/tracks/${lesson.trackSlug}` : "/tracks"}>
                  <Button 
                    variant="ghost" 
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100" 
                    data-testid="button-back"
                  >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
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

              {/* Content and Media Tabs */}
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="content" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Videos
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2">
                    <File className="w-4 h-4" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Media
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <div>
                    <Label className="block text-sm font-medium text-slate-700 mb-2">
                      Lesson Content
                    </Label>
                    <EnhancedMarkdownEditor
                      value={content}
                      onChange={setContent}
                      placeholder="Write your lesson content using Markdown. Use the toolbar for quick formatting or keyboard shortcuts like Ctrl+B for bold."
                      height="600px"
                      showWordCount={true}
                      showPreview={true}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="videos" className="space-y-4 mt-4">
                  <LessonMediaManager
                    type="videos"
                    items={videos}
                    onChange={setVideos}
                    title="Videos"
                    description="Add video content to your lesson. Upload video files or link to external video URLs."
                  />
                </TabsContent>

                <TabsContent value="documents" className="space-y-4 mt-4">
                  <LessonMediaManager
                    type="documents"
                    items={documents}
                    onChange={setDocuments}
                    title="Documents"
                    description="Add downloadable documents like PDFs, DOCX files, and other resources."
                  />
                </TabsContent>

                <TabsContent value="media" className="space-y-4 mt-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        Images
                      </h3>
                      <LessonMediaManager
                        type="images"
                        items={images}
                        onChange={setImages}
                        title="Images"
                        description="Add images to your lesson. Upload image files or link to external image URLs."
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5" />
                        Links
                      </h3>
                      <LessonMediaManager
                        type="links"
                        items={links}
                        onChange={setLinks}
                        title="Links"
                        description="Add external links to relevant resources, websites, or additional content."
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        Embeds
                      </h3>
                      <LessonMediaManager
                        type="embeds"
                        items={embeds}
                        onChange={setEmbeds}
                        title="Embeds"
                        description="Embed YouTube videos, Vimeo videos, or other iframe content directly in your lesson."
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Audio
                      </h3>
                      <LessonMediaManager
                        type="audio"
                        items={audio}
                        onChange={setAudio}
                        title="Audio"
                        description="Add audio files like podcasts, recordings, or sound effects to your lesson."
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <RouterLink href={lesson?.trackSlug ? `/tracks/${lesson.trackSlug}` : "/tracks"}>
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
                    onClick={handleSave}
                    disabled={updateLessonMutation.isPending}
                    variant="outline"
                    data-testid="button-save-draft"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateLessonMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Clicking "Save Changes" will immediately update the lesson. 
                  All changes are saved directly to the database and will be visible to users immediately.
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
