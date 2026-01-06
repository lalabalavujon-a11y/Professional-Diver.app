/**
 * Calendar Sync Manager
 * Centralized manager for handling calendar synchronization across different providers
 */

export type SyncProvider = 'google' | 'outlook' | 'apple';
export type SyncDirection = 'bidirectional' | 'pull' | 'push';

export interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  provider: SyncProvider;
}

export interface SyncEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  allDay?: boolean;
}

/**
 * Base interface for sync providers
 */
export interface CalendarSyncProvider {
  provider: SyncProvider;
  
  /**
   * Authenticate with the provider
   */
  authenticate(userId: string): Promise<string>;
  
  /**
   * Pull events from external calendar
   */
  pullEvents(userId: string, startDate: Date, endDate: Date): Promise<SyncEvent[]>;
  
  /**
   * Push events to external calendar
   */
  pushEvents(userId: string, events: SyncEvent[]): Promise<SyncResult>;
  
  /**
   * Sync bidirectionally
   */
  sync(userId: string, localEvents: SyncEvent[], startDate: Date, endDate: Date): Promise<SyncResult>;
  
  /**
   * Disconnect the provider
   */
  disconnect(userId: string): Promise<void>;
}

/**
 * Conflict resolution strategies
 */
export enum ConflictResolution {
  LOCAL_WINS = 'local_wins',
  REMOTE_WINS = 'remote_wins',
  NEWEST_WINS = 'newest_wins',
  MANUAL = 'manual',
}

/**
 * Map operation types to external calendar categories/colors
 */
export function mapOperationTypeToCategory(type: string): string {
  const mapping: Record<string, string> = {
    'DIVE': 'Dive',
    'INSPECTION': 'Inspection',
    'MAINTENANCE': 'Maintenance',
    'TRAINING': 'Training',
    'OTHER': 'Other',
  };
  return mapping[type] || 'Other';
}

/**
 * Map external calendar categories to operation types
 */
export function mapCategoryToOperationType(category: string): 'DIVE' | 'INSPECTION' | 'MAINTENANCE' | 'TRAINING' | 'OTHER' {
  const categoryUpper = category.toUpperCase();
  if (categoryUpper.includes('DIVE')) return 'DIVE';
  if (categoryUpper.includes('INSPECTION')) return 'INSPECTION';
  if (categoryUpper.includes('MAINTENANCE')) return 'MAINTENANCE';
  if (categoryUpper.includes('TRAINING')) return 'TRAINING';
  return 'OTHER';
}

