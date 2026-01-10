import { db } from "./db";
import { documentationSections, documentationChanges, documentationVersions, tracks, lessons, aiTutors } from "../shared/schema-sqlite";
import { eq, desc } from "drizzle-orm";
import LauraOracleService from "./laura-oracle-service";
import { EventEmitter } from "events";

/**
 * Documentation Updater Service
 * Integrates with Laura to generate and update documentation sections based on detected changes
 */
export class DocumentationUpdater extends EventEmitter {
  private static instance: DocumentationUpdater;
  private lauraOracle: LauraOracleService;

  private constructor() {
    super();
    try {
      this.lauraOracle = LauraOracleService.getInstance();
    } catch (error) {
      console.error('❌ Error initializing Laura Oracle service:', error);
      throw error;
    }
  }

  public static getInstance(): DocumentationUpdater {
    if (!DocumentationUpdater.instance) {
      DocumentationUpdater.instance = new DocumentationUpdater();
    }
    return DocumentationUpdater.instance;
  }

  /**
   * Process pending changes and update documentation
   */
  public async processPendingChanges(): Promise<void> {
    try {
      console.log('📝 Processing pending documentation changes...');

      // Get all pending changes
      const pendingChanges = await db.select()
        .from(documentationChanges)
        .where(eq(documentationChanges.status, 'pending'))
        .orderBy(desc(documentationChanges.detectedAt));

      if (pendingChanges.length === 0) {
        console.log('✅ No pending changes to process');
        return;
      }

      console.log(`📋 Found ${pendingChanges.length} pending change(s)`);

      // Process each change
      for (const change of pendingChanges) {
        try {
          await this.processChange(change);
          
          // Update change status to 'reviewed' (AI review process)
          await db.update(documentationChanges)
            .set({
              status: 'reviewed',
              processedAt: new Date(),
              processedBy: 'laura',
            })
            .where(eq(documentationChanges.id, change.id));

          console.log(`✅ Processed change: ${change.description}`);
        } catch (error) {
          console.error(`❌ Error processing change ${change.id}:`, error);
          
          // Mark as rejected if processing fails
          await db.update(documentationChanges)
            .set({
              status: 'rejected',
              processedAt: new Date(),
              processedBy: 'laura',
            })
            .where(eq(documentationChanges.id, change.id));
        }
      }
    } catch (error) {
      console.error('❌ Error processing pending changes:', error);
      throw error;
    }
  }

  /**
   * Process a single change and update documentation
   */
  private async processChange(change: any): Promise<void> {
    const metadata = change.metadata ? JSON.parse(change.metadata) : {};

    switch (change.changeType) {
      case 'content':
        await this.handleContentChange(change, metadata);
        break;
      case 'feature':
        await this.handleFeatureChange(change, metadata);
        break;
      case 'api':
        await this.handleApiChange(change, metadata);
        break;
      case 'ai':
        await this.handleAiChange(change, metadata);
        break;
      case 'schema':
        await this.handleSchemaChange(change, metadata);
        break;
      default:
        console.warn(`⚠️ Unknown change type: ${change.changeType}`);
    }
  }

  /**
   * Handle content changes (new tracks, lessons, etc.)
   */
  private async handleContentChange(change: any, metadata: any): Promise<void> {
    console.log(`📚 Handling content change: ${change.description}`);

    if (metadata.trackId) {
      // New track added - update training tracks section
      await this.updateTrainingTracksSection(metadata);
    } else if (metadata.lessonId) {
      // New lesson added - update lessons section
      await this.updateLessonsSection(metadata);
    } else if (metadata.tutorId) {
      // New AI tutor added - update AI tutors section
      await this.updateAiTutorsSection(metadata);
    }
  }

  /**
   * Handle feature changes
   */
  private async handleFeatureChange(change: any, metadata: any): Promise<void> {
    console.log(`🎯 Handling feature change: ${change.description}`);
    // Update relevant platform features section
    await this.updatePlatformFeaturesSection(change.description, metadata);
  }

  /**
   * Handle API changes
   */
  private async handleApiChange(change: any, metadata: any): Promise<void> {
    console.log(`🔌 Handling API change: ${change.description}`);
    // Update API endpoints section
    await this.updateApiEndpointsSection(change.description, metadata);
  }

  /**
   * Handle AI system changes
   */
  private async handleAiChange(change: any, metadata: any): Promise<void> {
    console.log(`🤖 Handling AI change: ${change.description}`);
    
    if (metadata.promptId === 'laura-oracle' || metadata.changeType === 'prompt_update') {
      // Laura's capabilities updated - self-update documentation
      await this.updateLauraOracleSection(metadata);
    } else if (metadata.tutorId || metadata.tutorName) {
      // AI tutor added or updated
      await this.updateAiTutorsSection(metadata);
    }
  }

