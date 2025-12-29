/**
 * Generate expanded exam questions to match advertised counts
 * This script expands questions from 5 to full counts for each exam
 */

const fs = require('fs');
const path = require('path');

// Read current exam questions
const currentFile = path.join(__dirname, '../content/exam-questions.js');
const currentContent = fs.readFileSync(currentFile, 'utf8');

// Extract current questions using regex (safer than eval)
const ndtMatch = currentContent.match(/ndt:\s*\[([\s\S]*?)\],/);
const dmtMatch = currentContent.match(/dmt:\s*\[([\s\S]*?)\],/);
const cdsMatch = currentContent.match(/"commercial-supervisor":\s*\[([\s\S]*?)\],/);
const alstMatch = currentContent.match(/alst:\s*\[([\s\S]*?)\],/);
const lstMatch = currentContent.match(/lst:\s*\[([\s\S]*?)\],/);

console.log('Current question counts:');
console.log(`  NDT: ${(ndtMatch[1].match(/\{/g) || []).length} questions`);
console.log(`  DMT: ${(dmtMatch[1].match(/\{/g) || []).length} questions`);
console.log(`  Commercial Supervisor: ${(cdsMatch[1].match(/\{/g) || []).length} questions`);
console.log(`  ALST: ${(alstMatch[1].match(/\{/g) || []).length} questions`);
console.log(`  LST: ${(lstMatch[1].match(/\{/g) || []).length} questions`);

console.log('\nTarget counts:');
console.log('  NDT: 75 questions');
console.log('  DMT: 65 questions');
console.log('  Commercial Supervisor: 80 questions');
console.log('  ALST: 70 questions');
console.log('  LST: 60 questions');

