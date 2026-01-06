import ICAL from 'ical.js';

interface ParsedEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  type: 'DIVE' | 'INSPECTION' | 'MAINTENANCE' | 'TRAINING' | 'OTHER';
  allDay: boolean;
  externalId?: string;
}

/**
 * Parse an iCal/ICS file and extract events
 */
export function parseICalFile(icalContent: string): ParsedEvent[] {
  try {
    const jcalData = ICAL.parse(icalContent);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    return vevents.map((vevent) => {
      const event = new ICAL.Event(vevent);
      
      const summary = event.summary || 'Untitled Event';
      const description = event.description || '';
      
      // Get start and end times
      const startDate = event.startDate.toJSDate();
      const endDate = event.endDate ? event.endDate.toJSDate() : new Date(startDate.getTime() + 3600000); // Default 1 hour
      
      // Check if all-day event
      const allDay = event.startDate.icaltype === 'date' || !event.startDate.hour;

      // Extract location
      const location = event.location || undefined;

      // Try to extract type from categories or description
      let type: 'DIVE' | 'INSPECTION' | 'MAINTENANCE' | 'TRAINING' | 'OTHER' = 'OTHER';
      if (event.categories && event.categories.length > 0) {
        const category = event.categories[0].toUpperCase();
        if (['DIVE', 'INSPECTION', 'MAINTENANCE', 'TRAINING', 'OTHER'].includes(category)) {
          type = category as typeof type;
        }
      } else if (description) {
        // Try to parse from description
        const descUpper = description.toUpperCase();
        if (descUpper.includes('DIVE')) type = 'DIVE';
        else if (descUpper.includes('INSPECTION')) type = 'INSPECTION';
        else if (descUpper.includes('MAINTENANCE')) type = 'MAINTENANCE';
        else if (descUpper.includes('TRAINING')) type = 'TRAINING';
      }

      // Extract external ID (from URL or UID)
      const uid = vevent.getFirstPropertyValue('uid');
      const url = vevent.getFirstPropertyValue('url');
      let externalId = uid;
      if (url && typeof url === 'string' && url.includes('://')) {
        externalId = url.split('://')[1] || uid;
      }

      return {
        title: summary,
        description: description || undefined,
        startDate,
        endDate,
        location,
        type,
        allDay,
        externalId,
      };
    });
  } catch (error) {
    console.error('Error parsing iCal file:', error);
    throw new Error('Failed to parse iCal file: ' + (error instanceof Error ? error.message : String(error)));
  }
}

