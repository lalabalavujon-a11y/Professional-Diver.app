#!/usr/bin/env tsx
/**
 * Set default location to Port of Southampton
 * This script sets Port of Southampton as the default widget location for all users
 */

import { db } from "../server/db";
import { widgetLocations as widgetLocationsSQLite, users as usersSQLite } from "@shared/schema-sqlite";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const PORT_OF_SOUTHAMPTON = {
  latitude: 50.863714,
  longitude: -1.425028,
  locationName: 'Port of Southampton (Current Location)',
  isCurrentLocation: true,
};

async function setDefaultLocation() {
  try {
    console.log('Setting default location to Port of Southampton...');
    
    // Use SQLite table (for development)
    const widgetLocationsTable = widgetLocationsSQLite;
    
    // Get all users - use drizzle query
    const users = await db.select().from(usersSQLite);
    
    if (users.length === 0) {
      console.log('No users found');
      return;
    }
    
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      const userId = user.id;
      const email = user.email;
      
      // Check if user already has a location
      const existing = await db
        .select()
        .from(widgetLocationsTable)
        .where(eq(widgetLocationsTable.userId, userId))
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing location
        await db
          .update(widgetLocationsTable)
          .set({
            latitude: PORT_OF_SOUTHAMPTON.latitude,
            longitude: PORT_OF_SOUTHAMPTON.longitude,
            locationName: PORT_OF_SOUTHAMPTON.locationName,
            isCurrentLocation: PORT_OF_SOUTHAMPTON.isCurrentLocation,
            updatedAt: Date.now(),
          })
          .where(eq(widgetLocationsTable.userId, userId));
        console.log(`Updated location for user: ${email}`);
      } else {
        // Create new location
        const id = nanoid();
        await db
          .insert(widgetLocationsTable)
          .values({
            id,
            userId,
            latitude: PORT_OF_SOUTHAMPTON.latitude,
            longitude: PORT_OF_SOUTHAMPTON.longitude,
            locationName: PORT_OF_SOUTHAMPTON.locationName,
            isCurrentLocation: PORT_OF_SOUTHAMPTON.isCurrentLocation,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        console.log(`Created location for user: ${email}`);
      }
    }
    
    console.log('Done! All users now have Port of Southampton as their default location.');
  } catch (error) {
    console.error('Error setting default location:', error);
    process.exit(1);
  }
}

setDefaultLocation();
