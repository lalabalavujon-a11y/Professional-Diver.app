import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Upload, Video, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const testimonialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  writtenTestimonial: z.string().min(100, "Please provide at least 100 characters").max(5000, "Testimonial must be less than 5000 characters"),
  videoUrl: z.string().url("Please provide a valid video URL").optional().or(z.literal("")).or(z.string().length(0)),
});

type TestimonialForm = z.infer<typeof testimonialSchema>;

export default function TestimonialsSubmit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get current user email from localStorage
  const currentEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;

  const form = useForm<TestimonialForm>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: "",
      email: currentEmail || "",
      writtenTestimonial: "",
      videoUrl: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: TestimonialForm & { videoFile?: File }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('writtenTestimonial', data.writtenTestimonial);
      if (data.videoUrl) {
        formData.append('videoUrl', data.videoUrl);
      }
      if (data.videoFile) {
        formData.append('video', data.videoFile);
      }

      const response = await fetch('/api/testimonials/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit testimonial');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      setUploadProgress(0);
      toast({
        title: "Testimonial Submitted!",
        description: "Thank you! We'll review your testimonial and add your free month once approved.",
      });
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a video file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 500MB)
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a video smaller than 500MB.",
          variant: "destructive",
        });
        return;
      }
      
      setVideoFile(file);
    }
  };

  const handleSubmit = (data: TestimonialForm) => {
    submitMutation.mutate({
      ...data,
      videoFile: videoFile || undefined,
    });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Thank You for Your Testimonial! 🎉
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  We've received your testimonial and will review it shortly.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-900">
                    <strong>What happens next?</strong>
                  </p>
                  <ul className="text-left text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                    <li>Our team will review your testimonial (usually within 48 hours)</li>
                    <li>Once approved, we'll add a FREE month to your subscription</li>
                    <li>You'll receive an email confirmation when your free month is added</li>
                    <li>Your testimonial may be featured on our landing pages and marketing materials</li>
                  </ul>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button asChild>
                    <Link href="/dashboard">Go to Dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/tracks">Continue Learning</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Earn a FREE Month! 🎁</CardTitle>
            <CardDescription className="text-center text-lg">
              Share your Professional Diver experience and get a free month added to your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>Requirements:</strong> Please provide both a written testimonial (minimum 100 characters) 
                and a video testimonial (2-3 minutes) to qualify for the free month.
              </AlertDescription>
            </Alert>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="John Doe"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="your@email.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="writtenTestimonial">
                  Written Testimonial *
                  <span className="text-sm text-gray-500 ml-2">(Minimum 100 characters)</span>
                </Label>
                <Textarea
                  id="writtenTestimonial"
                  {...form.register("writtenTestimonial")}
                  placeholder="Tell us about your experience with Professional Diver. What have you learned? How has it helped your career? What features do you find most valuable? Why would you recommend it to others?"
                  rows={8}
                  className="resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  {form.formState.errors.writtenTestimonial && (
                    <p className="text-sm text-red-600">{form.formState.errors.writtenTestimonial.message}</p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">
                    {form.watch("writtenTestimonial")?.length || 0} / 100 characters minimum
                  </p>
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Tips for a great testimonial:</strong>
                  </p>
                  <ul className="text-sm text-blue-800 mt-1 space-y-1 list-disc list-inside">
                    <li>Be specific about what you've learned or achieved</li>
                    <li>Mention features you found most valuable</li>
                    <li>Share how it's helped your career</li>
                    <li>Explain why you'd recommend it to others</li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-6">
                <Label htmlFor="videoUrl">
                  Video Testimonial URL
                  <span className="text-sm text-gray-500 ml-2">(Optional - if uploading file below, leave this empty)</span>
                </Label>
                <Input
                  id="videoUrl"
                  type="url"
                  {...form.register("videoUrl")}
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                />
                {form.formState.errors.videoUrl && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.videoUrl.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  You can provide a URL to a video hosted on YouTube, Vimeo, or similar platforms.
                </p>
              </div>

              <div className="border-t pt-6">
                <Label htmlFor="videoFile">
                  Or Upload Video File
                  <span className="text-sm text-gray-500 ml-2">(Optional - max 500MB)</span>
                </Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="videoFile" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {videoFile ? (
                        <span className="text-blue-600 font-medium">{videoFile.name}</span>
                      ) : (
                        <>
                          Click to upload or drag and drop
                          <br />
                          <span className="text-xs text-gray-500">MP4, MOV, AVI, etc. (max 500MB)</span>
                        </>
                      )}
                    </p>
                  </label>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>Video Guidelines:</strong>
                  </p>
                  <ul className="text-sm text-green-800 mt-1 space-y-1 list-disc list-inside">
                    <li>2-3 minutes in length</li>
                    <li>Speak naturally - we want your authentic voice</li>
                    <li>Mention your name and role/title</li>
                    <li>Share what makes Professional Diver special to you</li>
                    <li>Good lighting and clear audio help!</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>By submitting this testimonial, you agree to:</strong>
                </p>
                <ul className="text-sm text-amber-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Allow Professional Diver to use your testimonial in marketing materials</li>
                  <li>Use your name and/or photo (if provided) alongside the testimonial</li>
                  <li>Understand that the free month will be added within 48 hours of approval</li>
                </ul>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="flex-1"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Testimonial"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

