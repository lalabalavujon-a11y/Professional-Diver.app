import { createRequire } from "module";
import { existsSync, mkdirSync } from "fs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3") as typeof import("better-sqlite3");

/**
 * Ensure equipment tables exist in the database
 * Creates tables if they don't exist (similar to ensureSrsTables pattern)
 */
async function ensureEquipmentTables() {
  console.log("🔧 Ensuring equipment tables exist...");

  try {
    // Connect to SQLite database directly
    const file = process.env.SQLITE_FILE ?? "./.data/dev.sqlite";
    const dir = file.substring(0, file.lastIndexOf("/"));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const sqlite = new Database(file);

    // Create equipment_types table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS equipment_types (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        description text,
        default_maintenance_interval text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL
      );
    `);

    // Create equipment_items table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS equipment_items (
        id text PRIMARY KEY NOT NULL,
        equipment_type_id text NOT NULL,
        name text NOT NULL,
        serial_number text,
        manufacturer text,
        model text,
        purchase_date integer,
        status text NOT NULL DEFAULT 'OPERATIONAL',
        location text,
        notes text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE cascade
      );
    `);

    // Create maintenance_schedules table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS maintenance_schedules (
        id text PRIMARY KEY NOT NULL,
        equipment_type_id text NOT NULL,
        name text NOT NULL,
        interval_type text NOT NULL,
        interval_value integer,
        checklist text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id) ON DELETE cascade
      );
    `);

    // Create maintenance_tasks table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS maintenance_tasks (
        id text PRIMARY KEY NOT NULL,
        equipment_item_id text NOT NULL,
        maintenance_schedule_id text NOT NULL,
        scheduled_date integer NOT NULL,
        completed_date integer,
        status text NOT NULL DEFAULT 'SCHEDULED',
        assigned_to text,
        notes text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (equipment_item_id) REFERENCES equipment_items(id) ON DELETE cascade,
        FOREIGN KEY (maintenance_schedule_id) REFERENCES maintenance_schedules(id) ON DELETE cascade
      );
    `);

    // Create maintenance_logs table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id text PRIMARY KEY NOT NULL,
        maintenance_task_id text,
        equipment_item_id text NOT NULL,
        performed_by text NOT NULL,
        performed_date integer NOT NULL,
        checklist_results text,
        notes text,
        parts_replaced text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (maintenance_task_id) REFERENCES maintenance_tasks(id) ON DELETE set null,
        FOREIGN KEY (equipment_item_id) REFERENCES equipment_items(id) ON DELETE cascade
      );
    `);

    // Create equipment_use_logs table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS equipment_use_logs (
        id text PRIMARY KEY NOT NULL,
        equipment_item_id text NOT NULL,
        use_type text NOT NULL,
        log_date integer NOT NULL,
        performed_by text NOT NULL,
        condition text NOT NULL,
        defects text,
        notes text,
        hours_used real,
        location text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (equipment_item_id) REFERENCES equipment_items(id) ON DELETE cascade
      );
    `);

    sqlite.close();
    console.log("✅ Equipment tables ensured successfully!");
  } catch (error) {
    console.error("❌ Error ensuring equipment tables:", error);
    throw error;
  }
}

// Run the function
ensureEquipmentTables()
  .then(() => {
    console.log("🎉 Equipment tables setup completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Equipment tables setup failed:", error);
    process.exit(1);
  });

