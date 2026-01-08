/**
 * Tagging Service
 * Manages client tags for GHL-like tagging system
 */

import { db } from "../db";
import { clientTags, type InsertClientTag } from "@shared/schema-sqlite";
import { eq, and } from "drizzle-orm";

export class TaggingService {
  /**
   * Add a tag to a client
   */
  async addTag(clientId: string, tagName: string, color?: string, createdBy?: string): Promise<any> {
    // Check if tag already exists for this client
    const existing = await db
      .select()
      .from(clientTags)
      .where(and(eq(clientTags.clientId, clientId), eq(clientTags.tagName, tagName)))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const tagData: InsertClientTag = {
      clientId,
      tagName,
      color: color || "#3b82f6", // Default blue
      createdBy: createdBy || null,
    };

    const [tag] = await db.insert(clientTags).values(tagData).returning();
    return tag;
  }

  /**
   * Remove a tag from a client
   */
  async removeTag(clientId: string, tagId: string): Promise<boolean> {
    const result = await db
      .delete(clientTags)
      .where(and(eq(clientTags.id, tagId), eq(clientTags.clientId, clientId)))
      .returning();

    return result.length > 0;
  }

  /**
   * Get all tags for a client
   */
  async getClientTags(clientId: string): Promise<any[]> {
    return await db
      .select()
      .from(clientTags)
      .where(eq(clientTags.clientId, clientId));
  }

  /**
   * Get all clients with a specific tag
   */
  async getClientsByTag(tagName: string): Promise<any[]> {
    const results = await db
      .select({
        clientId: clientTags.clientId,
      })
      .from(clientTags)
      .where(eq(clientTags.tagName, tagName));

    return results.map((r) => r.clientId);
  }

  /**
   * Update tag color
   */
  async updateTagColor(tagId: string, color: string): Promise<boolean> {
    const result = await db
      .update(clientTags)
      .set({ color })
      .where(eq(clientTags.id, tagId))
      .returning();

    return result.length > 0;
  }

  /**
   * Get all unique tag names used across all clients (for tag management)
   */
  async getAllTags(): Promise<{ tagName: string; count: number }[]> {
    const tags = await db.select().from(clientTags);
    
    // Group by tag name and count
    const tagMap = new Map<string, number>();
    tags.forEach((tag) => {
      tagMap.set(tag.tagName, (tagMap.get(tag.tagName) || 0) + 1);
    });

    return Array.from(tagMap.entries()).map(([tagName, count]) => ({
      tagName,
      count,
    }));
  }

  /**
   * Bulk add tags to a client
   */
  async addTags(clientId: string, tagNames: string[], createdBy?: string): Promise<any[]> {
    const tags: any[] = [];
    
    for (const tagName of tagNames) {
      const tag = await this.addTag(clientId, tagName, undefined, createdBy);
      tags.push(tag);
    }

    return tags;
  }

  /**
   * Remove all tags from a client
   */
  async removeAllTags(clientId: string): Promise<number> {
    const result = await db
      .delete(clientTags)
      .where(eq(clientTags.clientId, clientId))
      .returning();

    return result.length;
  }
}

export const taggingService = new TaggingService();