  /**
   * Handle schema changes
   */
  private async handleSchemaChange(change: any, metadata: any): Promise<void> {
    console.log(`🗄️ Handling schema change: ${change.description}`);
    // Update technical information section
    await this.updateTechnicalInformationSection(change.description, metadata);
  }

  /**
   * Update Training Tracks section with Laura-generated content
   */
  private async updateTrainingTracksSection(metadata: any): Promise<void> {
    try {
      // Get track details
      const track = await db.select()
        .from(tracks)
        .where(eq(tracks.id, metadata.trackId))
        .limit(1);

      if (track.length === 0) {
        console.warn(`⚠️ Track not found: ${metadata.trackId}`);
        return;
      }

      const trackData = track[0];

      // Generate documentation update using Laura
      const prompt = `A new training track has been added to the platform:
Title: ${trackData.title}
Slug: ${trackData.slug}
Summary: ${trackData.summary || 'N/A'}
Difficulty: ${trackData.difficulty}
Estimated Hours: ${trackData.estimatedHours || 'N/A'}

Please generate an updated documentation section for the "Training Tracks" section that:
1. Adds this new track to the list of available tracks
2. Updates the track count (there are now more tracks)
3. Maintains the existing format and style
4. Includes relevant keywords for searchability

Return the updated content in a clear, professional format.`;

      const response = await this.lauraOracle.chatWithOracle(prompt, `doc-update-${Date.now()}`, {
        context: 'documentation_update',
        section: 'training-tracks',
      });

      // Get or create the training tracks section
      const existingSection = await db.select()
        .from(documentationSections)
        .where(eq(documentationSections.sectionId, 'training-tracks'))
        .limit(1);

      if (existingSection.length > 0) {
        // Update existing section
        const section = existingSection[0];
        const newVersion = (section.version || 1) + 1;

        // Save version history
        await db.insert(documentationVersions).values({
          sectionId: section.sectionId,
          version: section.version || 1,
          content: section.content,
          createdBy: 'laura',
        });

        // Update section
        await db.update(documentationSections)
          .set({
            content: response.response,
            version: newVersion,
            lastUpdated: new Date(),
            updatedBy: 'laura',
            changeType: 'content',
          })
          .where(eq(documentationSections.sectionId, 'training-tracks'));
      } else {
        // Create new section
        await db.insert(documentationSections).values({
          sectionId: 'training-tracks',
          category: 'Learning Features',
          title: 'Training Tracks',
          content: response.response,
          version: 1,
          updatedBy: 'laura',
          changeType: 'content',
        });
      }

      console.log('✅ Training Tracks section updated');
    } catch (error) {
      console.error('❌ Error updating Training Tracks section:', error);
      throw error;
    }
  }

  /**
   * Update Lessons section
   */
  private async updateLessonsSection(metadata: any): Promise<void> {
    // Similar implementation to updateTrainingTracksSection
    // This would update the lessons & content section
    console.log('📖 Updating Lessons section...');
  }

  /**
   * Update AI Tutors section
   */
  private async updateAiTutorsSection(metadata: any): Promise<void> {
    try {
      // Get tutor details if available
      let tutorData = null;
      if (metadata.tutorId) {
        const tutors = await db.select()
          .from(aiTutors)
          .where(eq(aiTutors.id, metadata.tutorId))
          .limit(1);
        
        if (tutors.length > 0) {
          tutorData = tutors[0];
        }
      }

      // Generate update using Laura
      const prompt = `The AI Tutors section needs to be updated. ${metadata.tutorName ? `New tutor: ${metadata.tutorName} (${metadata.tutorSpecialty || 'General'})` : 'AI tutor information has changed.'}

Please update the "AI Tutors (9 Discipline Experts)" section to reflect this change while maintaining the existing format and style.`;

      const response = await this.lauraOracle.chatWithOracle(prompt, `doc-update-${Date.now()}`, {
        context: 'documentation_update',
        section: 'ai-tutors',
      });

      // Update or create section (similar to updateTrainingTracksSection)
      const existingSection = await db.select()
        .from(documentationSections)
        .where(eq(documentationSections.sectionId, 'ai-tutors'))
        .limit(1);

      if (existingSection.length > 0) {
        const section = existingSection[0];
        const newVersion = (section.version || 1) + 1;

        await db.insert(documentationVersions).values({
          sectionId: section.sectionId,
          version: section.version || 1,
          content: section.content,
          createdBy: 'laura',
        });

        await db.update(documentationSections)
          .set({
            content: response.response,
            version: newVersion,
            lastUpdated: new Date(),
            updatedBy: 'laura',
            changeType: 'ai',
          })
          .where(eq(documentationSections.sectionId, 'ai-tutors'));
      }

      console.log('✅ AI Tutors section updated');
    } catch (error) {
      console.error('❌ Error updating AI Tutors section:', error);
      throw error;
    }
  }

