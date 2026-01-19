# Marketing Materials for Sponsor Outreach

This directory contains all marketing materials needed to start sponsor outreach for Professional Diver Training.

## Quick Start

1. **Review the Sponsor Kit:** `sponsor-kit.md` (or `sponsor-kit.json` for programmatic access)
2. **Import Prospects:** Use `crm-import/sponsor-prospects-highlevel.csv` to import into your CRM
3. **Start Outreach:** Use email templates in `email-sequences/` folder
4. **Track Progress:** Use `outreach-tracking/outreach-tracker-template.csv`

## Directory Structure

```
marketing/
├── sponsor-kit.md                    # Comprehensive sponsor kit (Markdown)
├── sponsor-kit.json                   # Sponsor kit (JSON format)
├── email-sequences/
│   ├── initial-outreach.md           # First contact emails
│   ├── follow-up-sequence.md         # Follow-up templates
│   ├── closing-sequence.md          # Closing/proposal emails
│   ├── email-sequences.json         # All templates (JSON)
│   └── README.md                     # Email usage guide
├── crm-import/
│   ├── sponsor-prospects-highlevel.csv    # HighLevel CRM import (47 prospects)
│   ├── sponsor-prospects.json            # Prospects (JSON format)
│   └── import-instructions.md            # CRM import guide
├── outreach-tracking/
│   ├── outreach-tracker-template.csv     # Tracking spreadsheet
│   └── tracking-guide.md                 # How to use tracker
└── scripts/
    └── generate-marketing-materials.ts   # Auto-generation script
```

## Files Overview

### Sponsor Kit
- **sponsor-kit.md**: Human-readable sponsor kit with all tiers, pricing, placements, reporting details
- **sponsor-kit.json**: Same content in JSON format for API/automation use

### Email Sequences
- **initial-outreach.md**: 5 email templates (generic + 4 personalized versions)
- **follow-up-sequence.md**: Day 7 and Day 14 follow-up templates
- **closing-sequence.md**: Post-call, proposal, and onboarding emails
- **email-sequences.json**: All templates in structured JSON

### CRM Import
- **sponsor-prospects-highlevel.csv**: 47 pre-populated prospects ready for HighLevel import
- **sponsor-prospects.json**: Same data in JSON format
- **import-instructions.md**: Step-by-step import guide

### Outreach Tracking
- **outreach-tracker-template.csv**: Spreadsheet template for tracking outreach
- **tracking-guide.md**: How to use the tracker and best practices

## Regenerating Files

To regenerate all marketing materials:

```bash
npm run generate-marketing
```

Or directly:

```bash
npx tsx marketing/scripts/generate-marketing-materials.ts
```

## Next Steps

1. **Import Prospects into CRM:**
   - Open HighLevel (or your CRM)
   - Import `crm-import/sponsor-prospects-highlevel.csv`
   - Follow `crm-import/import-instructions.md`

2. **Enrich Contact Data:**
   - Use LinkedIn to find contact names and emails
   - Add phone numbers from company websites
   - Update CRM with enriched data

3. **Start Outreach:**
   - Use `email-sequences/initial-outreach.md` templates
   - Personalize for each company
   - Track in `outreach-tracking/outreach-tracker-template.csv`

4. **Follow Up:**
   - Use `email-sequences/follow-up-sequence.md` templates
   - Follow up on Day 7 and Day 14
   - Update tracker with responses

5. **Close Deals:**
   - Use `email-sequences/closing-sequence.md` templates
   - Send proposals using `sponsor-kit.md` as reference
   - Onboard new sponsors via admin dashboard

## Resources

- **Partner Inquiry Form:** https://professionaldiver.app/partner-inquiry
- **Admin Dashboard:** https://professionaldiver.app/admin/sponsors
- **Contact:** 1pull@professionaldiver.app | +447448320513

## Support

For questions about the marketing materials or outreach process, refer to:
- Email sequence README: `email-sequences/README.md`
- CRM import guide: `crm-import/import-instructions.md`
- Tracking guide: `outreach-tracking/tracking-guide.md`
