import ical from 'ical-generator';
import { Calendar } from 'ical-generator';

interface Operation {
  id: string;
  title: string;
  description?: string | null;
  operationDate: string | Date;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  type: 'DIVE' | 'INSPECTION' | 'MAINTENANCE' | 'TRAINING' | 'OTHER';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  color?: string | null;
}

/**
 * Generate an iCal/ICS file from operations
 */
export function generateICalFromOperations(
  operations: Operation[],
  calendarName: string = 'Operations Calendar',
  timezone: string = 'UTC'
): string {
  const cal = ical({
    name: calendarName,
    timezone: timezone,
    prodId: {
      company: 'Diver Well Training',
      product: 'Operations Calendar',
      language: 'EN',
    },
  });

  operations.forEach((op) => {
    const startDate = op.operationDate instanceof Date 
      ? new Date(op.operationDate) 
      : new Date(op.operationDate);

    // Parse start time if provided
    let startDateTime = new Date(startDate);
    if (op.startTime) {
      const [hours, minutes] = op.startTime.split(':').map(Number);
      startDateTime.setHours(hours || 0, minutes || 0, 0, 0);
    } else {
      // Default to start of day if no time specified
      startDateTime.setHours(0, 0, 0, 0);
    }

    // Parse end time if provided, otherwise default to 1 hour after start
    let endDateTime = new Date(startDate);
    if (op.endTime) {
      const [hours, minutes] = op.endTime.split(':').map(Number);
      endDateTime.setHours(hours || 0, minutes || 0, 0, 0);
    } else {
      // Default to 1 hour after start if no end time
      endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + 1);
    }

    // Map operation type to iCal category
    const category = op.type;

    // Build description with additional details
    let description = op.description || '';
    if (op.type) {
      description = `Type: ${op.type}\n${description}`.trim();
    }
    if (op.status) {
      description = `${description}\nStatus: ${op.status}`.trim();
    }

    cal.createEvent({
      id: op.id,
      start: startDateTime,
      end: endDateTime,
      summary: op.title,
      description: description || undefined,
      location: op.location || undefined,
      categories: [{ name: category }],
      allDay: !op.startTime && !op.endTime,
      status: op.status === 'CANCELLED' ? 'CANCELLED' : 
              op.status === 'COMPLETED' ? 'CONFIRMED' : 'CONFIRMED',
      // Store operation ID in URL field for reference
      url: `operations://${op.id}`,
    });
  });

  return cal.toString();
}







