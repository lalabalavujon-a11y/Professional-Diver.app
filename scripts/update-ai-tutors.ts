import { db } from '../server/db.js';

async function updateAITutors() {
  console.log('🤖 Updating AI Tutors with new specializations...');

  // First clear the foreign key references from tracks
  await db.execute(`UPDATE tracks SET ai_tutor_id = NULL`);
  
  // Delete existing AI tutors
  await db.execute(`DELETE FROM ai_tutors`);

  // Insert the new AI tutors with first names and correct specializations
  await db.execute(`
    INSERT INTO ai_tutors (name, specialty, description) VALUES 
    ('Sarah', 'NDT', 'Sarah - a highly trained AI expert in the field of Non Destructive Testing Underwater Inspection ready for real time Tutoring and comprehensive technical guidance'),
    ('Mike', 'DMT', 'Mike - a highly trained AI expert in the field of Diver Medic emergency response and medical procedures ready for real time Tutoring and life-saving guidance'),
    ('Jennifer', 'ALST', 'Jennifer - a highly trained AI expert in the field of Assistant Life Support Technician systems and operations ready for real time Tutoring and technical support'),
    ('Robert', 'LST', 'Robert - a highly trained AI expert in the field of Life Support Technician advanced systems management ready for real time Tutoring and operational guidance'),
    ('David', 'Commercial Dive Supervisor Training', 'David - a highly trained AI expert in the field of Commercial Dive Supervisor Training and leadership development ready for real time Tutoring and management skills'),
    ('Lisa', 'SSED', 'Lisa - a highly trained AI expert in the field of Surface Supply Enclosed Diving (Air Diver Training) ready for real time Tutoring and safety protocols'),
    ('Amanda', 'SAT', 'Amanda - a highly trained AI expert in the field of Saturation Diver Training and deep-sea operations ready for real time Tutoring and advanced techniques')
  `);

  // Get the AI tutor IDs
  const aiTutorsResult = await db.execute(`SELECT id, specialty FROM ai_tutors`);
  const aiTutors = aiTutorsResult.rows;

  // Update tracks to assign appropriate AI tutors
  const tracksResult = await db.execute(`SELECT id, slug FROM tracks`);
  const tracks = tracksResult.rows;

  // Map tracks to AI tutors based on specialization
  for (const track of tracks) {
    let tutorSpecialization = '';
    
    switch (track.slug) {
      case 'inspection-ndt':
        tutorSpecialization = 'NDT';
        break;
      case 'diver-medic-technician':
        tutorSpecialization = 'DMT';
        break;
      case 'assistant-life-support-technician':
        tutorSpecialization = 'ALST';
        break;
      case 'life-support-technician':
        tutorSpecialization = 'LST';
        break;
      case 'commercial-dive-supervisor':
        tutorSpecialization = 'Commercial Dive Supervisor Training';
        break;
      case 'air-diver-certification':
        tutorSpecialization = 'SSED';
        break;
      case 'saturation-diver-training':
        tutorSpecialization = 'SAT';
        break;
    }

    const aiTutor = aiTutors.find(t => t.specialty === tutorSpecialization);
    if (aiTutor) {
      await db.execute(`UPDATE tracks SET ai_tutor_id = '${aiTutor.id}' WHERE id = '${track.id}'`);
      console.log(`✓ Assigned ${tutorSpecialization} tutor to ${track.slug}`);
    }
  }

  console.log('✅ AI Tutors updated successfully!');
}

updateAITutors().catch(console.error);