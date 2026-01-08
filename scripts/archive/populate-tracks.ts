import { db } from "../server/db";
import { tracks, aiTutors } from "../shared/schema-sqlite";

async function populateTracks() {
  console.log('🚀 Populating tracks table with all 8 professional diving subjects...');

  try {
    // Clear existing tracks
    await db.delete(tracks);
    console.log('✅ Cleared existing tracks');

    // Create AI Tutors for each track
    const tutors = await db.insert(aiTutors).values([
      {
        name: "Dr. Sarah Chen",
        specialty: "NDT Inspection Specialist",
        description: "Expert in underwater non-destructive testing and quality assurance"
      },
      {
        name: "Dr. Michael Rodriguez", 
        specialty: "Emergency Medicine Specialist",
        description: "Diving medical officer with emergency response expertise"
      },
      {
        name: "Captain James Mitchell",
        specialty: "Dive Operations Management",
        description: "Commercial dive supervisor with 20+ years experience"
      },
      {
        name: "Chief Engineer Lisa Wang",
        specialty: "Saturation Diving Systems",
        description: "Expert in life support systems and saturation operations"
      },
      {
        name: "Master Welder Carlos Mendez",
        specialty: "Underwater Welding",
        description: "Professional underwater welding and marine construction"
      },
      {
        name: "Dr. Emma Thompson",
        specialty: "Hyperbaric Medicine",
        description: "Hyperbaric chamber operations and decompression therapy"
      },
      {
        name: "Senior Technician Alex Johnson",
        specialty: "Life Support Systems",
        description: "Advanced life support operations and emergency protocols"
      },
      {
        name: "Technician Maria Santos",
        specialty: "Life Support Operations",
        description: "Life support system operations and gas management"
      }
    ]).returning();

    console.log('✅ Created AI tutors');

    // Create all 8 professional diving tracks
    const tracksData = [
      {
        title: "NDT Inspection & Testing",
        slug: "ndt-inspection",
        summary: "Master visual inspection, magnetic particle testing, and ultrasonic testing for professional certification.",
        aiTutorId: tutors[0].id,
        difficulty: "advanced",
        estimatedHours: 40,
        isPublished: true
      },
      {
        title: "Diver Medic Technician (DMT)",
        slug: "diver-medic", 
        summary: "Emergency medical response, ABCDE assessment, and diving injury treatment certification.",
        aiTutorId: tutors[1].id,
        difficulty: "expert",
        estimatedHours: 60,
        isPublished: true
      },
      {
        title: "Commercial Dive Supervisor",
        slug: "commercial-supervisor",
        summary: "Dive operations management, safety protocols, and emergency response leadership.",
        aiTutorId: tutors[2].id,
        difficulty: "expert", 
        estimatedHours: 50,
        isPublished: true
      },
      {
        title: "Saturation Diving Systems",
        slug: "saturation-diving",
        summary: "Saturation diving operations, life support systems, and decompression management.",
        aiTutorId: tutors[3].id,
        difficulty: "expert",
        estimatedHours: 80,
        isPublished: true
      },
      {
        title: "Advanced Underwater Welding",
        slug: "underwater-welding",
        summary: "Professional underwater welding techniques, electrode selection, and quality control.",
        aiTutorId: tutors[4].id,
        difficulty: "advanced",
        estimatedHours: 60,
        isPublished: true
      },
      {
        title: "Hyperbaric Chamber Operations",
        slug: "hyperbaric-operations",
        summary: "Hyperbaric treatment protocols, emergency procedures, and patient monitoring.",
        aiTutorId: tutors[5].id,
        difficulty: "intermediate",
        estimatedHours: 30,
        isPublished: true
      },
      {
        title: "Advanced Life Support Technician (ALST)",
        slug: "alst",
        summary: "Advanced life support operations, emergency decompression protocols, and saturation diving medical procedures.",
        aiTutorId: tutors[6].id,
        difficulty: "expert",
        estimatedHours: 70,
        isPublished: true
      },
      {
        title: "Life Support Technician (LST)",
        slug: "lst",
        summary: "Life support system operations, gas management, and emergency response procedures.",
        aiTutorId: tutors[7].id,
        difficulty: "advanced",
        estimatedHours: 50,
        isPublished: true
      }
    ];

    const createdTracks = await db.insert(tracks).values(tracksData).returning();
    console.log('✅ Created all 8 professional diving tracks:');
    
    createdTracks.forEach((track, index) => {
      console.log(`   ${index + 1}. ${track.title} (${track.slug})`);
    });

    console.log('');
    console.log('🎯 Study Materials page should now display all tracks from database!');
    console.log('📚 Access Study Materials at: http://127.0.0.1:3001/tracks');

  } catch (error) {
    console.error('❌ Error populating tracks:', error);
    throw error;
  }
}

// Run the script
populateTracks()
  .then(() => {
    console.log('✅ Tracks population completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Tracks population failed:', error);
    process.exit(1);
  });
