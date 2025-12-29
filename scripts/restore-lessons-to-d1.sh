#!/bin/bash

# Script to restore lessons to Cloudflare D1 production database
# This ensures lessons persist after deployments

echo "🔄 Restoring lessons to D1 production database..."
echo ""

# Generate SQL from backup
echo "📖 Reading backup file..."
node -e "
const fs = require('fs');
const path = require('path');

const backupFile = path.join(__dirname, '..', 'backups', 'tracks-lessons-latest.json');
const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

console.log('📊 Backup info:');
console.log('  Tracks:', backup.tracks.length);
console.log('  Total Lessons:', backup.tracks.reduce((s, t) => s + t.lessons.length, 0));
console.log('');

const now = Math.floor(Date.now() / 1000);
const sql = [];

// Generate INSERT statements for tracks
for (const track of backup.tracks) {
  const trackSQL = \`INSERT OR REPLACE INTO tracks (id, title, slug, summary, is_published, ai_tutor_id, created_at) VALUES ('\${track.id}', '\${track.title.replace(/'/g, \"''\")}', '\${track.slug}', \${track.summary ? \"'\" + track.summary.replace(/'/g, \"''\") + \"'\" : 'NULL'}, \${track.isPublished ? 1 : 0}, \${track.aiTutorId ? \"'\" + track.aiTutorId + \"'\" : 'NULL'}, \${now});\`;
  sql.push(trackSQL);
  
  // Generate INSERT statements for lessons
  for (const lesson of track.lessons) {
    const lessonCreatedAt = Math.floor(new Date(lesson.createdAt).getTime() / 1000);
    const lessonUpdatedAt = Math.floor(new Date(lesson.updatedAt).getTime() / 1000);
    const content = lesson.content.replace(/'/g, \"''\").replace(/\\n/g, '\\\\n').replace(/\\r/g, '\\\\r');
    const lessonSQL = \`INSERT OR REPLACE INTO lessons (id, track_id, title, \\\"order\\\", content, estimated_minutes, is_required, created_at, updated_at) VALUES ('\${lesson.id}', '\${lesson.trackId}', '\${lesson.title.replace(/'/g, \"''\")}', \${lesson.order}, '\${content}', \${lesson.estimatedMinutes || 60}, \${lesson.isRequired ? 1 : 0}, \${lessonCreatedAt}, \${lessonUpdatedAt});\`;
    sql.push(lessonSQL);
  }
}

// Write to SQL file
const sqlFile = path.join(__dirname, '..', 'restore-d1.sql');
fs.writeFileSync(sqlFile, sql.join('\\n\\n'), 'utf8');
console.log('✅ SQL generated and saved to:', sqlFile);
console.log('📝 Total statements:', sql.length);
"

echo ""
echo "🚀 Executing SQL on D1 production database..."
echo ""

# Execute SQL on D1
if [ -f "restore-d1.sql" ]; then
  wrangler d1 execute professionaldiver-db --file=./restore-d1.sql --env production
  echo ""
  echo "✅ Lessons restored to D1 production database!"
  echo ""
  echo "🧹 Cleaning up..."
  rm -f restore-d1.sql
  echo "✅ Done!"
else
  echo "❌ SQL file not found. Please check the script output above."
  exit 1
fi

