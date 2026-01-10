import { Request, Response } from 'express';
import { db } from '../db';
import { documentationSections, documentationChanges, documentationVersions } from '../../shared/schema-sqlite';
import { eq, desc, and, like, or } from 'drizzle-orm';
import DocumentationUpdater from '../documentation-updater';
import PlatformChangeMonitor from '../platform-change-monitor';
import LangSmithChangeTracker from '../langsmith-change-tracker';

/**
 * Get all documentation sections
 */
export async function getDocumentationSections(req: Request, res: Response) {
  try {
    const { category, search } = req.query;

    let query = db.select()
      .from(documentationSections)
      .where(eq(documentationSections.isActive, true));

    if (category && category !== 'all') {
      query = query.where(eq(documentationSections.category, category as string)) as any;
    }

    let sections = await query.orderBy(desc(documentationSections.lastUpdated));

    // Apply search filter if provided
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      sections = sections.filter(section => {
        const matchesTitle = section.title?.toLowerCase().includes(searchLower);
        const matchesContent = section.content?.toLowerCase().includes(searchLower);
        const matchesKeywords = section.keywords ? JSON.parse(section.keywords as string).some((k: string) => 
          k.toLowerCase().includes(searchLower)
        ) : false;
        return matchesTitle || matchesContent || matchesKeywords;
      });
    }

    // Parse JSON fields
    const parsedSections = sections.map(section => ({
      ...section,
      subsections: section.subsections ? JSON.parse(section.subsections as string) : [],
      relatedLinks: section.relatedLinks ? JSON.parse(section.relatedLinks as string) : [],
      keywords: section.keywords ? JSON.parse(section.keywords as string) : [],
    }));

    res.json({
      success: true,
      sections: parsedSections,
      count: parsedSections.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error fetching documentation sections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documentation sections',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get a single documentation section by ID
 */
export async function getDocumentationSection(req: Request, res: Response) {
  try {
    const { sectionId } = req.params;

    const sections = await db.select()
      .from(documentationSections)
      .where(eq(documentationSections.sectionId, sectionId))
      .limit(1);

    if (sections.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Section not found',
      });
    }

    const section = sections[0];

    // Parse JSON fields
    const parsedSection = {
      ...section,
      subsections: section.subsections ? JSON.parse(section.subsections as string) : [],
      relatedLinks: section.relatedLinks ? JSON.parse(section.relatedLinks as string) : [],
      keywords: section.keywords ? JSON.parse(section.keywords as string) : [],
    };

    res.json({
      success: true,
      section: parsedSection,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error fetching documentation section:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documentation section',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get documentation change history
 */
export async function getDocumentationChanges(req: Request, res: Response) {
  try {
    const { status, changeType, limit = '50' } = req.query;

    let query = db.select()
      .from(documentationChanges)
      .orderBy(desc(documentationChanges.detectedAt))
      .limit(parseInt(limit as string));

    if (status && status !== 'all') {
      query = query.where(eq(documentationChanges.status, status as string)) as any;
    }

    if (changeType && changeType !== 'all') {
      query = query.where(eq(documentationChanges.changeType, changeType as string)) as any;
    }

    const changes = await query;

    // Parse JSON fields
    const parsedChanges = changes.map(change => ({
      ...change,
      metadata: change.metadata ? JSON.parse(change.metadata as string) : {},
    }));

    res.json({
      success: true,
      changes: parsedChanges,
      count: parsedChanges.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error fetching documentation changes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch documentation changes',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get version history for a section
 */
export async function getSectionVersions(req: Request, res: Response) {
  try {
    const { sectionId } = req.params;

    const versions = await db.select()
      .from(documentationVersions)
      .where(eq(documentationVersions.sectionId, sectionId))
      .orderBy(desc(documentationVersions.version));

    res.json({
      success: true,
      versions,
      count: versions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error fetching section versions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch section versions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Manually trigger documentation update (admin only)
 */
export async function triggerDocumentationUpdate(req: Request, res: Response) {
  try {
    // Check if user is admin (simplified - should check actual user role)
    // In production, use proper authentication middleware

    console.log('🔄 Manual documentation update triggered');

    const updater = DocumentationUpdater.getInstance();
    await updater.processPendingChanges();

    res.json({
      success: true,
      message: 'Documentation update process initiated',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error triggering documentation update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger documentation update',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Force sync from platform state (admin only)
 */
export async function forceSyncFromPlatform(req: Request, res: Response) {
  try {
    // Check if user is admin (simplified - should check actual user role)

    console.log('🔄 Force sync from platform triggered');

    // Force check from both monitors
    const platformMonitor = PlatformChangeMonitor.getInstance();
    await platformMonitor.forceCheck();

    const langsmithTracker = LangSmithChangeTracker.getInstance();
    if (langsmithTracker.isAvailable()) {
      await langsmithTracker.forceCheck();
    }

    // Process any pending changes
    const updater = DocumentationUpdater.getInstance();
    await updater.processPendingChanges();

    res.json({
      success: true,
      message: 'Platform sync completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error forcing sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force sync',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get pending changes count
 */
export async function getPendingChangesCount(req: Request, res: Response) {
  try {
    const pendingCount = await db.select()
      .from(documentationChanges)
      .where(eq(documentationChanges.status, 'pending'));

    res.json({
      success: true,
      count: pendingCount.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error fetching pending changes count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending changes count',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

