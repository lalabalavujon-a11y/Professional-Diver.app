import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Handshake, Mail, Building2, CheckCircle } from "lucide-react";
import Footer from "@/components/footer";

export default function PartnerInquiry() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    category: "",
    budgetRange: "",
    goals: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/sponsors/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit inquiry");
      }

      setSubmitted(true);
      toast({
        title: "Inquiry Submitted",
        description: "Thank you for your interest! We'll be in touch soon.",
      });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit inquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <Card className="text-center">
            <CardContent className="pt-12 pb-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Thank You!</h2>
              <p className="text-slate-600 mb-6">
                Your partnership inquiry has been submitted successfully. Our team will review your request and get back to you within 2-3 business days.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setLocation("/")}>Return Home</Button>
                <Button variant="outline" onClick={() => setLocation("/partners")}>
                  View Our Partners
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <Handshake className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Partner with Us</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Join leading diving companies, equipment providers, and brands in supporting professional diver education
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <Building2 className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Reach Your Audience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Connect with commercial divers, trainees, supervisors, and industry professionals actively seeking training and certification.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Mail className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Measurable Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Track impressions, clicks, and conversions with comprehensive monthly reports and analytics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Handshake className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle className="text-lg">Flexible Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Choose from Bronze, Silver, Gold, or Title tier packages with optional exclusivity and activations.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Partnership Inquiry Form</CardTitle>
            <CardDescription>
              Fill out the form below and our team will contact you to discuss partnership opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="helmets">Dive Helmets</SelectItem>
                      <SelectItem value="suits">Exposure Suits / PPE</SelectItem>
                      <SelectItem value="comms">Communications Equipment</SelectItem>
                      <SelectItem value="computers">Dive Computers</SelectItem>
                      <SelectItem value="tools">Diving Tools</SelectItem>
                      <SelectItem value="training">Training Providers</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="contractor">Diving Contractors</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budgetRange">Budget Range</Label>
                  <Select
                    value={formData.budgetRange}
                    onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="£450-£800">£450 - £800/month</SelectItem>
                      <SelectItem value="£800-£2,000">£800 - £2,000/month</SelectItem>
                      <SelectItem value="£2,000-£5,000">£2,000 - £5,000/month</SelectItem>
                      <SelectItem value="£5,000+">£5,000+/month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="goals">Primary Goals</Label>
                <Select
                  value={formData.goals}
                  onValueChange={(value) => setFormData({ ...formData, goals: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awareness">Brand Awareness</SelectItem>
                    <SelectItem value="leads">Lead Generation</SelectItem>
                    <SelectItem value="recruitment">Recruitment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message / Additional Information</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your company and partnership goals..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
