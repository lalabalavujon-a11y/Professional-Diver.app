/* 
  Quick smoke test for AI Tutors.
  - Verifies first-name-only identity
  - Ensures chat fallback works without OpenAI/VectorStore
*/

import DivingTutorManager from '../server/ai-tutors';

async function run() {
  const manager = DivingTutorManager.getInstance();

  const disciplines = [
    'Underwater Welding',
    'NDT',
    'LST',
    'Assistant Life Support Technician',
    'DMT',
    'Commercial Dive Supervisor',
    'Saturation Diving',
    'Hyperbaric Operations',
    'Air Diver Certification',
  ];

  console.log('🚦 AI Tutor Smoke Test (no network dependencies expected)...\n');

  for (const discipline of disciplines) {
    try {
      const { response, tutor } = await manager.chatWithTutor(
        discipline,
        'Give me one key concept you specialize in, in one sentence.',
        `smoke-${Date.now()}`
      );

      // Basic assertions printed as PASS/FAIL lines
      const nameOk = tutor.name.split(' ').length === 1;
      const identity = `${tutor.name} — ${tutor.discipline}`;
      console.log(`• ${discipline}: ${identity}`);
      console.log(`  - Name format first-name-only: ${nameOk ? 'PASS' : 'FAIL'}`);
      console.log(`  - Sample reply: ${response.slice(0, 140)}${response.length > 140 ? '…' : ''}\n`);
    } catch (err) {
      console.error(`✖ ${discipline} failed:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log('✅ Smoke test completed');
}

run().catch(err => {
  console.error('Smoke test error:', err);
  process.exit(1);
});


