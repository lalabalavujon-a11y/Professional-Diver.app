import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

// Proper lesson content for each specific lesson
const properLessonContent: { [key: string]: { [key: string]: string } } = {
  'air-diver-certification': {
    'Communication Underwater': `# Communication Underwater

## AI Tutor: Lisa Thompson - Air Diving Specialist
*Expert in air diving operations, underwater communication, and safety protocols*

Welcome to Lesson 9 of Air Diver Certification! I'm Lisa Thompson, your AI tutor specializing in underwater communication. Effective communication is critical for diver safety and operational success.

## Learning Objectives
- Master underwater communication methods and signals
- Understand life-line signal protocols
- Learn hand signal systems for diving operations
- Develop clear communication procedures
- Practice emergency communication protocols

## Underwater Communication Methods

### Life-Line Signals
The life-line (umbilical) is the primary communication method for commercial diving operations.

#### Standard Life-Line Signals
- **1 Pull**: "Are you OK?" / "I'm OK"
- **2 Pulls**: "I'm going up" / "Give me slack"
- **3 Pulls**: "I'm going down" / "Take up slack"
- **4 Pulls**: "EMERGENCY - Pull me up immediately"
- **Continuous Pulling**: "EMERGENCY - Pull me up NOW"

#### Communication Signals
- **1 Pull, Pause, 1 Pull**: "Stop" / "Hold position"
- **2 Pulls, Pause, 2 Pulls**: "Move forward" / "Proceed"
- **3 Pulls, Pause, 3 Pulls**: "Move back" / "Return"
- **Rapid Pulls**: "Attention" / "Something wrong"

### Hand Signals
Hand signals are essential when divers are in visual contact.

#### Standard Hand Signals
- **Thumbs Up**: "Going up" / "OK"
- **Thumbs Down**: "Going down"
- **OK Sign**: "I'm OK" / "Everything fine"
- **Hand Across Throat**: "Out of air" / "Emergency"
- **Hand Waving**: "Attention" / "Help needed"
- **Pointing**: "Look at this" / "Direction"
- **Fist**: "Stop" / "Hold"

#### Work Signals
- **Pointing with Index Finger**: "This way" / "Direction"
- **Open Hand, Palm Down**: "Stop work"
- **Open Hand, Palm Up**: "Continue work"
- **Tapping Tool**: "Tool needed" / "Tool problem"

### Voice Communication
When using full-face masks or helmets with communication systems:

#### Communication Protocols
- **Clear Speech**: Speak clearly and slowly
- **Standard Terminology**: Use industry-standard terms
- **Confirmation**: Always confirm receipt of messages
- **Emergency Priority**: Emergency communications take priority

#### Standard Phrases
- "Diver to surface, do you copy?"
- "Surface to diver, go ahead"
- "Stand by" (wait)
- "Roger" (message received and understood)
- "Negative" (no / cannot comply)
- "Affirmative" (yes / will comply)

## Communication Equipment

### Life-Line Systems
- **Umbilical**: Contains air supply, communication wire, and safety line
- **Communication Wire**: Transmits voice signals
- **Safety Line**: Physical connection to surface
- **Tendon**: Separate safety line (backup)

### Voice Communication Systems
- **Hard-Wire Systems**: Direct connection via umbilical
- **Wireless Systems**: Acoustic or radio communication
- **Full-Face Masks**: Enable voice communication
- **Helmets**: Standard commercial diving communication

### Emergency Communication
- **Backup Signals**: Life-line signals when voice fails
- **Surface Signals**: Visual signals to surface support
- **Emergency Procedures**: Clear emergency communication protocols

## Communication Procedures

### Pre-Dive Communication Check
1. **Equipment Test**: Test communication equipment before dive
2. **Signal Review**: Review standard signals with tender
3. **Emergency Signals**: Confirm emergency signal procedures
4. **Backup Methods**: Establish backup communication methods

### During Dive Communication
1. **Regular Check-Ins**: Periodic communication with surface
2. **Status Updates**: Report position and status regularly
3. **Work Progress**: Communicate work progress
4. **Problem Reporting**: Immediately report any problems

### Emergency Communication
1. **Signal First**: Use life-line signals for immediate attention
2. **Voice Follow-Up**: Provide details via voice if possible
3. **Surface Response**: Surface must acknowledge all emergency signals
4. **Clear Instructions**: Follow surface instructions precisely

## Practice Scenarios

### Scenario 1: Communication Failure
Your voice communication fails during a dive. How do you communicate with the surface?

**AI Tutor Guidance**:
1. Immediately use life-line signals (4 pulls for emergency)
2. Surface will respond with life-line signals
3. Use hand signals if tender is visible
4. Follow emergency ascent procedures if needed

### Scenario 2: Tool Problem
You need a different tool underwater. How do you communicate this?

**AI Tutor Guidance**:
1. Use hand signal for "tool needed"
2. Describe tool via voice communication
3. Surface will send tool down on tool line
4. Confirm receipt of correct tool

## Assessment Questions

### Question 1
What is the standard emergency signal on a life-line?
- A) 1 pull
- B) 2 pulls
- C) 3 pulls
- D) 4 pulls

**Correct Answer**: D) 4 pulls

### Question 2
What does the "OK" hand signal mean underwater?
- A) Going up
- B) I'm OK / Everything fine
- C) Emergency
- D) Stop

**Correct Answer**: B) I'm OK / Everything fine

### Question 3
What should you do if voice communication fails?
- A) Continue working
- B) Use life-line signals
- C) Surface immediately
- D) Wait for communication to restore

**Correct Answer**: B) Use life-line signals

## Professional Standards
- Always test communication equipment before diving
- Use standard signals consistently
- Confirm receipt of all messages
- Report communication problems immediately
- Practice communication procedures regularly

## Next Steps
In the next lesson, we'll explore problem-solving drills and troubleshooting techniques for air diving operations.

Remember: Clear communication saves lives. Master these signals and procedures - they could save your life or a teammate's life.`
  }
};

async function fixLessonAlignment() {
  console.log('🔧 Fixing lesson alignment across all tracks...\n');

  try {
    const allTracks = await db.select({
      id: tracks.id,
      slug: tracks.slug,
      title: tracks.title,
    }).from(tracks).where(eq(tracks.isPublished, true));

    for (const track of allTracks) {
      console.log(`📚 Processing track: ${track.title} (${track.slug})`);
      
      const trackLessons = await db.select().from(lessons).where(eq(lessons.trackId, track.id)).orderBy(lessons.order);
      
      // Fix specific lessons that have wrong content
      for (const lesson of trackLessons) {
        const trackContent = properLessonContent[track.slug];
        if (trackContent && trackContent[lesson.title]) {
          await db.update(lessons)
            .set({ content: trackContent[lesson.title] })
            .where(eq(lessons.id, lesson.id));
          console.log(`   ✅ Fixed content for: ${lesson.title}`);
        }
      }
    }

    console.log('\n✅ Lesson alignment fixed!');
  } catch (error) {
    console.error('❌ Error fixing alignment:', error);
    throw error;
  }
}

fixLessonAlignment()
  .then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });





