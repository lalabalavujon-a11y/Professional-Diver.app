import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Upload, X, FileText, Volume2, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link as RouterLink } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lesson, Track } from "@shared/schema";

interface FileWithMapping {
  file: File;
  fileIndex: number;
  lessonId: string;
  type: 'pdf' | 'podcast';
  matchedLesson?: Lesson;
}

interface UploadResult {
  filename: string;
  success: boolean;
  error?: string;
  lessonId?: string;
  lessonTitle?: string;
  fileType?: string;
  url?: string;
  parsed?: any;
}

export default function AdminBulkUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [fileMappings, setFileMappings] = useState<Map<number, { lessonId: string; type: 'pdf' | 'podcast' }>>(new Map());
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<'manual' | 'auto'>('manual');
  const [autoMatchResults, setAutoMatchResults] = useState<UploadResult[]>([]);

  // Check admin access
  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/current"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || '';
      const response = await fetch(`/api/users/current?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  const { data: tracks } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
    enabled: isAdmin,
  });

  const { data: allLessons, refetch: refetchLessons } = useQuery<Lesson[]>({
    queryKey: ["/api/all-lessons"],
    queryFn: async () => {
      if (!tracks || tracks.length === 0) return [];
      // Fetch lessons from all tracks
      const lessonPromises = tracks.map(async (track) => {
        try {
          const response = await fetch(`/api/tracks/${track.slug}/lessons`);
          if (!response.ok) return [];
          const data = await response.json();
          return (data.lessons || []).map((lesson: any) => ({
            ...lesson,
            trackTitle: track.title,
            trackSlug: track.slug,
          }));
        } catch {
          return [];
        }
      });
      const allLessonArrays = await Promise.all(lessonPromises);
      return allLessonArrays.flat();
    },
    enabled: isAdmin && !!tracks && tracks.length > 0,
  });

  // Filter lessons by selected track
  const lessons = selectedTrackId
    ? allLessons?.filter(lesson => {
        const track = tracks?.find(t => t.id === selectedTrackId);
        return track && (lesson as any).trackSlug === track.slug;
      }) || []
    : allLessons || [];

  useEffect(() => {
    if (selectedTrackId) {
      refetchLessons();
    }
  }, [selectedTrackId, refetchLessons]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'm4a' || ext === 'mp4a' || ext === 'mp3' || ext === 'wav' || ext === 'aac' || ext === 'ogg';
    });

    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'm4a' || ext === 'mp4a' || ext === 'mp3' || ext === 'wav' || ext === 'aac' || ext === 'ogg';
    });

    setFiles(prev => [...prev, ...selectedFiles]);
    e.target.value = '';
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    const newMappings = new Map(fileMappings);
    newMappings.delete(index);
    setFileMappings(newMappings);
  };

  const getFileType = (filename: string): 'pdf' | 'podcast' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    return 'podcast';
  };

  const handleMappingChange = (fileIndex: number, lessonId: string, type: 'pdf' | 'podcast') => {
    const newMappings = new Map(fileMappings);
    newMappings.set(fileIndex, { lessonId, type });
    setFileMappings(newMappings);
  };

  const bulkUploadMutation = useMutation({
    mutationFn: async ({ files, mappings }: { files: File[]; mappings: Array<{ fileIndex: number; lessonId: string; type: 'pdf' | 'podcast' }> }) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('mappings', JSON.stringify(mappings));

      const response = await fetch('/api/lessons/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Upload Complete!",
        description: `Successfully uploaded ${data.successful} of ${data.total} files.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      // Clear files after successful upload
      setFiles([]);
      setFileMappings(new Map());
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || 'Failed to upload files',
        variant: "destructive",
      });
    },
  });

  const autoUploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/lessons/bulk-upload-auto', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Auto upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setAutoMatchResults(data.results || []);
      toast({
        title: "Auto Upload Complete!",
        description: `Successfully matched and uploaded ${data.successful} of ${data.total} files.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      if (data.failed === 0) {
        // Clear files if all succeeded
        setFiles([]);
        setFileMappings(new Map());
      }
    },
    onError: (error: any) => {
      toast({
        title: "Auto Upload Failed",
        description: error.message || 'Failed to auto-upload files',
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (uploadMode === 'auto') {
      autoUploadMutation.mutate(files);
    } else {
      const mappings = Array.from(fileMappings.entries()).map(([fileIndex, mapping]) => ({
        fileIndex,
        lessonId: mapping.lessonId,
        type: mapping.type,
      }));

      if (mappings.length !== files.length) {
        toast({
          title: "Mapping Incomplete",
          description: "Please map all files to lessons before uploading.",
          variant: "destructive",
        });
        return;
      }

      bulkUploadMutation.mutate({ files, mappings });
    }
  };

  if (!isAdmin) {
    return (
      <>
        <RoleBasedNavigation />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">Access Denied: You do not have permission to access the Bulk Upload page.</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  const isUploading = bulkUploadMutation.isPending || autoUploadMutation.isPending;
  const allMapped = files.length > 0 && files.every((_, index) => fileMappings.has(index));

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <RouterLink href="/admin">
              <Button variant="ghost" size="sm" className="mb-4">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </RouterLink>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk File Upload</h1>
            <p className="text-gray-600">Upload PDF reference guides and MP4A podcasts to lessons</p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Mode</CardTitle>
              <CardDescription>Choose between manual mapping or automatic filename matching</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={uploadMode === 'manual' ? 'default' : 'outline'}
                  onClick={() => {
                    setUploadMode('manual');
                    setAutoMatchResults([]);
                  }}
                >
                  Manual Mapping
                </Button>
                <Button
                  variant={uploadMode === 'auto' ? 'default' : 'outline'}
                  onClick={() => {
                    setUploadMode('auto');
                    setFileMappings(new Map());
                  }}
                >
                  Auto Match (Filename)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Drag and Drop Area */}
          <Card
            className={`mb-6 border-2 border-dashed transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent className="py-12 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag and drop files here, or click to select
              </p>
              <p className="text-sm text-gray-500 mb-4">
                PDF files and audio files (M4A, MP3, WAV, AAC, OGG) are supported
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.m4a,.mp4a,.mp3,.wav,.aac,.ogg"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select Files
                </label>
              </Button>
            </CardContent>
          </Card>

          {/* File List */}
          {files.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Files to Upload ({files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {uploadMode === 'manual' && (
                  <div className="mb-4">
                    <Label htmlFor="track-select">Filter by Track (Optional)</Label>
                    <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                      <SelectTrigger id="track-select" className="mt-2">
                        <SelectValue placeholder="All tracks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All tracks</SelectItem>
                        {tracks?.map(track => (
                          <SelectItem key={track.id} value={track.id}>
                            {track.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-4">
                  {files.map((file, index) => {
                    const fileType = getFileType(file.name);
                    const mapping = fileMappings.get(index);
                    const formatBytes = (bytes: number) => {
                      if (bytes === 0) return '0 Bytes';
                      const k = 1024;
                      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                      const i = Math.floor(Math.log(bytes) / Math.log(k));
                      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
                    };

                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            {fileType === 'pdf' ? (
                              <FileText className="w-5 h-5 text-red-500 mt-0.5" />
                            ) : (
                              <Volume2 className="w-5 h-5 text-blue-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <p className="text-sm text-gray-500">{formatBytes(file.size)} • {fileType.toUpperCase()}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={isUploading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {uploadMode === 'manual' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`type-${index}`}>File Type</Label>
                              <Select
                                value={mapping?.type || fileType}
                                onValueChange={(value: 'pdf' | 'podcast') => {
                                  const currentMapping = fileMappings.get(index);
                                  if (currentMapping) {
                                    handleMappingChange(index, currentMapping.lessonId, value);
                                  } else {
                                    // Create new mapping with empty lesson
                                    handleMappingChange(index, '', value);
                                  }
                                }}
                              >
                                <SelectTrigger id={`type-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pdf">PDF Reference Guide</SelectItem>
                                  <SelectItem value="podcast">Podcast Audio</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`lesson-${index}`}>Lesson</Label>
                              <Select
                                value={mapping?.lessonId || ''}
                                onValueChange={(value) => {
                                  const currentMapping = fileMappings.get(index);
                                  const type = currentMapping?.type || fileType;
                                  handleMappingChange(index, value, type);
                                }}
                              >
                                <SelectTrigger id={`lesson-${index}`}>
                                  <SelectValue placeholder="Select a lesson" />
                                </SelectTrigger>
                                <SelectContent>
                                  {lessons?.map(lesson => (
                                    <SelectItem key={lesson.id} value={lesson.id}>
                                      {lesson.title}
                                    </SelectItem>
                                  ))}
                                  {(!lessons || lessons.length === 0) && (
                                    <SelectItem value="" disabled>
                                      {selectedTrackId ? 'No lessons in this track' : 'Select a track first'}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {uploadMode === 'manual' && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={!allMapped || isUploading || files.length === 0}
                      size="lg"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload {files.length} File{files.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {uploadMode === 'auto' && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={isUploading || files.length === 0}
                      size="lg"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Auto Upload {files.length} File{files.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Auto Match Results */}
          {uploadMode === 'auto' && autoMatchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Results</CardTitle>
                <CardDescription>
                  {autoMatchResults.filter(r => r.success).length} successful,{' '}
                  {autoMatchResults.filter(r => !r.success).length} failed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {autoMatchResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{result.filename}</p>
                          {result.success ? (
                            <>
                              <p className="text-sm text-gray-600">
                                Uploaded to: <strong>{result.lessonTitle}</strong>
                              </p>
                              <p className="text-xs text-gray-500">Type: {result.fileType}</p>
                            </>
                          ) : (
                            <p className="text-sm text-red-600">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Upload Results */}
          {uploadMode === 'manual' && bulkUploadMutation.isSuccess && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Complete</CardTitle>
                <CardDescription>
                  {bulkUploadMutation.data?.successful} successful, {bulkUploadMutation.data?.failed} failed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bulkUploadMutation.data?.results?.map((result: UploadResult, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{result.filename}</p>
                          {result.success ? (
                            <p className="text-sm text-gray-600">
                              Uploaded to: <strong>{result.lessonTitle}</strong>
                            </p>
                          ) : (
                            <p className="text-sm text-red-600">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </>
  );
}

