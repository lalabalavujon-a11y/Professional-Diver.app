#!/usr/bin/env tsx

/**
 * Add Partners to CRM Script
 * 
 * This script adds the current partners to the CRM system
 * and tags them with "Partners" tag
 */

import { db } from "../server/db";
import { tempStorage } from "../server/temp-storage";
import { taggingService } from "../server/services/tagging-service";
import { sql, eq } from "drizzle-orm";
import { clients as clientsTable } from "@shared/schema-sqlite";
import { randomBytes } from "crypto";

function generateId(): string {
  return randomBytes(16).toString("hex");
}

const PARTNERS = [
  {
    name: "Freddie Russell Joseph",
    email: "freddierusseljoseph@yahoo.com",
    subscriptionType: "LIFETIME" as const,
    status: "ACTIVE" as const,
    partnerStatus: "ACTIVE" as const,
  },
  {
    name: "Dilo Suka",
    email: "deesuks@gmail.com",
    subscriptionType: "LIFETIME" as const,
    status: "ACTIVE" as const,
    partnerStatus: "ACTIVE" as const,
  },
  {
    name: "Steve Hall",
    email: "steve44hall@yahoo.co.uk",
    subscriptionType: "LIFETIME" as const,
    status: "ACTIVE" as const,
    partnerStatus: "ACTIVE" as const,
  },
  {
    name: "Mike Scarpellini",
    email: "mike@ascotwood.com",
    subscriptionType: "LIFETIME" as const,
    status: "ACTIVE" as const,
    partnerStatus: "ACTIVE" as const,
  },
];

async function ensureCrmTables() {
  // Only create tables for SQLite (dev environment)
  if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'development') {
    return; // PostgreSQL will use migrations
  }

  try {
    // Get raw SQLite instance
    const sqlite = (db as any).sqlite;
    if (!sqlite) {
      console.warn('SQLite instance not available, skipping table creation');
      return;
    }

    // Create client_tags table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS client_tags (
        id text PRIMARY KEY NOT NULL,
        client_id text NOT NULL,
        tag_name text NOT NULL,
        color text DEFAULT '#3b82f6',
        created_at integer NOT NULL,
        created_by text,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create communications table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS communications (
        id text PRIMARY KEY NOT NULL,
        client_id text NOT NULL,
        type text NOT NULL CHECK(type IN ('email', 'phone', 'sms', 'whatsapp', 'note')),
        direction text NOT NULL CHECK(direction IN ('inbound', 'outbound')),
        subject text,
        content text NOT NULL,
        status text NOT NULL DEFAULT 'sent' CHECK(status IN ('sent', 'delivered', 'read', 'failed', 'answered', 'missed')),
        duration integer,
        metadata text,
        created_by text,
        created_at integer NOT NULL,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Add missing columns to clients table if they don't exist
    const columnsToAdd = [
      { name: 'phone', type: 'text' },
      { name: 'user_id', type: 'text' },
      { name: 'partner_status', type: 'text DEFAULT "NONE"' },
      { name: 'conversion_date', type: 'integer' },
      { name: 'highlevel_contact_id', type: 'text' },
    ];

    for (const col of columnsToAdd) {
      try {
        sqlite.exec(`ALTER TABLE clients ADD COLUMN ${col.name} ${col.type};`);
        console.log(`   ✓ Added column: ${col.name}`);
      } catch (e: any) {
        // Column might already exist, ignore error
        if (!e.message?.includes('duplicate column') && !e.message?.includes('duplicate column name')) {
          console.warn(`   ⚠️  Error adding column ${col.name}:`, e.message);
        }
      }
    }

    // Create indexes for better performance
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_client_tags_client_id ON client_tags(client_id);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_communications_client_id ON communications(client_id);`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_communications_created_at ON communications(created_at DESC);`);
  } catch (error) {
    console.error('Error ensuring CRM tables:', error);
    throw error;
  }
}

async function addPartnersToCRM() {
  console.log("🚀 Adding Partners to CRM...\n");

  // Ensure tables exist
  await ensureCrmTables();

  let addedCount = 0;
  let updatedCount = 0;
  let taggedCount = 0;
  let errors: string[] = [];

  for (const partner of PARTNERS) {
    try {
      console.log(`📝 Processing ${partner.name} (${partner.email})...`);

      // Check if client already exists using Drizzle
      const existingClients = await db.select({
        id: clientsTable.id,
        name: clientsTable.name,
        email: clientsTable.email,
      }).from(clientsTable)
        .where(eq(clientsTable.email, partner.email));

      let clientId: string;
      let isNew = false;

      if (existingClients && existingClients.length > 0) {
        // Client exists - update it
        const existing = existingClients[0];
        clientId = existing.id;
        console.log(`   ✓ Client already exists (ID: ${clientId}), updating...`);
        
        // Update client with partner information using Drizzle
        await db.update(clientsTable)
          .set({
            name: partner.name,
            subscriptionType: partner.subscriptionType as any,
            status: partner.status as any,
            partnerStatus: partner.partnerStatus as any,
            updatedAt: new Date(),
          })
          .where(eq(clientsTable.id, clientId));
        
        updatedCount++;
      } else {
        // Create new client using Drizzle
        console.log(`   ➕ Creating new client...`);
        const clientId_new = generateId();
        const now = new Date();
        
        // Build values object, omitting userId if column doesn't exist
        const clientValues: any = {
          id: clientId_new,
          name: partner.name,
          email: partner.email,
          subscriptionType: partner.subscriptionType as any,
          status: partner.status as any,
          partnerStatus: partner.partnerStatus as any,
          monthlyRevenue: 0, // Lifetime partners have $0 monthly revenue
          subscriptionDate: now,
          createdAt: now,
          updatedAt: now,
        };
        
        // Only include userId if the column exists (it's optional)
        // For now, omit it to avoid schema mismatch issues
        // userId can be added later if needed
        
        await db.insert(clientsTable).values(clientValues);
        
        clientId = clientId_new;
        isNew = true;
        addedCount++;
      }

      // Check if "Partners" tag already exists
      const existingTags = await taggingService.getClientTags(clientId);
      const hasPartnerTag = existingTags.some((tag: any) => 
        tag.tagName.toLowerCase() === "partners" || tag.tagName.toLowerCase() === "partner"
      );

      if (!hasPartnerTag) {
        // Add "Partners" tag with a distinctive color (green for partners)
        await taggingService.addTag(clientId, "Partners", "#10b981"); // Green color
        console.log(`   🏷️  Tagged with "Partners"`);
        taggedCount++;
      } else {
        console.log(`   ✓ Already tagged as Partner`);
      }

      console.log(`   ✅ ${isNew ? 'Added' : 'Updated'} ${partner.name} successfully\n`);
    } catch (error: any) {
      const errorMsg = `Failed to process ${partner.name}: ${error.message}`;
      console.error(`   ❌ ${errorMsg}\n`);
      errors.push(errorMsg);
    }
  }

  // Summary
  console.log("=" .repeat(50));
  console.log("📊 Summary:");
  console.log(`   ➕ New clients added: ${addedCount}`);
  console.log(`   ✏️  Existing clients updated: ${updatedCount}`);
  console.log(`   🏷️  Clients tagged: ${taggedCount}`);
  
  if (errors.length > 0) {
    console.log(`   ❌ Errors: ${errors.length}`);
    errors.forEach(err => console.log(`      - ${err}`));
  } else {
    console.log(`   ✅ All partners processed successfully!`);
  }
  console.log("=" .repeat(50));
}

// Run the script
addPartnersToCRM()
  .then(() => {
    console.log("\n🎉 Script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

