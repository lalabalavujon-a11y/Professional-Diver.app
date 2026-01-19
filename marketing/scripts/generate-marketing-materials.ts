#!/usr/bin/env tsx
/**
 * Generate Marketing Materials for Sponsor Outreach
 * 
 * This script generates all marketing materials including:
 * - Sponsor kit (Markdown & JSON)
 * - Email sequences (Markdown & JSON)
 * - CRM import files (CSV & JSON)
 * - Outreach tracking templates (CSV)
 * 
 * Usage:
 *   tsx marketing/scripts/generate-marketing-materials.ts
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ========== Data Definitions ==========

const sponsorKitData = {
  title: "Professional Diver Training — Sponsor Kit",
  issueDate: "January 2026",
  contact: {
    email: "1pull@professionaldiver.app",
    whatsapp: "+447448320513",
    website: "https://professionaldiver.app",
    partnerInquiry: "https://professionaldiver.app/partner-inquiry",
    location: "Southampton, United Kingdom"
  },
  platform: {
    name: "Professional Diver Training",
    tagline: "Brand-neutral commercial diving education platform",
    disciplines: [
      "NDT (Non-Destructive Testing)",
      "LST (Life Support Technician)",
      "ALST (Assistant Life Support Technician)",
      "DMT (Dive Medical Technician)",
      "Commercial Supervisor",
      "Saturation Diving",
      "Underwater Welding",
      "Hyperbaric Operations",
      "Air Diver Certification"
    ],
    statistics: {
      activeUsers: 127,
      trainingTracks: 9,
      lessons: 23,
      completions: 89
    }
  },
  tiers: [
    {
      name: "Bronze",
      subtitle: "Visibility Partner",
      monthlyFee: 450,
      minimumTerm: "6-12 months",
      includes: [
        "Logo on homepage partner strip + click-through",
        "Listed on \"Partners\" page",
        "Quarterly performance report (clicks + impressions)",
        "UTM-tracked links"
      ],
      bestFor: "Equipment suppliers, regional contractors, service providers"
    },
    {
      name: "Silver",
      subtitle: "Traffic Partner",
      monthlyFee: 950,
      minimumTerm: "6-12 months",
      includes: [
        "Better homepage placement",
        "Rotating in-app tile (or \"Featured Partner\" section)",
        "1 trackable CTA/month (discount code or landing page)",
        "Monthly report"
      ],
      bestFor: "Equipment manufacturers, training providers, insurance companies"
    },
    {
      name: "Gold",
      subtitle: "Lead + Authority",
      monthlyFee: 2250,
      minimumTerm: "6-12 months",
      includes: [
        "Premium homepage placement (limited slots)",
        "In-app tile + dedicated partner block/category placement",
        "1 activation/month (drill-of-week, short article, mini-module, webinar mention)",
        "Monthly report + quarterly strategy call"
      ],
      bestFor: "Major equipment brands, large contractors, industry leaders"
    },
    {
      name: "Title / Founding",
      subtitle: "Category King",
      monthlyFee: 4500,
      minimumTerm: "6-12 months",
      includes: [
        "\"Powered by\" placement + category exclusivity",
        "2 activations/month",
        "Priority roadmap input for sponsor placements",
        "First position branding"
      ],
      bestFor: "Market leaders seeking category dominance"
    }
  ],
  addOns: [
    {
      name: "Category Exclusivity",
      price: "+35% of base tier price",
      description: "Exclusive category rights (e.g., \"Exclusive Dive Computer Partner\")"
    },
    {
      name: "Extra Activation",
      price: "+£350–£750 per activation",
      description: "Additional email/push/webinar mentions, co-branded content pieces"
    },
    {
      name: "Recruitment Campaign",
      price: "+£500–£1,500/month",
      description: "Job posting placements, recruitment-focused CTAs, access to candidate pipeline"
    }
  ],
  foundingPartnerOffer: {
    monthlyFee: 750,
    term: "90 days",
    limit: 10,
    includes: [
      "Homepage logo placement + click-through",
      "Dedicated tracked sponsor link (UTM)",
      "One \"Featured Partner\" post/mention during pilot",
      "Monthly report (impressions/clicks/CTR + recommendations)"
    ],
    conversion: "If it performs → convert to 6–12 month Silver/Gold at founder-locked pricing"
  },
  placements: {
    website: [
      {
        name: "Homepage Partner Strip",
        location: "Above footer on landing page",
        format: "Logo grid with hover effects",
        tracking: "Impression + click tracking"
      },
      {
        name: "Above-the-Fold \"Trusted by\" Section",
        location: "Hero section area",
        format: "Premium logo display",
        tracking: "Impression + click tracking",
        tier: "Gold+ only"
      },
      {
        name: "Partner Directory Page",
        location: "Dedicated /partners page",
        format: "Full sponsor profiles with logos, descriptions",
        tracking: "Impression + click tracking"
      },
      {
        name: "Resource Pages",
        location: "Category-specific resource pages",
        format: "Sponsor tiles in relevant sections",
        tracking: "Impression + click tracking"
      }
    ],
    inApp: [
      {
        name: "Home Screen Sponsor Tile",
        location: "User dashboard/home page",
        format: "Featured partner card",
        tracking: "Impression + click tracking"
      },
      {
        name: "Featured Partner Sections",
        location: "Various in-app locations",
        format: "Sponsor spotlight cards",
        tracking: "Impression + click tracking"
      },
      {
        name: "Category-Specific Resource Pages",
        location: "Discipline-specific pages",
        format: "Relevant sponsor placements",
        tracking: "Impression + click tracking"
      }
    ],
    contentActivations: [
      "Sponsored \"Skill Drill of the Week\"",
      "Co-Branded Mini Training Modules",
      "Webinar / Live Q&A Mentions",
      "Discount Codes + Tracked Offers"
    ]
  },
  reporting: {
    monthlyReports: [
      "Total impressions (homepage, in-app, resource pages)",
      "Total clicks (by placement type)",
      "Click-through rate (CTR)",
      "CTA conversions (if applicable)",
      "Top performing placements",
      "Recommendations for optimization"
    ],
    tracking: [
      "UTM parameters on all sponsor links",
      "GA4 event tracking",
      "Server-side event logging",
      "Real-time analytics dashboard"
    ],
    delivery: {
      format: "PDF or HTML email",
      frequency: "Monthly (or quarterly for Bronze)",
      method: "Email to sponsor contact + admin dashboard view"
    }
  },
  onboarding: {
    steps: [
      {
        step: 1,
        name: "Discovery Call",
        duration: "15 minutes",
        description: "Discuss goals, review tier options, answer questions, customize package"
      },
      {
        step: 2,
        name: "Proposal & Agreement",
        description: "Receive customized proposal, review sponsor agreement, sign agreement, set start date"
      },
      {
        step: 3,
        name: "Asset Collection",
        duration: "5-7 days",
        description: "Provide logo (SVG/PNG), share brand guidelines, submit landing URL, provide CTA text, share promo code"
      },
      {
        step: 4,
        name: "Setup & Configuration",
        duration: "3-5 days",
        description: "Create UTM-tracked links, configure placements, set up tracking, test all placements"
      },
      {
        step: 5,
        name: "Go Live",
        description: "Launch placements, verify tracking, send confirmation, begin reporting schedule"
      }
    ],
    totalTimeline: "10-15 business days from agreement to go-live"
  }
};

const emailSequences = {
  initialOutreach: [
    {
      name: "Generic Initial Outreach",
      subject: "Partnership Opportunity — Reach Commercial Divers on Professional Diver Training",
      body: `Hi [First Name],

I'm reaching out because [Company Name] serves commercial divers — exactly the audience we reach on Professional Diver Training.

We're a brand-neutral commercial diving education platform reaching divers, trainees, and supervisors actively preparing for certification across 9 diving disciplines.

**Why this matters:**
- Direct access to your target market
- Measurable placements with tracked clicks
- Monthly performance reports
- Brand-neutral platform

**Limited-Time Offer:**
We're launching a **Founding Partner program** (90-day pilot at £750/month) that includes premium placement, tracking, and full reporting. Limited to 10 partners.

Would you be available for a quick 15-minute call next week?

Best regards,  
[Your Name]  
Professional Diver Training  
1pull@professionaldiver.app | +447448320513`
    },
    {
      name: "Equipment Brands",
      subject: "Reach Commercial Divers — Equipment Partnership Opportunity",
      body: `Hi [First Name],

Commercial divers actively training for certification are your ideal customers — they're investing in their careers and need quality equipment.

**Professional Diver Training** reaches this exact audience through our education platform. We're offering equipment brands:

- Homepage + in-app placements
- Category exclusivity options
- Tracked discount codes
- Monthly performance reports

**Founding Partner offer:** £750/month for 90-day pilot (includes full reporting).

Interested in a quick call to discuss?

Best,  
[Your Name]`
    },
    {
      name: "Contractors/Recruiters",
      subject: "Recruitment Partnership — Reach Trained Commercial Divers",
      body: `Hi [First Name],

Finding qualified commercial divers is challenging. We can help.

**Professional Diver Training** reaches divers actively training and upgrading their skills — exactly who you need to hire.

**Partnership includes:**
- Homepage + in-app placements
- Recruitment campaign slots
- Tracked job postings
- Access to engaged diver community

**Founding Partner offer:** £750/month for 90-day pilot.

Interested in discussing how we can help [Company Name] recruit trained divers?

Best,  
[Your Name]`
    },
    {
      name: "Training Providers",
      subject: "Partnership Opportunity — Reach Trainees Before They Choose a School",
      body: `Hi [First Name],

Trainees preparing for commercial diving certification are actively researching training providers — and they're on our platform.

**Professional Diver Training** helps divers prepare for certification exams. This means we reach trainees before they make their training decision.

**Partnership benefits:**
- Homepage + in-app visibility
- Co-branded training content
- Lead generation through tracked CTAs
- Monthly reports showing engagement

**Founding Partner offer:** £750/month for 90-day pilot.

Would you like to discuss how we can help [Company Name] reach these qualified leads?

Best,  
[Your Name]`
    },
    {
      name: "LinkedIn DM",
      subject: null,
      body: `Hi [First Name],

I noticed [Company Name] serves the commercial diving industry. We're launching a partnership program for Professional Diver Training (commercial diving education platform) and thought you might be interested.

We're offering limited Founding Partner slots with premium placement + tracking. Worth a quick chat?

[Your Name]  
1pull@professionaldiver.app`
    }
  ],
  followUp: [
    {
      day: 7,
      subject: "Re: Partnership Opportunity — Quick Question",
      body: `Hi [First Name],

Just following up on my email about our Founding Partner program.

Quick version:
- **What:** Homepage + in-app placements reaching commercial divers
- **Offer:** 90-day pilot at £750/month (includes reporting)
- **Why:** Measurable brand visibility + lead generation

If this isn't the right time, no worries. But if you'd like to explore, I'm happy to jump on a quick call.

Best,  
[Your Name]`
    },
    {
      day: 14,
      subject: "Last chance — Founding Partner slots filling up",
      body: `Hi [First Name],

Quick update: We're down to [X] remaining Founding Partner slots.

This includes:
- Premium homepage placement
- In-app sponsor tile
- Full tracking & monthly reports
- £750/month (pilot pricing)

If you're interested, let's schedule a call this week. Otherwise, I'll assume you're not interested right now and won't follow up again.

Best,  
[Your Name]`
    },
    {
      day: 21,
      name: "Final Follow-Up",
      subject: "Final check-in — Partnership opportunity",
      body: `Hi [First Name],

This will be my last email about our Founding Partner program.

I wanted to make sure you saw the opportunity to reach commercial divers through Professional Diver Training.

**Quick recap:**
- Homepage + in-app placements
- 90-day pilot at £750/month
- Full tracking and monthly reports
- Limited to 10 partners

If this isn't the right fit, I completely understand. But if you'd like to explore, I'm here.

Best,  
[Your Name]`
    },
    {
      day: null,
      name: "Re-engagement Email",
      subject: "New opportunity — Professional Diver Training partnership",
      body: `Hi [First Name],

I reached out a few months ago about our partnership program. Since then, we've grown significantly and I wanted to reconnect.

**What's new:**
- Platform now reaches 127+ active commercial divers
- New sponsorship tiers available (Bronze, Silver, Gold, Title)
- Enhanced tracking and reporting
- Category exclusivity options

If you're interested in reaching commercial divers, I'd love to show you what we've built.

Would you be open to a quick 15-minute call?

Best,  
[Your Name]`
    }
  ],
  closing: [
    {
      name: "Post-Call Follow-Up",
      subject: "Next Steps — [Company Name] Partnership",
      body: `Hi [First Name],

Great talking with you today! As discussed, here's a summary of what we covered:

**Package:** [Bronze/Silver/Gold/Founding]  
**Investment:** £[amount]/month  
**Term:** [90-day pilot / 6 months / 12 months]  
**Includes:** [List deliverables]

**Next Steps:**
1. Review sponsor kit (attached)
2. Confirm package selection
3. Send logo + brand guidelines
4. We'll set up tracking and placements
5. Go live within 10 business days

I'll send the detailed proposal and agreement once you confirm.

Looking forward to partnering with [Company Name]!

Best,  
[Your Name]`
    },
    {
      name: "Proposal Email",
      subject: "Partnership Proposal — [Company Name] × Professional Diver Training",
      body: `Hi [First Name],

Thank you for your interest in partnering with Professional Diver Training. I've prepared a customized proposal for [Company Name].

**Proposed Package: [Tier]**

**Investment:** £[amount]/month  
**Term:** [90-day pilot / 6 months / 12 months]  
**Start Date:** [Proposed Date]

**What's Included:**
[List specific deliverables based on tier]

**Placements:**
- [Specific placement details]

**Reporting:**
- [Reporting frequency and metrics]

**Next Steps:**
1. Review the attached sponsor kit
2. Review this proposal
3. Confirm package selection or request adjustments
4. Sign agreement and provide assets
5. Go live within 10 business days

I'm happy to customize this package to better fit your goals. Let's schedule a call to discuss.

Best,  
[Your Name]  
Professional Diver Training  
1pull@professionaldiver.app | +447448320513`
    },
    {
      name: "Agreement Confirmation",
      subject: "Welcome to Professional Diver Training — Partnership Confirmed",
      body: `Hi [First Name],

Excited to confirm your partnership with Professional Diver Training!

**Your Package:** [Tier]  
**Start Date:** [Date]  
**Monthly Investment:** £[amount]

**What Happens Next:**
1. Asset collection (logo, brand guidelines, landing URL)
2. Setup & configuration (3-5 days)
3. Go live (within 10 business days)
4. First report delivery ([Date])

**Important Links:**
- Partner inquiry form: https://professionaldiver.app/partner-inquiry
- Admin dashboard: https://professionaldiver.app/admin/sponsors

If you have any questions, don't hesitate to reach out.

Best,  
[Your Name]`
    },
    {
      name: "Onboarding Welcome Email",
      subject: "Welcome! Let's get your partnership live — [Company Name]",
      body: `Hi [First Name],

Welcome to Professional Diver Training! We're excited to have [Company Name] as a partner.

**Onboarding Checklist:**

1. **Assets Needed** (please send within 5 days):
   - Logo (SVG preferred, PNG acceptable)
   - Brand guidelines (colors, fonts, tone)
   - Landing page URL
   - CTA text (if applicable)
   - Promo code (if applicable)

2. **What We'll Do:**
   - Create UTM-tracked links
   - Configure placements
   - Set up tracking
   - Test all placements
   - Go live within 10 business days

3. **Timeline:**
   - Day 1-5: Asset collection
   - Day 6-10: Setup & configuration
   - Day 11: Go live!
   - Day 31: First report delivery

**Questions?**
Reply to this email or reach out:
- Email: 1pull@professionaldiver.app
- WhatsApp: +447448320513

Let's make this partnership a success!

Best,  
[Your Name]  
Professional Diver Training`
    }
  ]
};

const prospectList = [
  // UK Commercial Diving Contractors (ADC-UK)
  { company: "ABCO Divers Ltd", category: "contractor", website: "https://www.abco-divers.co.uk/", source: "ADC-UK", notes: "UK commercial diving contractor" },
  { company: "Aberdeen Marine Ltd", category: "contractor", website: "https://www.aberdeenmarine.co.uk/", source: "ADC-UK", notes: "UK marine services" },
  { company: "Aegean Diving Services Ltd", category: "contractor", website: "https://www.aegeandiving.com/", source: "ADC-UK", notes: "UK diving services" },
  { company: "Geomarine Limited", category: "contractor", website: "https://www.geomarine.co.uk/", source: "ADC-UK", notes: "Marine services" },
  { company: "Grampian Diving Services", category: "contractor", website: "https://www.grampiandiving.com/", source: "ADC-UK", notes: "UK diving contractor" },
  { company: "GreenC Marine Ltd", category: "contractor", website: "https://www.greencmarine.co.uk/", source: "ADC-UK", notes: "Marine services" },
  { company: "GW Marine Systems Ltd", category: "contractor", website: "https://www.gwmarine.co.uk/", source: "ADC-UK", notes: "Marine systems" },
  { company: "Herbosch-Kiere UK Ltd", category: "contractor", website: "https://www.herbosch-kiere.co.uk/", source: "ADC-UK", notes: "Marine construction" },
  { company: "Hull Diving Services Co", category: "contractor", website: "https://www.hulldiving.co.uk/", source: "ADC-UK", notes: "UK diving services" },
  { company: "Hulltec Ltd", category: "contractor", website: "https://www.hulltec.co.uk/", source: "ADC-UK", notes: "Marine technology" },
  { company: "KBS Maritime Ltd", category: "contractor", website: "https://www.kbsmaritime.co.uk/", source: "ADC-UK", notes: "Maritime services" },
  { company: "Kew Diving Services Ltd", category: "contractor", website: "https://www.kewdiving.co.uk/", source: "ADC-UK", notes: "UK diving contractor" },
  { company: "Leask Marine Ltd", category: "contractor", website: "https://www.leaskmarine.co.uk/", source: "ADC-UK", notes: "Marine services" },
  { company: "Lochs Diving Services Ltd", category: "contractor", website: "https://www.lochsdiving.co.uk/", source: "ADC-UK", notes: "UK diving services" },
  { company: "Malakoff Ltd", category: "contractor", website: "https://www.malakoff.co.uk/", source: "ADC-UK", notes: "Marine services" },
  { company: "Marine and Civil Diving Services Ltd", category: "contractor", website: "https://www.marineandcivil.co.uk/", source: "ADC-UK", notes: "Marine & civil" },
  { company: "MCS Subsea Ltd", category: "contractor", website: "https://www.mcssubsea.co.uk/", source: "ADC-UK", notes: "Subsea services" },
  { company: "Millennium Marine Contractors Ltd", category: "contractor", website: "https://www.millenniummarine.co.uk/", source: "ADC-UK", notes: "Marine contractors" },
  { company: "MMC Diving Services", category: "contractor", website: "https://www.mmcdiving.co.uk/", source: "ADC-UK", notes: "UK diving services" },
  { company: "MMP Marine & Inspection", category: "contractor", website: "https://www.mmpmarine.co.uk/", source: "ADC-UK", notes: "Marine inspection" },
  { company: "MSDS Marine Ltd", category: "contractor", website: "https://www.msdsmarine.co.uk/", source: "ADC-UK", notes: "Marine services" },
  { company: "Norfolk Marine Ltd", category: "contractor", website: "https://www.norfolkmarine.co.uk/", source: "ADC-UK", notes: "Marine services" },
  { company: "North West Marine Ltd", category: "contractor", website: "https://www.northwestmarine.co.uk/", source: "ADC-UK", notes: "Marine services" },
  { company: "Northern Divers (Eng) Ltd", category: "contractor", website: "https://www.northerndivers.co.uk/", source: "ADC-UK", notes: "UK diving contractor" },
  { company: "Quay Diving Services Ltd", category: "contractor", website: "https://www.quaydiving.co.uk/", source: "ADC-UK", notes: "UK diving services" },
  // Additional from Seaplant
  { company: "RED7 Diving", category: "contractor", website: "https://www.red7diving.com/", source: "Seaplant", notes: "UK diving contractor" },
  { company: "Associated Diving Services", category: "contractor", website: "https://www.associateddiving.co.uk/", source: "Seaplant", notes: "UK diving services" },
  { company: "Hydrex Underwater Technology", category: "contractor", website: "https://www.hydrex.be/", source: "Seaplant", notes: "Underwater technology" },
  { company: "Sub Aqua Diving Services (UK) Ltd", category: "contractor", website: "https://www.subaqua.co.uk/", source: "Seaplant", notes: "UK diving services" },
  // Equipment Brands
  { company: "Kirby Morgan", category: "helmets", website: "https://www.kirbymorgan.com/", source: "Industry", notes: "Dive helmet manufacturer" },
  { company: "Divex", category: "helmets", website: "https://www.divex.com/", source: "Industry", notes: "Dive equipment manufacturer" },
  { company: "OMS", category: "suits", website: "https://www.omsdive.com/", source: "Industry", notes: "Dive suit manufacturer" },
  { company: "Viking", category: "suits", website: "https://www.vikingdive.com/", source: "Industry", notes: "Dive suit manufacturer" },
  { company: "Santi", category: "suits", website: "https://www.santi.pl/", source: "Industry", notes: "Dive suit manufacturer" },
  { company: "DUI", category: "suits", website: "https://www.dui-online.com/", source: "Industry", notes: "Dive suit manufacturer" },
  { company: "Shearwater Research", category: "computers", website: "https://www.shearwater.com/", source: "Industry", notes: "Dive computer manufacturer" },
  { company: "Suunto", category: "computers", website: "https://www.suunto.com/", source: "Industry", notes: "Dive computer manufacturer" },
  { company: "Garmin", category: "computers", website: "https://www.garmin.com/", source: "Industry", notes: "Dive computer manufacturer" },
  // Insurance Providers
  { company: "DAN Europe", category: "insurance", website: "https://www.daneurope.org/", source: "Industry", notes: "Dive insurance provider" },
  { company: "Dive Assure", category: "insurance", website: "https://www.diveassure.com/", source: "Industry", notes: "Dive insurance provider" },
  { company: "Divers Alert Network", category: "insurance", website: "https://www.diversalertnetwork.org/", source: "Industry", notes: "Dive insurance provider" },
  // Training Providers
  { company: "HSE Commercial Diving", category: "training", website: "https://www.hse.gov.uk/diving/", source: "Industry", notes: "UK commercial diving training" },
  { company: "IMCA", category: "training", website: "https://www.imca-int.com/", source: "Industry", notes: "International Marine Contractors Association" },
  { company: "ADCI", category: "training", website: "https://www.adc-int.org/", source: "Industry", notes: "Association of Diving Contractors International" },
  { company: "Divers Institute of Technology", category: "training", website: "https://www.diversinstitute.edu/", source: "Industry", notes: "Commercial diving school" },
  { company: "Commercial Diving Academy", category: "training", website: "https://www.commercialdivingacademy.com/", source: "Industry", notes: "Commercial diving training" },
  { company: "Underwater Centre", category: "training", website: "https://www.theunderwatercentre.com/", source: "Industry", notes: "Commercial diving training" },
  // Additional Equipment Brands
  { company: "Apeks", category: "tools", website: "https://www.apeksdiving.com/", source: "Industry", notes: "Dive equipment manufacturer" },
  { company: "Scubapro", category: "tools", website: "https://www.scubapro.com/", source: "Industry", notes: "Dive equipment manufacturer" },
  { company: "Aqua Lung", category: "tools", website: "https://www.aqualung.com/", source: "Industry", notes: "Dive equipment manufacturer" },
  { company: "Mares", category: "tools", website: "https://www.mares.com/", source: "Industry", notes: "Dive equipment manufacturer" },
  { company: "Cressi", category: "tools", website: "https://www.cressi.com/", source: "Industry", notes: "Dive equipment manufacturer" },
  { company: "Hollis", category: "tools", website: "https://www.hollis.com/", source: "Industry", notes: "Dive equipment manufacturer" },
  { company: "Fourth Element", category: "suits", website: "https://www.fourthelement.com/", source: "Industry", notes: "Dive suit manufacturer" },
  { company: "Waterproof", category: "suits", website: "https://www.waterproof.eu/", source: "Industry", notes: "Dive suit manufacturer" },
  // Additional Contractors (IMCA/ADCI)
  { company: "Oceaneering International", category: "contractor", website: "https://www.oceaneering.com/", source: "IMCA", notes: "International offshore contractor" },
  { company: "TechnipFMC", category: "contractor", website: "https://www.technipfmc.com/", source: "IMCA", notes: "International offshore contractor" },
  { company: "Subsea 7", category: "contractor", website: "https://www.subsea7.com/", source: "IMCA", notes: "International offshore contractor" },
  { company: "Saipem", category: "contractor", website: "https://www.saipem.com/", source: "IMCA", notes: "International offshore contractor" },
  { company: "Helix Energy Solutions", category: "contractor", website: "https://www.helixesg.com/", source: "ADCI", notes: "International diving contractor" },
  { company: "Cal Dive International", category: "contractor", website: "https://www.caldive.com/", source: "ADCI", notes: "International diving contractor" },
  // Communication Equipment
  { company: "Nautilus Lifeline", category: "comms", website: "https://www.nautiluslifeline.com/", source: "Industry", notes: "Dive communication equipment" },
  { company: "Oceanic", category: "computers", website: "https://www.oceanicworldwide.com/", source: "Industry", notes: "Dive computer manufacturer" }
];

// ========== File Generation Functions ==========

async function createDirectories() {
  const baseDir = path.join(process.cwd(), 'marketing');
  const dirs = [
    path.join(baseDir, 'email-sequences'),
    path.join(baseDir, 'crm-import'),
    path.join(baseDir, 'outreach-tracking'),
    path.join(baseDir, 'scripts')
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  }
}

function generateSponsorKitMarkdown(): string {
  const { title, issueDate, contact, platform, tiers, addOns, foundingPartnerOffer, placements, reporting, onboarding } = sponsorKitData;

  return `# ${title}

**Issue Date:** ${issueDate}  
**Contact:** ${contact.email} | WhatsApp: ${contact.whatsapp}  
**Website:** ${contact.website}

---

## Executive Summary

Professional Diver Training is a brand-neutral commercial diving education platform that reaches commercial divers, trainees, supervisors, and industry professionals actively seeking training and certification preparation.

**Our Value Proposition:**
- Direct access to engaged commercial diving professionals
- Measurable placements with comprehensive tracking
- Monthly performance reports
- Brand-neutral platform (no conflicts with certification bodies)

---

## About Professional Diver Training

### Platform Overview

Professional Diver Training provides comprehensive exam preparation for commercial diving certifications across ${platform.disciplines.length} professional disciplines:

${platform.disciplines.map((d, i) => `${i + 1}. **${d}**`).join('\n')}

### Our Audience

**Primary Users:**
- Commercial divers seeking certification
- Dive trainees preparing for exams
- Commercial dive supervisors
- Industry professionals upgrading skills
- Companies training their diving teams

**User Engagement:**
- Active learners preparing for certification
- Professionals investing in career development
- Decision-makers researching equipment and services
- Companies seeking trained divers

### Platform Features

- **AI-Powered Learning:** Specialized AI tutors for each discipline
- **Comprehensive Training Tracks:** ${platform.disciplines.length} professional diving disciplines
- **Exam Preparation:** Timed mock exams, practice quizzes, certification prep
- **Progress Tracking:** Advanced analytics and learning path recommendations
- **Mobile & Web:** Accessible on all devices
- **Spaced Repetition:** Advanced learning retention system

### Platform Statistics

- **Active Users:** ${platform.statistics.activeUsers}+ (growing)
- **Training Tracks:** ${platform.statistics.trainingTracks} professional disciplines
- **Lessons:** ${platform.statistics.lessons}+ comprehensive lessons
- **Completion Rate:** ${platform.statistics.completions}+ completions
- **Platform:** Web + Mobile (iOS & Android)

---

## Sponsorship Tiers & Pricing

${tiers.map(tier => `### ${tier.name} — ${tier.subtitle}
**£${tier.monthlyFee}/month** | ${tier.minimumTerm}

**Includes:**
${tier.includes.map(item => `- ${item}`).join('\n')}

**Best for:** ${tier.bestFor}

**Deliverables:**
${tier.includes.map(item => `- ${item}`).join('\n')}

---`).join('\n\n')}

### Add-Ons

${addOns.map(addon => `**${addon.name}:** ${addon.price}
- ${addon.description}`).join('\n\n')}

---

## Founding Partner Offer (Limited Time)

**90-Day Pilot — £${foundingPartnerOffer.monthlyFee}/month** | Limited to ${foundingPartnerOffer.limit} total

**Includes:**
${foundingPartnerOffer.includes.map(item => `- ${item}`).join('\n')}

**Conversion Path:**
${foundingPartnerOffer.conversion}

**Benefits:**
- Low-risk trial period
- Full reporting included
- Priority consideration for permanent partnership
- Founder pricing locked in

---

## Placement Inventory

### Website Placements

${placements.website.map(p => `**${p.name}**
- Location: ${p.location}
- Format: ${p.format}
- Tracking: ${p.tracking}
${p.tier ? `- Tier: ${p.tier}` : ''}`).join('\n\n')}

### In-App Placements

${placements.inApp.map(p => `**${p.name}**
- Location: ${p.location}
- Format: ${p.format}
- Tracking: ${p.tracking}`).join('\n\n')}

### Content Activations

${placements.contentActivations.map(activation => `- **${activation}**`).join('\n')}

---

## Reporting & Analytics

### Monthly Reports Include:

**Performance Metrics:**
${reporting.monthlyReports.map(metric => `- ${metric}`).join('\n')}

**Placement Breakdown:**
- Impressions by placement type
- Clicks by placement type
- CTR by placement type
- Engagement trends

**Recommendations:**
- Optimization suggestions
- Placement performance insights
- Content activation ideas
- Strategy recommendations

### Tracking & Measurement

**UTM Parameters:**
- All sponsor links include UTM tracking
- Format: \`utm_source=professionaldiverapp&utm_medium=sponsorship&utm_campaign={sponsor}_{tier}_{month}\`
- Enables sponsor-side analytics integration

**GA4 Event Tracking:**
- \`sponsor_logo_impression\` — Logo view events
- \`sponsor_logo_click\` — Click-through events
- \`sponsor_cta_click\` — CTA interaction events
- All events include sponsor, placement, and tier data

**Server-Side Logging:**
- All events logged in database
- Historical data retention
- Custom date range reporting
- Export capabilities

### Report Delivery

- **Format:** ${reporting.delivery.format}
- **Frequency:** ${reporting.delivery.frequency}
- **Delivery:** ${reporting.delivery.method}

---

## Brand Neutrality & Editorial Control

### Our Commitment

Professional Diver Training maintains complete editorial independence. All educational content, training outcomes, and recommendations remain under our control.

**Sponsors Cannot Influence:**
- Training outcomes or scoring
- Safety guidance or curriculum decisions
- Educational content or recommendations
- Platform features or functionality

**Sponsor Placements:**
- Clearly labeled as "Partner" or "Sponsor"
- Separated from educational content
- Transparent to users
- Compliant with advertising standards

### Compliance

- **GDPR Compliant:** Aggregated metrics only, no personal data sharing
- **Advertising Standards:** All placements comply with UK advertising regulations
- **Brand Safety:** Content screening and approval process
- **Transparency:** Clear labeling of sponsored content

---

## Onboarding Process

${onboarding.steps.map(step => `### Step ${step.step}: ${step.name}${step.duration ? ` (${step.duration})` : ''}
${step.description}`).join('\n\n')}

**Total Timeline:** ${onboarding.totalTimeline}

---

## Pricing Summary

| Tier | Monthly Fee | Minimum Term | Key Features |
|------|------------|--------------|--------------|
| Bronze | £450 | 6-12 months | Homepage strip, quarterly reports |
| Silver | £950 | 6-12 months | Premium placement, in-app tile, monthly reports |
| Gold | £2,250 | 6-12 months | Premium placement, activations, strategy calls |
| Title/Founding | £4,500 | 6-12 months | Exclusivity, priority placement, 2 activations |
| **Founding Pilot** | **£750** | **90 days** | **Premium placement, full reporting** |

**Add-Ons:**
- Category Exclusivity: +35%
- Extra Activation: +£350–£750
- Recruitment Campaign: +£500–£1,500/month

---

## Next Steps

### Ready to Partner?

1. **Book a Call:** Schedule a 15-minute discovery call
   - Email: ${contact.email}
   - WhatsApp: ${contact.whatsapp}

2. **Submit Inquiry:** Fill out our partner inquiry form
   - ${contact.partnerInquiry}

3. **Review Package:** We'll customize a package for your goals

4. **Onboard:** Assets, tracking setup, placement configuration

5. **Go Live:** Launch within 10 business days

---

## Contact Information

**Email:** ${contact.email}  
**WhatsApp:** ${contact.whatsapp}  
**Website:** ${contact.website}  
**Partner Inquiry:** ${contact.partnerInquiry}  
**Location:** ${contact.location}

---

## Appendix

### Technical Details
- **Platform:** React 19, TypeScript, Node.js
- **Database:** PostgreSQL (production), SQLite (development)
- **Analytics:** Google Analytics 4, custom event tracking
- **Mobile:** Capacitor (iOS & Android native apps)
- **Hosting:** Cloudflare Pages + Railway

### Legal & Compliance
- Brand-neutral content policy
- GDPR compliant data handling
- UK advertising standards compliance
- Editorial independence maintained

---

*Professional Diver Training — Brand-neutral commercial diving education platform*

**Version 1.0 | ${issueDate}**
`;
}

function generateEmailSequencesMarkdown(): string {
  return `# Email Sequence Templates

## Initial Outreach Emails

${emailSequences.initialOutreach.map(email => `### ${email.name}

**Subject:** ${email.subject || 'N/A (LinkedIn DM)'}

---

${email.body}

---`).join('\n\n')}

## Follow-Up Sequence

${emailSequences.followUp.map(email => `### Day ${email.day} Follow-Up

**Subject:** ${email.subject}

---

${email.body}

---`).join('\n\n')}

## Closing Sequence

${emailSequences.closing.map(email => `### ${email.name}

**Subject:** ${email.subject}

---

${email.body}

---`).join('\n\n')}

## Usage Tips

1. **Personalize:** Mention something specific about their company
2. **Keep it short:** 3-4 paragraphs max
3. **Clear CTA:** "15-minute call next week?"
4. **Follow up:** 7 days, then 14 days
5. **Track responses:** Use a spreadsheet or CRM
6. **Be persistent but respectful:** 3 touches max, then move on
`;
}

function generateCRMImportCSV(): string {
  const headers = ['Company', 'Category', 'Contact Name', 'Email', 'Phone', 'Website', 'Source', 'Notes', 'Status', 'Pipeline Stage', 'Budget Range', 'Goals', 'First Contact Date', 'Last Contact Date', 'Next Follow Up'];
  
  const rows = prospectList.map(prospect => [
    prospect.company,
    prospect.category,
    '', // Contact Name - to be filled
    '', // Email - to be filled
    '', // Phone - to be filled
    prospect.website,
    prospect.source,
    prospect.notes,
    'Prospect',
    'Contacted',
    '', // Budget Range
    '', // Goals
    '', // First Contact Date
    '', // Last Contact Date
    ''  // Next Follow Up
  ]);

  // CSV formatting with proper escaping
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvRows = [headers.map(escapeCSV).join(',')];
  rows.forEach(row => {
    csvRows.push(row.map(escapeCSV).join(','));
  });

  return csvRows.join('\n');
}

function generateTrackingTemplateCSV(): string {
  const headers = ['Date', 'Company', 'Contact', 'Email', 'Category', 'Tier Interest', 'Status', 'Response', 'Notes', 'Next Action', 'Follow Up Date'];
  
  // Sample entries
  const sampleRows = [
    ['2026-01-14', 'Kirby Morgan', 'John Smith', 'john@kirbymorgan.com', 'helmets', 'Gold', 'Contacted', 'Interested', 'Requested more info', 'Send sponsor kit', '2026-01-21'],
    ['2026-01-14', 'Shearwater Research', 'Jane Doe', 'jane@shearwater.com', 'computers', 'Silver', 'Contacted', 'No response', 'Follow up in 7 days', 'Follow up email', '2026-01-21']
  ];

  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvRows = [headers.map(escapeCSV).join(',')];
  sampleRows.forEach(row => {
    csvRows.push(row.map(escapeCSV).join(','));
  });

  return csvRows.join('\n');
}

// ========== Main Execution ==========

async function main() {
  console.log('🚀 Generating Marketing Materials...\n');

  try {
    // Create directories
    await createDirectories();

    const baseDir = path.join(process.cwd(), 'marketing');

    // Generate Sponsor Kit
    console.log('📄 Generating sponsor kit...');
    const sponsorKitMD = generateSponsorKitMarkdown();
    await writeFile(path.join(baseDir, 'sponsor-kit.md'), sponsorKitMD, 'utf-8');
    console.log('✅ Created: marketing/sponsor-kit.md');

    const sponsorKitJSON = JSON.stringify(sponsorKitData, null, 2);
    await writeFile(path.join(baseDir, 'sponsor-kit.json'), sponsorKitJSON, 'utf-8');
    console.log('✅ Created: marketing/sponsor-kit.json');

    // Generate Email Sequences
    console.log('\n📧 Generating email sequences...');
    const emailSequencesMD = generateEmailSequencesMarkdown();
    await writeFile(path.join(baseDir, 'email-sequences', 'initial-outreach.md'), 
      emailSequences.initialOutreach.map(e => `# ${e.name}\n\n**Subject:** ${e.subject || 'N/A (LinkedIn DM)'}\n\n---\n\n${e.body}\n`).join('\n---\n\n'), 'utf-8');
    console.log('✅ Created: marketing/email-sequences/initial-outreach.md');

    await writeFile(path.join(baseDir, 'email-sequences', 'follow-up-sequence.md'),
      `# Follow-Up Email Sequence\n\n${emailSequences.followUp.map(e => `## ${e.day ? `Day ${e.day} Follow-Up` : e.name}\n\n**Subject:** ${e.subject}\n\n---\n\n${e.body}\n`).join('\n---\n\n')}`, 'utf-8');
    console.log('✅ Created: marketing/email-sequences/follow-up-sequence.md');

    await writeFile(path.join(baseDir, 'email-sequences', 'closing-sequence.md'),
      `# Closing Email Sequence\n\n${emailSequences.closing.map(e => `## ${e.name}\n\n**Subject:** ${e.subject}\n\n---\n\n${e.body}\n`).join('\n---\n\n')}`, 'utf-8');
    console.log('✅ Created: marketing/email-sequences/closing-sequence.md');

    const emailSequencesJSON = JSON.stringify(emailSequences, null, 2);
    await writeFile(path.join(baseDir, 'email-sequences', 'email-sequences.json'), emailSequencesJSON, 'utf-8');
    console.log('✅ Created: marketing/email-sequences/email-sequences.json');

    // Generate CRM Import Files
    console.log('\n📊 Generating CRM import files...');
    const crmCSV = generateCRMImportCSV();
    await writeFile(path.join(baseDir, 'crm-import', 'sponsor-prospects-highlevel.csv'), crmCSV, 'utf-8');
    console.log('✅ Created: marketing/crm-import/sponsor-prospects-highlevel.csv');

    const prospectsJSON = JSON.stringify(prospectList, null, 2);
    await writeFile(path.join(baseDir, 'crm-import', 'sponsor-prospects.json'), prospectsJSON, 'utf-8');
    console.log('✅ Created: marketing/crm-import/sponsor-prospects.json');

    // Generate Tracking Template
    console.log('\n📈 Generating tracking templates...');
    const trackingCSV = generateTrackingTemplateCSV();
    await writeFile(path.join(baseDir, 'outreach-tracking', 'outreach-tracker-template.csv'), trackingCSV, 'utf-8');
    console.log('✅ Created: marketing/outreach-tracking/outreach-tracker-template.csv');

    // Generate Documentation
    console.log('\n📚 Generating documentation...');
    
    const emailReadme = `# Email Sequence Usage Guide

## Overview

This directory contains email templates for sponsor outreach organized by sequence stage.

## Files

- **initial-outreach.md** - First contact emails (generic + personalized versions)
- **follow-up-sequence.md** - Follow-up emails (Day 7, Day 14, final)
- **closing-sequence.md** - Post-call, proposal, and onboarding emails
- **email-sequences.json** - All templates in JSON format for automation

## Usage

1. Copy the appropriate template
2. Replace variables: [First Name], [Company Name], [Your Name]
3. Personalize based on company research
4. Send via your email client or CRM

## Personalization Tips

- Mention specific company achievements or recent news
- Reference their industry category
- Customize based on their likely goals (awareness/leads/recruitment)
- Adjust tone based on company size (startup vs enterprise)
`;
    await writeFile(path.join(baseDir, 'email-sequences', 'README.md'), emailReadme, 'utf-8');
    console.log('✅ Created: marketing/email-sequences/README.md');

    const importInstructions = `# CRM Import Instructions

## HighLevel Import

1. Log into HighLevel
2. Navigate to Contacts → Import
3. Select "sponsor-prospects-highlevel.csv"
4. Map fields:
   - Company → Company Name
   - Category → Tags
   - Website → Website
   - Source → Custom Field
   - Notes → Notes
5. Set Pipeline Stage to "Prospect"
6. Import

## Field Mapping

| CSV Column | HighLevel Field | Notes |
|------------|----------------|-------|
| Company | Company Name | Primary field |
| Category | Tags | Use as tag |
| Website | Website | URL field |
| Source | Custom Field | Create "Source" custom field |
| Notes | Notes | Text field |
| Status | Pipeline Stage | Set to "Prospect" |

## Post-Import

1. Enrich contacts with email/phone from LinkedIn/websites
2. Add to "Sponsor Outreach" pipeline
3. Create follow-up tasks
4. Begin outreach sequence
`;
    await writeFile(path.join(baseDir, 'crm-import', 'import-instructions.md'), importInstructions, 'utf-8');
    console.log('✅ Created: marketing/crm-import/import-instructions.md');

    const trackingGuide = `# Outreach Tracking Guide

## Overview

Use the outreach-tracker-template.csv to track all sponsor outreach activities.

## Status Definitions

- **Prospect** - Company identified, not yet contacted
- **Contacted** - Initial outreach sent
- **Replied** - Company responded (positive or negative)
- **Meeting Booked** - Discovery call scheduled
- **Proposal Sent** - Custom proposal delivered
- **Negotiation** - Discussing terms
- **Won** - Sponsor signed agreement
- **Lost** - Declined or not interested

## Best Practices

1. **Update daily** - Keep tracker current
2. **Add notes** - Document all interactions
3. **Set follow-ups** - Never let a lead go cold
4. **Track metrics** - Response rate, close rate, average deal size

## Metrics to Monitor

- **Response Rate:** Replies / Contacts Sent
- **Meeting Rate:** Meetings Booked / Contacts Sent
- **Close Rate:** Won / Proposals Sent
- **Average Deal Size:** Total Revenue / Won Deals
- **Sales Cycle:** Average days from Contact to Won

## Next Actions

Common next actions:
- Send sponsor kit
- Follow up email
- Schedule call
- Send proposal
- Onboard sponsor
`;
    await writeFile(path.join(baseDir, 'outreach-tracking', 'tracking-guide.md'), trackingGuide, 'utf-8');
    console.log('✅ Created: marketing/outreach-tracking/tracking-guide.md');

    console.log('\n🎉 Marketing materials generation complete!');
    console.log('\n📋 Summary:');
    console.log(`   - ${prospectList.length} prospects in CRM import file`);
    console.log(`   - ${emailSequences.initialOutreach.length} initial outreach templates`);
    console.log(`   - ${emailSequences.followUp.length} follow-up templates`);
    console.log(`   - ${emailSequences.closing.length} closing templates`);
    console.log(`   - All files generated in multiple formats (Markdown, JSON, CSV)`);

  } catch (error) {
    console.error('❌ Error generating marketing materials:', error);
    process.exit(1);
  }
}

// Run if executed directly
main().catch(console.error);

export { main as generateMarketingMaterials };
