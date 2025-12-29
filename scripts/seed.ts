import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema.js';

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await db.delete(questions);
  await db.delete(quizzes);
  await db.delete(lessons);
  await db.delete(tracks);

  // Create diving education tracks
  const [physiologyTrack] = await db.insert(tracks).values({
    title: "Diving Physiology Basics",
    slug: "diving-physiology-basics",
    summary: "Understanding how the human body responds to underwater environments and pressure changes.",
    isPublished: true,
  }).returning();

  const [decompressionTrack] = await db.insert(tracks).values({
    title: "Decompression Theory",
    slug: "decompression-theory", 
    summary: "Advanced concepts in decompression modeling, nitrogen narcosis, and safe ascent procedures.",
    isPublished: true,
  }).returning();

  const [emergencyTrack] = await db.insert(tracks).values({
    title: "Emergency Procedures",
    slug: "emergency-procedures",
    summary: "Critical emergency response protocols for diving accidents and equipment failures.",
    isPublished: true,
  }).returning();

  // Create lessons for Diving Physiology Basics
  const [physiologyLesson1] = await db.insert(lessons).values({
    trackId: physiologyTrack.id,
    title: "Pressure and the Human Body",
    order: 1,
    content: `# Pressure and the Human Body

As divers descend underwater, they experience increasing ambient pressure. Understanding how this affects the human body is fundamental to safe diving practices.

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

Understanding these fundamental principles is essential before progressing to more advanced topics in diving physiology.`,
  }).returning();

  const [physiologyLesson2] = await db.insert(lessons).values({
    trackId: physiologyTrack.id,
    title: "Gas Laws in Diving",
    order: 2,
    content: `# Gas Laws in Diving

Several fundamental gas laws govern how gases behave underwater and directly impact diving safety.

## Boyle's Law
**P₁V₁ = P₂V₂** (at constant temperature)

As pressure increases with depth, gas volume decreases proportionally.

### Practical Applications:
- **Lung compression** during breath-hold diving
- **BCD and wetsuit compression** 
- **Air consumption** increases with depth
- **Barotrauma prevention** requires understanding pressure changes

## Henry's Law
The amount of gas dissolved in a liquid is proportional to the partial pressure of that gas.

### Diving Implications:
- **Nitrogen absorption** into body tissues
- **Decompression sickness** risk
- **Gas narcosis** effects at depth
- **Saturation diving** principles

## Dalton's Law
Total pressure of a gas mixture equals the sum of partial pressures of individual gases.

### Key Applications:
- **Oxygen toxicity** calculations
- **Nitrox** dive planning
- **Trimix** gas blending
- **Carbon dioxide** buildup risks

## Charles's Law
Gas volume is proportional to absolute temperature (at constant pressure).

### Diving Considerations:
- **Thermal effects** on gas spaces
- **Regulator** performance in cold water
- **Tank pressure** changes with temperature

Mastering these gas laws provides the foundation for understanding advanced diving procedures and safety protocols.`,
  }).returning();

  // Create lessons for Decompression Theory
  const [decompressionLesson1] = await db.insert(lessons).values({
    trackId: decompressionTrack.id,
    title: "Nitrogen Absorption and Elimination",
    order: 1,
    content: `# Nitrogen Absorption and Elimination

Understanding how nitrogen behaves in the human body during diving is crucial for safe decompression practices.

## Nitrogen Absorption Process

### On-Gassing Phase (Descent/Bottom Time)
When diving, the increased ambient pressure causes nitrogen to dissolve into body tissues following Henry's Law.

**Factors Affecting Absorption:**
- **Depth** - Greater pressure = faster absorption
- **Time** - Longer exposure = more nitrogen absorbed
- **Tissue type** - Different tissues absorb at different rates
- **Blood flow** - Better circulation = faster absorption

### Tissue Half-Times
Different body tissues have varying rates of nitrogen absorption and elimination:

- **Fast tissues** (1-5 minutes): Blood, brain, lungs
- **Medium tissues** (20-40 minutes): Muscle, organs  
- **Slow tissues** (60-240+ minutes): Joints, cartilage, bone

## Nitrogen Elimination Process

### Off-Gassing Phase (Ascent/Surface)
As ambient pressure decreases, dissolved nitrogen must be eliminated to prevent bubble formation.

**Elimination Methods:**
1. **Controlled ascent** - Gradual pressure reduction
2. **Safety stops** - Allow time for off-gassing
3. **Decompression stops** - Mandatory for deeper/longer dives
4. **Surface intervals** - Complete elimination between dives

### Bubble Formation Risk
When nitrogen elimination cannot keep pace with pressure reduction:
- Supersaturation occurs
- Nitrogen bubbles form in tissues
- Decompression sickness (DCS) may result

## Practical Applications
- **Dive computer algorithms** model tissue nitrogen levels
- **Repetitive dive** planning considers residual nitrogen
- **Flying after diving** requires complete nitrogen elimination
- **Emergency ascents** create high DCS risk

Understanding nitrogen kinetics allows divers to plan safe ascent profiles and avoid decompression illness.`,
  }).returning();

  // Create quiz for physiology lesson 1
  const [physiologyQuiz1] = await db.insert(quizzes).values({
    lessonId: physiologyLesson1.id,
    title: "Pressure Effects Quiz",
    timeLimit: 10,
  }).returning();

  // Create questions for the quiz
  await db.insert(questions).values([
    {
      quizId: physiologyQuiz1.id,
      prompt: "At what depth does a diver experience 3 atmospheres of pressure?",
      a: "33 feet",
      b: "66 feet", 
      c: "99 feet",
      d: "132 feet",
      answer: "b",
      order: 1,
    },
    {
      quizId: physiologyQuiz1.id,
      prompt: "Which gas-filled space in the human body is the primary concern during breath-hold diving?",
      a: "Middle ear",
      b: "Sinuses",
      c: "Lungs",
      d: "Intestinal gas",
      answer: "c", 
      order: 2,
    },
    {
      quizId: physiologyQuiz1.id,
      prompt: "What is the mammalian dive reflex?",
      a: "Increased heart rate underwater",
      b: "A physiological response that helps conserve oxygen",
      c: "The urge to surface quickly",
      d: "Nitrogen absorption into tissues",
      answer: "b",
      order: 3,
    },
  ]);

  // Create quiz for gas laws lesson
  const [physiologyQuiz2] = await db.insert(quizzes).values({
    lessonId: physiologyLesson2.id,
    title: "Gas Laws Quiz",
    timeLimit: 15,
  }).returning();

  await db.insert(questions).values([
    {
      quizId: physiologyQuiz2.id,
      prompt: "According to Boyle's Law, what happens to gas volume as pressure increases?",
      a: "Volume increases proportionally",
      b: "Volume decreases proportionally", 
      c: "Volume remains constant",
      d: "Volume doubles",
      answer: "b",
      order: 1,
    },
    {
      quizId: physiologyQuiz2.id,
      prompt: "Henry's Law explains which diving phenomenon?",
      a: "Gas compression in the lungs",
      b: "Nitrogen absorption into body tissues",
      c: "Oxygen toxicity at depth", 
      d: "Thermal effects on gas spaces",
      answer: "b",
      order: 2,
    },
    {
      quizId: physiologyQuiz2.id,
      prompt: "Dalton's Law is most relevant for calculating:",
      a: "Lung volume changes",
      b: "Decompression stops",
      c: "Partial pressure of gases in breathing mixtures",
      d: "Temperature effects on tank pressure",
      answer: "c",
      order: 3,
    },
  ]);

  // Create quiz for decompression lesson
  const [decompressionQuiz1] = await db.insert(quizzes).values({
    lessonId: decompressionLesson1.id,
    title: "Nitrogen Kinetics Quiz", 
    timeLimit: 12,
  }).returning();

  await db.insert(questions).values([
    {
      quizId: decompressionQuiz1.id,
      prompt: "Which tissues have the fastest nitrogen absorption rates?",
      a: "Joints and cartilage",
      b: "Muscle and organs",
      c: "Blood, brain, and lungs",
      d: "Bone and connective tissue", 
      answer: "c",
      order: 1,
    },
    {
      quizId: decompressionQuiz1.id,
      prompt: "What causes decompression sickness?",
      a: "Too much oxygen in the blood",
      b: "Nitrogen bubble formation in tissues",
      c: "Rapid temperature changes",
      d: "Equipment malfunction",
      answer: "b",
      order: 2,
    },
    {
      quizId: decompressionQuiz1.id,
      prompt: "During the off-gassing phase, nitrogen elimination occurs primarily through:",
      a: "Sweating",
      b: "Urination", 
      c: "Breathing",
      d: "Skin absorption",
      answer: "c",
      order: 3,
    },
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${await db.select().from(tracks).then(r => r.length)} tracks`);
  console.log(`Created ${await db.select().from(lessons).then(r => r.length)} lessons`);
  console.log(`Created ${await db.select().from(quizzes).then(r => r.length)} quizzes`);
  console.log(`Created ${await db.select().from(questions).then(r => r.length)} questions`);
}

seed().catch(console.error).finally(() => process.exit(0));