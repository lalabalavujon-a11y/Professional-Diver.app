import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Share2,
  MessageSquare,
  Mail,
  Users,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  Lightbulb,
  Globe,
  Video,
  FileText,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Copy,
  ExternalLink,
  BookOpen,
  DollarSign,
  AlertTriangle,
  Heart,
  Sparkles,
  Megaphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AffiliateSharingGuideProps {
  referralLink: string;
  affiliateCode: string;
}

export default function AffiliateSharingGuide({ referralLink, affiliateCode }: AffiliateSharingGuideProps) {
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTemplate(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  // Message templates for different platforms
  const messageTemplates = {
    linkedin: {
      title: "LinkedIn Post",
      template: `As a diving professional, I'm always looking for ways to improve my skills and stay current with industry standards.

I've been using Professional Diver Training for my continued education, and it's been a game-changer. The AI-powered tutors, practice scenarios, and comprehensive NDT training modules have helped me advance my career.

If you're in the diving industry and looking to upskill, I'd recommend checking it out. They offer certifications in NDT, Diver Medic, Commercial Dive Supervision, and more.

Learn more: ${referralLink}

#DivingIndustry #ProfessionalDevelopment #NDT #CommercialDiving #CareerGrowth`,
    },
    twitter: {
      title: "Twitter/X Post",
      template: `Leveling up my diving career with @ProDiverTraining! AI tutors, interactive practice scenarios, and industry-recognized certifications.

If you're a diving professional looking to advance, check it out: ${referralLink}

#CommercialDiving #NDT #DiverTraining`,
    },
    facebook: {
      title: "Facebook Post",
      template: `Hey diving community!

I wanted to share a training platform that's been helping me advance my career - Professional Diver Training. They offer comprehensive courses in NDT inspection, Diver Medic certification, Commercial Dive Supervision, and more.

What I love about it:
- AI-powered tutors that adapt to your learning style
- Interactive practice scenarios
- Podcast lessons you can listen to on the go
- Industry-recognized certifications

If you're looking to upskill or get certified, check it out here: ${referralLink}

Happy diving! 🤿`,
    },
    instagram: {
      title: "Instagram Caption",
      template: `Investing in my diving career 📚🤿

Just completed another certification module on Professional Diver Training. The AI tutors make learning efficient, and the practice scenarios are incredibly realistic.

Whether you're looking to get NDT certified, become a Diver Medic, or advance to Dive Supervisor - they've got you covered.

Link in bio or DM me for the signup link!

#DivingLife #CommercialDiver #NDTInspector #DiverMedic #CareerDevelopment #ProfessionalDiver #DivingCertification #UnderwaterProfessional`,
    },
    email: {
      title: "Email Template",
      template: `Subject: Training platform I've been using - thought you'd find it valuable

Hi [Name],

I hope this email finds you well! I wanted to share something that's been really valuable for my diving career.

I've been using Professional Diver Training (${referralLink}) for my continued education and certifications. It's an AI-powered training platform specifically designed for diving professionals.

What makes it stand out:
- Comprehensive courses in NDT, Diver Medic, Commercial Dive Supervision
- AI tutors that adapt to your learning pace
- Interactive practice scenarios with real-world situations
- Podcast lessons for learning on the go
- Industry-recognized certifications

I know you've been looking to [get certified / advance your career / stay current with training], so I thought this might be helpful.

If you sign up through my link, you'll be supporting my journey while getting access to the same great training.

Let me know if you have any questions - happy to share more about my experience!

Best,
[Your Name]`,
    },
    directMessage: {
      title: "Direct Message",
      template: `Hey! Just wanted to share something that's been helping me with my diving career.

I've been using this training platform called Professional Diver Training - it has AI tutors, practice scenarios, and certifications for NDT, Diver Medic, Dive Supervisor, etc.

Thought you might find it useful: ${referralLink}

No pressure at all - just wanted to share since I know you're into diving!`,
    },
    forum: {
      title: "Forum/Community Post",
      template: `[Discussion] Training Resources for Diving Professionals

Hey everyone,

I've been looking for quality online training resources for continued education in the diving industry, and I wanted to share one that's been working well for me.

Professional Diver Training (${referralLink}) offers:
- NDT Inspector certification courses
- Diver Medic training
- Commercial Dive Supervisor programs
- AI-powered adaptive learning
- Practice scenarios based on real-world situations

The platform uses AI tutors that adapt to your learning style, which I've found really helpful for busy schedules.

Has anyone else used similar platforms? Would love to hear about your experiences with online diving training.

Note: This is my referral link - I'm sharing because I genuinely think it's a good resource, but wanted to be transparent about that.`,
    },
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Affiliate Marketing Guide
          </CardTitle>
          <CardDescription>
            Learn how to share your affiliate link effectively without spamming - 
            build trust, provide value, and earn sustainable commissions.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="principles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="principles">Principles</TabsTrigger>
          <TabsTrigger value="organic">Organic</TabsTrigger>
          <TabsTrigger value="paid">Media Buying</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="donts">What to Avoid</TabsTrigger>
        </TabsList>

        {/* PRINCIPLES TAB */}
        <TabsContent value="principles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Core Principles of Ethical Affiliate Marketing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    Value First Approach
                  </h4>
                  <p className="text-sm text-green-700">
                    Always lead with value. Share your genuine experience, helpful tips, 
                    and educational content. The affiliate link should be secondary to 
                    the value you're providing.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    Know Your Audience
                  </h4>
                  <p className="text-sm text-blue-700">
                    Only share with people who would genuinely benefit - diving professionals, 
                    aspiring divers, or those in related industries. Quality over quantity.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" />
                    Authenticity Wins
                  </h4>
                  <p className="text-sm text-purple-700">
                    Be transparent about your affiliate relationship. People appreciate 
                    honesty and are more likely to support you when they know you 
                    genuinely use and believe in the product.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <h4 className="font-semibold text-orange-800 flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4" />
                    Long-term Relationships
                  </h4>
                  <p className="text-sm text-orange-700">
                    Focus on building relationships, not quick sales. Nurture your 
                    network with consistent value. A single spammy message can 
                    destroy years of relationship building.
                  </p>
                </div>
              </div>

              <Alert>
                <Lightbulb className="w-4 h-4" />
                <AlertTitle>The Golden Rule</AlertTitle>
                <AlertDescription>
                  Ask yourself: "Would I share this recommendation even if there 
                  was no affiliate commission?" If yes, share it. If no, reconsider 
                  your approach.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold">The 80/20 Content Rule</h4>
                <p className="text-sm text-slate-600">
                  Follow the 80/20 rule for your content strategy:
                </p>
                <div className="flex gap-4">
                  <div className="flex-1 p-3 rounded-lg bg-slate-50">
                    <div className="text-2xl font-bold text-blue-600">80%</div>
                    <div className="text-sm text-slate-600">
                      Value content - tips, education, insights, community engagement
                    </div>
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-slate-50">
                    <div className="text-2xl font-bold text-green-600">20%</div>
                    <div className="text-sm text-slate-600">
                      Promotional content - affiliate links, special offers, direct asks
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ORGANIC TAB */}
        <TabsContent value="organic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Organic Sharing Strategies (Free Methods)
              </CardTitle>
              <CardDescription>
                Build sustainable, long-term affiliate income through organic methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="social-media">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      Social Media Strategy
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4 text-[#0077b5]" />
                          <span className="font-medium">LinkedIn</span>
                          <Badge variant="secondary">Best for B2B</Badge>
                        </div>
                        <ul className="text-sm text-slate-600 space-y-1 ml-6">
                          <li>• Share career development posts about diving industry</li>
                          <li>• Post about certifications you've completed</li>
                          <li>• Engage with diving industry groups</li>
                          <li>• Write articles about industry trends</li>
                          <li>• Connect with diving companies and professionals</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-[#E4405F]" />
                          <span className="font-medium">Instagram</span>
                          <Badge variant="secondary">Visual Content</Badge>
                        </div>
                        <ul className="text-sm text-slate-600 space-y-1 ml-6">
                          <li>• Share diving photos with educational captions</li>
                          <li>• Create Stories showing your training journey</li>
                          <li>• Use relevant diving hashtags</li>
                          <li>• Create Reels with diving tips</li>
                          <li>• Add link in bio with link-in-bio tool</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Youtube className="w-4 h-4 text-[#FF0000]" />
                          <span className="font-medium">YouTube</span>
                          <Badge variant="secondary">Long-form</Badge>
                        </div>
                        <ul className="text-sm text-slate-600 space-y-1 ml-6">
                          <li>• Create diving tutorial videos</li>
                          <li>• Review your training experience</li>
                          <li>• Share day-in-the-life content</li>
                          <li>• Equipment reviews and comparisons</li>
                          <li>• Include affiliate link in description</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Facebook className="w-4 h-4 text-[#1877F2]" />
                          <span className="font-medium">Facebook Groups</span>
                          <Badge variant="secondary">Community</Badge>
                        </div>
                        <ul className="text-sm text-slate-600 space-y-1 ml-6">
                          <li>• Join diving professional groups</li>
                          <li>• Answer questions and provide value first</li>
                          <li>• Share resources when relevant</li>
                          <li>• Follow group rules about promotions</li>
                          <li>• Build reputation before sharing links</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="content-marketing">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      Content Marketing
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Blog Writing</h4>
                        <p className="text-sm text-slate-600 mb-2">
                          Start a blog about diving careers, certifications, or industry insights:
                        </p>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• "How to Become a Certified NDT Inspector"</li>
                          <li>• "Career Paths in Commercial Diving"</li>
                          <li>• "Top Certifications for Diving Professionals in 2024"</li>
                          <li>• "My Journey to Becoming a Dive Supervisor"</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Forum Participation</h4>
                        <p className="text-sm text-slate-600 mb-2">
                          Engage authentically in diving communities:
                        </p>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• ScubaBoard, Deeper Blue, diving subreddits</li>
                          <li>• Answer questions thoroughly before mentioning resources</li>
                          <li>• Include disclosure when sharing affiliate links</li>
                          <li>• Build reputation through helpful contributions</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Email Newsletter</h4>
                        <p className="text-sm text-slate-600 mb-2">
                          Build an email list of diving professionals:
                        </p>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Offer a free diving resource guide as lead magnet</li>
                          <li>• Send valuable tips and industry news weekly</li>
                          <li>• Occasionally mention training resources</li>
                          <li>• Segment list by interests and career stage</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="network-marketing">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-500" />
                      Network & Relationship Building
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Personal Network</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Share with colleagues who've expressed interest in training</li>
                          <li>• Mention to diving club members during natural conversations</li>
                          <li>• Include in professional introductions when relevant</li>
                          <li>• Add to email signature for professional contacts</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Industry Events</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Network at diving conferences and trade shows</li>
                          <li>• Share business cards with affiliate link/QR code</li>
                          <li>• Present on topics related to professional development</li>
                          <li>• Follow up with connections post-event</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Dive School Partnerships</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Partner with dive schools for continued education resources</li>
                          <li>• Offer to guest speak about advanced certifications</li>
                          <li>• Provide resources for their graduates</li>
                          <li>• Create win-win referral arrangements</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAID/MEDIA BUYING TAB */}
        <TabsContent value="paid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-600" />
                Media Buying & Paid Advertising
              </CardTitle>
              <CardDescription>
                Scale your affiliate income with strategic paid advertising
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Before You Start</AlertTitle>
                <AlertDescription>
                  Paid advertising requires investment and testing. Start with a small budget, 
                  track your results carefully, and scale what works. Never invest more than 
                  you can afford to lose while learning.
                </AlertDescription>
              </Alert>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="facebook-ads">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Facebook className="w-4 h-4 text-[#1877F2]" />
                      Facebook/Meta Ads
                      <Badge variant="outline">Recommended</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-blue-50">
                        <h4 className="font-medium mb-2">Target Audiences</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Interest: Scuba diving, commercial diving, NDT inspection</li>
                          <li>• Job titles: Diver, Diving Supervisor, NDT Inspector, Marine Engineer</li>
                          <li>• Industries: Oil & gas, marine services, underwater construction</li>
                          <li>• Education: People interested in professional certifications</li>
                          <li>• Lookalike audiences based on existing conversions</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Campaign Structure</h4>
                        <ol className="text-sm text-slate-600 space-y-1">
                          <li>1. <strong>Awareness:</strong> Video content about diving careers</li>
                          <li>2. <strong>Consideration:</strong> Carousel ads showing certification benefits</li>
                          <li>3. <strong>Conversion:</strong> Direct signup offers with clear CTA</li>
                        </ol>
                      </div>

                      <div className="p-4 rounded-lg bg-green-50">
                        <h4 className="font-medium mb-2">Budget Recommendations</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Start: $10-20/day for testing</li>
                          <li>• Test multiple ad sets for 3-5 days</li>
                          <li>• Scale winners: Increase budget by 20% every 2-3 days</li>
                          <li>• Target CPA: Aim for less than 30% of commission value</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="google-ads">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#4285F4]" />
                      Google Ads
                      <Badge variant="outline">High Intent</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-blue-50">
                        <h4 className="font-medium mb-2">Keyword Targeting</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• "NDT certification online"</li>
                          <li>• "commercial diving courses"</li>
                          <li>• "diver medic training"</li>
                          <li>• "dive supervisor certification"</li>
                          <li>• "professional diver training program"</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Ad Copy Tips</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Highlight AI-powered learning</li>
                          <li>• Mention industry-recognized certifications</li>
                          <li>• Include pricing/value proposition</li>
                          <li>• Use social proof (number of professionals trained)</li>
                          <li>• Strong call-to-action</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-yellow-50">
                        <h4 className="font-medium mb-2">Display Network</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Place ads on diving industry websites</li>
                          <li>• Target by topics: scuba diving, marine, offshore</li>
                          <li>• Retarget website visitors who didn't convert</li>
                          <li>• Use responsive display ads for broad reach</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="linkedin-ads">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-[#0077b5]" />
                      LinkedIn Ads
                      <Badge variant="outline">B2B Focus</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-blue-50">
                        <h4 className="font-medium mb-2">Targeting Options</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Job functions: Engineering, Operations, Technical</li>
                          <li>• Industries: Oil & gas, Marine, Construction</li>
                          <li>• Seniority: Entry to mid-level (career development)</li>
                          <li>• Skills: Commercial diving, NDT, offshore operations</li>
                          <li>• Company size: Target both small diving companies and large offshore firms</li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-lg bg-slate-50">
                        <h4 className="font-medium mb-2">Ad Formats</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Sponsored Content: Educational posts in feed</li>
                          <li>• Message Ads: Direct outreach (use sparingly)</li>
                          <li>• Video Ads: Testimonials and course previews</li>
                          <li>• Document Ads: Free resources with signup</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="youtube-ads">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-[#FF0000]" />
                      YouTube Ads
                      <Badge variant="outline">Video Content</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-red-50">
                      <h4 className="font-medium mb-2">Strategy</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Target viewers of diving-related content</li>
                        <li>• Create educational video ads (not just sales pitches)</li>
                        <li>• Use skippable in-stream ads for awareness</li>
                        <li>• Non-skippable bumper ads for retargeting</li>
                        <li>• Partner with diving YouTubers for sponsored content</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                <h4 className="font-semibold mb-2">ROI Calculation</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">$12.50</div>
                    <div className="text-slate-600">Monthly Commission</div>
                    <div className="text-xs text-slate-500">(50% of $25)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">$125.00</div>
                    <div className="text-slate-600">Annual Commission</div>
                    <div className="text-xs text-slate-500">(50% of $250)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">$5-15</div>
                    <div className="text-slate-600">Target CPA</div>
                    <div className="text-xs text-slate-500">(Cost Per Acquisition)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Ready-to-Use Message Templates
              </CardTitle>
              <CardDescription>
                Professional, non-spammy templates for different platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(messageTemplates).map(([key, value]) => (
                  <Card key={key} className="border border-slate-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {key === 'linkedin' && <Linkedin className="w-4 h-4 text-[#0077b5]" />}
                          {key === 'twitter' && <Twitter className="w-4 h-4 text-[#1DA1F2]" />}
                          {key === 'facebook' && <Facebook className="w-4 h-4 text-[#1877F2]" />}
                          {key === 'instagram' && <Instagram className="w-4 h-4 text-[#E4405F]" />}
                          {key === 'email' && <Mail className="w-4 h-4 text-slate-600" />}
                          {key === 'directMessage' && <MessageSquare className="w-4 h-4 text-green-600" />}
                          {key === 'forum' && <Users className="w-4 h-4 text-purple-600" />}
                          {value.title}
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(value.template, value.title)}
                          className="gap-2"
                        >
                          {copiedTemplate === value.title ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px] w-full rounded-md border p-3 bg-slate-50">
                        <pre className="text-sm whitespace-pre-wrap font-sans text-slate-700">
                          {value.template}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert className="mt-4">
                <Lightbulb className="w-4 h-4" />
                <AlertTitle>Customize These Templates</AlertTitle>
                <AlertDescription>
                  These templates are starting points. Always personalize them with your 
                  own experience, voice, and specific details. Authentic, personalized 
                  messages always perform better than copy-paste templates.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WHAT TO AVOID TAB */}
        <TabsContent value="donts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                What NOT to Do (Avoid Spam & Burnout)
              </CardTitle>
              <CardDescription>
                These practices will hurt your reputation and violate platform guidelines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4" />
                    Mass DMing Strangers
                  </h4>
                  <p className="text-sm text-red-700">
                    Never send unsolicited messages to people you don't know. This is 
                    spam, violates most platform ToS, and damages your reputation.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4" />
                    Comment Spamming
                  </h4>
                  <p className="text-sm text-red-700">
                    Don't drop your affiliate link in comments on random posts. 
                    This looks desperate and will get you blocked/banned.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4" />
                    Fake Reviews/Testimonials
                  </h4>
                  <p className="text-sm text-red-700">
                    Never fabricate success stories or exaggerate results. 
                    This is unethical and often illegal (FTC violations).
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4" />
                    Hiding Affiliate Relationship
                  </h4>
                  <p className="text-sm text-red-700">
                    Always disclose that you're sharing an affiliate link. 
                    FTC requires clear disclosure - "ad", "affiliate", "partner link".
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4" />
                    Overpromising Results
                  </h4>
                  <p className="text-sm text-red-700">
                    Don't make unrealistic claims like "get certified in 2 days" 
                    or "guaranteed job after completion". Be honest about what the training offers.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4" />
                    Excessive Posting
                  </h4>
                  <p className="text-sm text-red-700">
                    Don't post about your affiliate link multiple times per day. 
                    Follow the 80/20 rule - mostly value content, occasional promotion.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Red Flags That Signal Spam</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Messaging people immediately after connecting</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Copy-pasting the same message to everyone</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Posting links in unrelated discussions</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Using pressure tactics or urgency</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Tagging people without their consent</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Using fake urgency ("limited time only!")</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Ignoring "no" or continued requests</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Adding people to groups without permission</span>
                  </div>
                </div>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Legal Compliance</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    The FTC requires clear and conspicuous disclosure of affiliate relationships. 
                    Failing to disclose can result in legal penalties. Always include:
                  </p>
                  <ul className="list-disc list-inside text-sm">
                    <li>"#ad" or "#affiliate" on social media posts</li>
                    <li>"This is an affiliate link" near any link</li>
                    <li>Clear disclosure before the link in emails</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
