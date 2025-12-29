import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema.js';

async function simpleSeed() {
  console.log('🌱 Creating diving tracks...');

  try {
    // Clear existing data
    await db.delete(questions);
    await db.delete(quizzes);
    await db.delete(lessons);
    await db.delete(tracks);

    // Create tracks without ai_tutor_id
    const dmtTrack = await db.insert(tracks).values({
      title: "Diver Medic Technician (DMT)",
      slug: "diver-medic-technician",
      summary: "Advanced medical training for commercial diving operations",
      difficulty: "advanced",
      isPublished: true,
    }).returning();

    const alstTrack = await db.insert(tracks).values({
      title: "Air Diving Life Support Technician (ALST)",
      slug: "air-diving-life-support-technician", 
      summary: "Life support systems and air diving operations",
      difficulty: "intermediate",
      isPublished: true,
    }).returning();

    const lstTrack = await db.insert(tracks).values({
      title: "Life Support Technician (LST)",
      slug: "life-support-technician",
      summary: "Surface-supplied diving life support operations",
      difficulty: "intermediate", 
      isPublished: true,
    }).returning();

    const mixedGasTrack = await db.insert(tracks).values({
      title: "Mixed Gas Diving",
      slug: "mixed-gas-diving",
      summary: "Helium and mixed gas diving procedures",
      difficulty: "advanced",
      isPublished: true,
    }).returning();

    const saturateTrack = await db.insert(tracks).values({
      title: "Saturation Diving",
      slug: "saturation-diving", 
      summary: "Deep saturation diving operations and procedures",
      difficulty: "expert",
      isPublished: true,
    }).returning();

    const physioTrack = await db.insert(tracks).values({
      title: "Diving Physiology Basics",
      slug: "diving-physiology-basics",
      summary: "Understanding how the human body responds to underwater environments",
      difficulty: "beginner",
      isPublished: true,
    }).returning();

    // Create a basic lesson for physiology track
    const physiologyLesson = await db.insert(lessons).values({
      trackId: physioTrack[0].id,
      title: "Pressure and the Human Body",
      order: 1,
      content: `# Pressure and the Human Body

Understanding how pressure affects the human body underwater is fundamental to safe diving practices.

## Key Concepts

### Pressure Increases with Depth
- At sea level: 1 atmosphere (14.7 PSI)
- At 33 feet: 2 atmospheres 
- At 66 feet: 3 atmospheres
- At 99 feet: 4 atmospheres

### Effects on Gas-Filled Spaces
The human body contains several gas-filled spaces that are affected by pressure changes:

1. **Lungs** - The primary concern during breath-hold diving
2. **Middle ear** - Must be equalized during descent
3. **Sinuses** - Can cause pain if blocked
4. **Intestinal gas** - Can expand during ascent

### Physiological Responses
- Increased heart rate initially
- Peripheral vasoconstriction 
- Mammalian dive reflex activation
- Nitrogen absorption into body tissues

Understanding these fundamental principles is essential before progressing to more advanced topics.`,
    }).returning();

    console.log('✅ Tracks created successfully!');
    console.log(`Created ${await db.select().from(tracks).then(r => r.length)} tracks`);

  } catch (error) {
    console.error('❌ Error creating tracks:', error);
  }
}

simpleSeed().catch(console.error).finally(() => process.exit(0));