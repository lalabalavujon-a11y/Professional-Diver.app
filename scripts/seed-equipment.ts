import { db } from "../server/db";
import { equipmentTypes, equipmentItems } from "@shared/schema-sqlite";

/**
 * Seed script to populate commercial dive equipment inventory
 * Creates 2 complete sets of commercial dive equipment that normal commercial dive teams use
 */
async function seedEquipment() {
  console.log("🌊 Seeding commercial dive equipment inventory...");

  try {
    // Check if tables exist - if not, provide helpful error message
    let existingTypes;
    try {
      existingTypes = await db.select().from(equipmentTypes);
    } catch (error: any) {
      if (error.code === 'SQLITE_ERROR' && error.message.includes('no such table')) {
        console.error("\n❌ Equipment tables do not exist yet!");
        console.error("   The tables are created automatically when the server starts.");
        console.error("   Please start the server once with 'npm run dev:api' (or 'npm run dev:all'),");
        console.error("   then stop it and run this seed script again.");
        console.error("   Alternatively, ensure the database schema has been pushed with 'npm run db:push'");
        process.exit(1);
      }
      throw error;
    }

    const typeMap = new Map(existingTypes.map((t) => [t.name.toLowerCase(), t]));

    // Define equipment types for commercial diving
    const typeDefinitions = [
      { name: "Dive Helmet", description: "Surface-supplied diving helmets" },
      { name: "Dry Suit", description: "Commercial diving dry suits" },
      { name: "Hot Water System", description: "Hot water supply systems for diving" },
      { name: "Umbilical", description: "Diving umbilicals for gas, communications, and hot water" },
      { name: "Diving Cylinder", description: "High-pressure diving cylinders" },
      { name: "Weight System", description: "Diving weight systems and belts" },
      { name: "Dive Computer", description: "Dive computers and depth gauges" },
      { name: "Dive Knife", description: "Commercial diving knives" },
      { name: "Bailout Cylinder", description: "Emergency bailout cylinders" },
      { name: "Communications System", description: "Underwater communications equipment" },
      { name: "Tool Bag", description: "Commercial diving tool bags" },
      { name: "Safety Harness", description: "Diving safety harnesses and rigging" },
    ];

    const createdTypes: Record<string, string> = {};

    for (const typeDef of typeDefinitions) {
      const key = typeDef.name.toLowerCase();
      if (!typeMap.has(key)) {
        const [type] = await db
          .insert(equipmentTypes)
          .values({
            name: typeDef.name,
            description: typeDef.description,
          })
          .returning();
        createdTypes[typeDef.name] = type.id;
        console.log(`  ✓ Created equipment type: ${typeDef.name}`);
      } else {
        createdTypes[typeDef.name] = typeMap.get(key)!.id;
      }
    }

    // Check if equipment items already exist
    const existingItems = await db.select().from(equipmentItems);
    if (existingItems.length > 0) {
      console.log(`  ⚠️  Equipment items already exist (${existingItems.length} items). Skipping seed.`);
      console.log("  💡 To reseed, delete existing equipment items first.");
      return;
    }

    // Helper function to get type ID
    const getTypeId = (name: string) => {
      return createdTypes[name] || existingTypes.find((t) => t.name === name)?.id;
    };

    // Commercial Dive Team Equipment Set 1
    const team1Equipment = [
      {
        name: "Kirby Morgan KM-37 Helmet",
        equipmentType: "Dive Helmet",
        serialNumber: "KM37-2024-001",
        manufacturer: "Kirby Morgan",
        model: "KM-37",
        purchaseDate: new Date("2024-01-15"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker A",
        notes: "Primary surface-supplied helmet for Team 1",
      },
      {
        name: "Viking Dry Suit - Large",
        equipmentType: "Dry Suit",
        serialNumber: "VDS-L-2023-045",
        manufacturer: "Viking",
        model: "Pro Commercial",
        purchaseDate: new Date("2023-11-20"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker A",
        notes: "Commercial dry suit for cold water operations",
      },
      {
        name: "Hot Water System HWS-500",
        equipmentType: "Hot Water System",
        serialNumber: "HWS-500-2024-012",
        manufacturer: "Divex",
        model: "HWS-500",
        purchaseDate: new Date("2024-02-10"),
        status: "OPERATIONAL" as const,
        location: "Surface Support",
        notes: "500L/hour hot water system",
      },
      {
        name: "Umbilical Set - 60m",
        equipmentType: "Umbilical",
        serialNumber: "UMB-60-2024-001",
        manufacturer: "Divex",
        model: "Commercial Umbilical 60m",
        purchaseDate: new Date("2024-01-15"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker A",
        notes: "60-meter umbilical for Team 1 primary diver",
      },
      {
        name: "HP Cylinder 232 bar - 12L",
        equipmentType: "Diving Cylinder",
        serialNumber: "HP232-12L-2023-078",
        manufacturer: "Luxfer",
        model: "HP232-12",
        purchaseDate: new Date("2023-09-15"),
        status: "OPERATIONAL" as const,
        location: "Gas Storage",
        notes: "High-pressure primary cylinder",
      },
      {
        name: "Weight Belt - 20kg",
        equipmentType: "Weight System",
        serialNumber: "WB-20KG-2024-003",
        manufacturer: "OMS",
        model: "Commercial Weight Belt",
        purchaseDate: new Date("2024-01-20"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker A",
        notes: "20kg weight system for Team 1",
      },
      {
        name: "Shearwater Petrel 3",
        equipmentType: "Dive Computer",
        serialNumber: "SW-P3-2024-015",
        manufacturer: "Shearwater Research",
        model: "Petrel 3",
        purchaseDate: new Date("2024-03-01"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker A",
        notes: "Primary dive computer for Team 1",
      },
      {
        name: "Commercial Dive Knife",
        equipmentType: "Dive Knife",
        serialNumber: "DK-COM-2024-007",
        manufacturer: "Spyderco",
        model: "Atlantic Salt",
        purchaseDate: new Date("2024-01-25"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker A",
        notes: "Corrosion-resistant commercial dive knife",
      },
      {
        name: "Bailout Cylinder 232 bar - 7L",
        equipmentType: "Bailout Cylinder",
        serialNumber: "BO232-7L-2023-089",
        manufacturer: "Luxfer",
        model: "HP232-7",
        purchaseDate: new Date("2023-09-15"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker A",
        notes: "Emergency bailout for Team 1 primary diver",
      },
      {
        name: "OtoComm Communications System",
        equipmentType: "Communications System",
        serialNumber: "OTO-2024-004",
        manufacturer: "OtoComm",
        model: "Professional",
        purchaseDate: new Date("2024-01-15"),
        status: "OPERATIONAL" as const,
        location: "Surface Support",
        notes: "Surface-to-diver communications for Team 1",
      },
      {
        name: "Commercial Tool Bag",
        equipmentType: "Tool Bag",
        serialNumber: "TB-COM-2024-002",
        manufacturer: "OMS",
        model: "Commercial Tool Bag",
        purchaseDate: new Date("2024-01-30"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker A",
        notes: "Tool bag for Team 1 operations",
      },
      {
        name: "Safety Harness - Large",
        equipmentType: "Safety Harness",
        serialNumber: "SH-L-2024-001",
        manufacturer: "OMS",
        model: "Commercial Safety Harness",
        purchaseDate: new Date("2024-02-01"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker A",
        notes: "Safety harness for Team 1 diver",
      },
    ];

    // Commercial Dive Team Equipment Set 2
    const team2Equipment = [
      {
        name: "Kirby Morgan KM-37 Helmet",
        equipmentType: "Dive Helmet",
        serialNumber: "KM37-2024-002",
        manufacturer: "Kirby Morgan",
        model: "KM-37",
        purchaseDate: new Date("2024-01-15"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker B",
        notes: "Primary surface-supplied helmet for Team 2",
      },
      {
        name: "Viking Dry Suit - Medium",
        equipmentType: "Dry Suit",
        serialNumber: "VDS-M-2023-046",
        manufacturer: "Viking",
        model: "Pro Commercial",
        purchaseDate: new Date("2023-11-20"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker B",
        notes: "Commercial dry suit for cold water operations",
      },
      {
        name: "Hot Water System HWS-500",
        equipmentType: "Hot Water System",
        serialNumber: "HWS-500-2024-013",
        manufacturer: "Divex",
        model: "HWS-500",
        purchaseDate: new Date("2024-02-10"),
        status: "OPERATIONAL" as const,
        location: "Surface Support",
        notes: "500L/hour hot water system for Team 2",
      },
      {
        name: "Umbilical Set - 60m",
        equipmentType: "Umbilical",
        serialNumber: "UMB-60-2024-002",
        manufacturer: "Divex",
        model: "Commercial Umbilical 60m",
        purchaseDate: new Date("2024-01-15"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker B",
        notes: "60-meter umbilical for Team 2 primary diver",
      },
      {
        name: "HP Cylinder 232 bar - 12L",
        equipmentType: "Diving Cylinder",
        serialNumber: "HP232-12L-2023-079",
        manufacturer: "Luxfer",
        model: "HP232-12",
        purchaseDate: new Date("2023-09-15"),
        status: "OPERATIONAL" as const,
        location: "Gas Storage",
        notes: "High-pressure primary cylinder for Team 2",
      },
      {
        name: "Weight Belt - 18kg",
        equipmentType: "Weight System",
        serialNumber: "WB-18KG-2024-004",
        manufacturer: "OMS",
        model: "Commercial Weight Belt",
        purchaseDate: new Date("2024-01-20"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker B",
        notes: "18kg weight system for Team 2",
      },
      {
        name: "Shearwater Petrel 3",
        equipmentType: "Dive Computer",
        serialNumber: "SW-P3-2024-016",
        manufacturer: "Shearwater Research",
        model: "Petrel 3",
        purchaseDate: new Date("2024-03-01"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker B",
        notes: "Primary dive computer for Team 2",
      },
      {
        name: "Commercial Dive Knife",
        equipmentType: "Dive Knife",
        serialNumber: "DK-COM-2024-008",
        manufacturer: "Spyderco",
        model: "Atlantic Salt",
        purchaseDate: new Date("2024-01-25"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker B",
        notes: "Corrosion-resistant commercial dive knife",
      },
      {
        name: "Bailout Cylinder 232 bar - 7L",
        equipmentType: "Bailout Cylinder",
        serialNumber: "BO232-7L-2023-090",
        manufacturer: "Luxfer",
        model: "HP232-7",
        purchaseDate: new Date("2023-09-15"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker B",
        notes: "Emergency bailout for Team 2 primary diver",
      },
      {
        name: "OtoComm Communications System",
        equipmentType: "Communications System",
        serialNumber: "OTO-2024-005",
        manufacturer: "OtoComm",
        model: "Professional",
        purchaseDate: new Date("2024-01-15"),
        status: "OPERATIONAL" as const,
        location: "Surface Support",
        notes: "Surface-to-diver communications for Team 2",
      },
      {
        name: "Commercial Tool Bag",
        equipmentType: "Tool Bag",
        serialNumber: "TB-COM-2024-003",
        manufacturer: "OMS",
        model: "Commercial Tool Bag",
        purchaseDate: new Date("2024-01-30"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker B",
        notes: "Tool bag for Team 2 operations",
      },
      {
        name: "Safety Harness - Medium",
        equipmentType: "Safety Harness",
        serialNumber: "SH-M-2024-002",
        manufacturer: "OMS",
        model: "Commercial Safety Harness",
        purchaseDate: new Date("2024-02-01"),
        status: "OPERATIONAL" as const,
        location: "Dive Locker B",
        notes: "Safety harness for Team 2 diver",
      },
    ];

    // Insert all equipment items
    const allEquipment = [...team1Equipment, ...team2Equipment];
    let insertedCount = 0;

    for (const item of allEquipment) {
      const typeId = getTypeId(item.equipmentType);
      if (!typeId) {
        console.warn(`  ⚠️  Skipping ${item.name} - equipment type "${item.equipmentType}" not found`);
        continue;
      }

      await db.insert(equipmentItems).values({
        equipmentTypeId: typeId,
        name: item.name,
        serialNumber: item.serialNumber,
        manufacturer: item.manufacturer,
        model: item.model,
        purchaseDate: item.purchaseDate,
        status: item.status,
        location: item.location,
        notes: item.notes,
      });

      insertedCount++;
    }

    console.log(`\n✅ Successfully seeded ${insertedCount} equipment items (2 complete commercial dive teams)`);
    console.log(`   Team 1: ${team1Equipment.length} items (Dive Locker A)`);
    console.log(`   Team 2: ${team2Equipment.length} items (Dive Locker B)`);
  } catch (error) {
    console.error("❌ Error seeding equipment:", error);
    throw error;
  }
}

// Run the seed function
seedEquipment()
  .then(() => {
    console.log("\n🎉 Equipment seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Equipment seeding failed:", error);
    process.exit(1);
  });

