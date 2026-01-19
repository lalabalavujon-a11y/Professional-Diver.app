# CRM Import Instructions

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