  /**
   * Update Platform Features section
   */
  private async updatePlatformFeaturesSection(description: string, metadata: any): Promise<void> {
    console.log('🎯 Updating Platform Features section...');
    // Implementation similar to above
  }

  /**
   * Update API Endpoints section
   */
  private async updateApiEndpointsSection(description: string, metadata: any): Promise<void> {
    console.log('🔌 Updating API Endpoints section...');
    // Implementation similar to above
  }

  /**
   * Update Laura Oracle section (self-update)
   */
  private async updateLauraOracleSection(metadata: any): Promise<void> {
    try {
      const prompt = `Laura's capabilities or system prompt have been updated. Please update the "Laura Platform Oracle" section in the documentation to reflect the current capabilities while maintaining the existing format and style.

Metadata: ${JSON.stringify(metadata)}`;

      const response = await this.lauraOracle.chatWithOracle(prompt, `doc-update-${Date.now()}`, {
        context: 'documentation_update',
        section: 'laura-oracle',
        selfUpdate: true,
      });

      // Update laura-oracle section
      const existingSection = await db.select()
        .from(documentationSections)
        .where(eq(documentationSections.sectionId, 'laura-oracle'))
        .limit(1);

      if (existingSection.length > 0) {
        const section = existingSection[0];
        const newVersion = (section.version || 1) + 1;

        await db.insert(documentationVersions).values({
          sectionId: section.sectionId,
          version: section.version || 1,
          content: section.content,
          createdBy: 'laura',
        });

        await db.update(documentationSections)
          .set({
            content: response.response,
            version: newVersion,
            lastUpdated: new Date(),
            updatedBy: 'laura',
            changeType: 'ai',
          })
          .where(eq(documentationSections.sectionId, 'laura-oracle'));
      }

      console.log('✅ Laura Oracle section updated (self-update)');
    } catch (error) {
      console.error('❌ Error updating Laura Oracle section:', error);
      throw error;
    }
  }

  /**
   * Update Technical Information section
   */
  private async updateTechnicalInformationSection(description: string, metadata: any): Promise<void> {
    console.log('🗄️ Updating Technical Information section...');
    // Implementation similar to above
  }

  /**
   * Generate documentation section from scratch using Laura
   */
  public async generateDocumentationSection(
    sectionId: string,
    category: string,
    title: string,
    context: string
  ): Promise<void> {
    try {
      const prompt = `Generate comprehensive documentation content for a new section:
Section ID: ${sectionId}
Category: ${category}
Title: ${title}

Context: ${context}

Please generate professional, clear documentation content that:
1. Follows the existing documentation style and format
2. Includes relevant keywords for searchability
3. Is comprehensive and helpful for users
4. Includes subsections if appropriate
5. Includes related links where relevant

Return the content in a clear format.`;

      const response = await this.lauraOracle.chatWithOracle(prompt, `doc-generate-${Date.now()}`, {
        context: 'documentation_generation',
        section: sectionId,
      });

      // Create new section
      await db.insert(documentationSections).values({
        sectionId,
        category,
        title,
        content: response.response,
        version: 1,
        updatedBy: 'laura',
        changeType: 'content',
      });

      console.log(`✅ Generated new documentation section: ${title}`);
    } catch (error) {
      console.error(`❌ Error generating documentation section ${sectionId}:`, error);
      throw error;
    }
  }

  /**
   * Get documentation section
   */
  public async getSection(sectionId: string): Promise<any | null> {
    try {
      const sections = await db.select()
        .from(documentationSections)
        .where(eq(documentationSections.sectionId, sectionId))
        .limit(1);

      return sections.length > 0 ? sections[0] : null;
    } catch (error) {
      console.error(`❌ Error fetching section ${sectionId}:`, error);
      return null;
    }
  }

  /**
   * Get all sections by category
   */
  public async getSectionsByCategory(category: string): Promise<any[]> {
    try {
      return await db.select()
        .from(documentationSections)
        .where(eq(documentationSections.category, category))
        .where(eq(documentationSections.isActive, true))
        .orderBy(desc(documentationSections.lastUpdated));
    } catch (error) {
      console.error(`❌ Error fetching sections for category ${category}:`, error);
      return [];
    }
  }
}

export default DocumentationUpdater;

