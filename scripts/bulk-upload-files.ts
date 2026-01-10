/**
 * Bulk Upload Files Script
 * 
 * This script allows bulk uploading of PDF reference guides and MP4A podcasts
 * from a local directory to lessons on the Professional Diver Training App Platform.
 * 
 * Features:
 * - Automatic filename-based lesson matching
 * - Interactive confirmation mode
 * - Direct file upload via API
 * - Progress tracking and error reporting
 * 
 * Usage:
 *   tsx scripts/bulk-upload-files.ts /path/to/files
 *   tsx scripts/bulk-upload-files.ts /path/to/files --auto-match
 *   tsx scripts/bulk-upload-files.ts /path/to/files --interactive
 *   tsx scripts/bulk-upload-files.ts /path/to/files --track-slug ndt-fundamentals
 * 
 * Filename Patterns Supported:
 *   1. lesson-{lessonId}_{type}.{ext}
 *   2. {track-slug}_{lesson-title-slug}_{type}.{ext}
 *   3. {lesson-title-slug}_{type}.{ext}
 */

import { readdir, stat, copyFile, mkdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';
import { db } from '../server/db.js';
import { lessons } from '../shared/schema-sqlite.js';
import { parseFilenameForLesson, findLessonByParsedFilename, getFileType } from '../server/utils/file-matcher.js';

interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: 'pdf' | 'podcast' | 'unknown';
}

interface FileMapping {
  file: FileInfo;
  parsed: ReturnType<typeof parseFilenameForLesson>;
  lesson: Awaited<ReturnType<typeof findLessonByParsedFilename>>;
  type: 'pdf' | 'podcast';
}

async function scanDirectory(dirPath: string): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanDirectory(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase().replace('.', '');
        const allowedExtensions = ['pdf', 'm4a', 'mp4a', 'mp3', 'wav', 'aac', 'ogg'];
        
        if (allowedExtensions.includes(ext)) {
          const stats = await stat(fullPath);
          const fileType = getFileType(entry.name);
          
          files.push({
            path: fullPath,
            name: entry.name,
            size: stats.size,
            type: fileType,
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }
  
  return files;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function uploadFileViaAPI(filePath: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Use direct file copy instead of API for CLI script
    // API upload requires running server and form-data handling which is complex
    return { success: false, error: 'API upload not implemented - using direct copy instead' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
}

async function copyFileToUploads(filePath: string, lessonId: string, type: 'pdf' | 'podcast'): Promise<string> {
  const uploadsDir = join(process.cwd(), 'uploads');
  
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }
  
  const ext = extname(filePath);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `lesson-${lessonId}_${type}-${uniqueSuffix}${ext}`;
  const destPath = join(uploadsDir, filename);
  
  await copyFile(filePath, destPath);
  
  return `/uploads/${filename}`;
}

async function updateLessonWithFile(lessonId: string, fileUrl: string, type: 'pdf' | 'podcast') {
  const { tempStorage } = await import('../server/temp-storage.js');
  
  const updateData: any = {};
  if (type === 'pdf') {
    updateData.pdfUrl = fileUrl;
  } else {
    updateData.podcastUrl = fileUrl;
  }
  
  await tempStorage.updateLesson(lessonId, updateData);
}

async function interactiveConfirm(mappings: FileMapping[]): Promise<FileMapping[]> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const question = (query: string): Promise<string> => {
    return new Promise(resolve => {
      rl.question(query, (answer) => {
        resolve(answer);
      });
    });
  };
  
  console.log('\n=== File to Lesson Mappings ===\n');
  
  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i];
    const lesson = mapping.lesson;
    
    if (lesson) {
      console.log(`${i + 1}. ${mapping.file.name}`);
      console.log(`   → Lesson: ${lesson.title}`);
      console.log(`   → Type: ${mapping.type.toUpperCase()}`);
      console.log(`   → Size: ${formatBytes(mapping.file.size)}\n`);
    }
  }
  
  console.log('\nUnmatched files:');
  const unmatched = mappings.filter(m => !m.lesson);
  for (let i = 0; i < unmatched.length; i++) {
    const mapping = unmatched[i];
    console.log(`${i + 1}. ${mapping.file.name} (could not match to lesson)`);
  }
  
  const answer = await question('\nProceed with upload? (yes/no): ');
  rl.close();
  
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    return mappings.filter(m => m.lesson !== null);
  } else {
    console.log('Upload cancelled.');
    process.exit(0);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: tsx scripts/bulk-upload-files.ts /path/to/files [--auto-match] [--interactive] [--track-slug <slug>]');
    process.exit(1);
  }
  
  const dirPath = args[0];
  const flags = {
    autoMatch: args.includes('--auto-match'),
    interactive: args.includes('--interactive'),
    trackSlug: args[args.indexOf('--track-slug') + 1] || null,
  };
  
  if (!existsSync(dirPath)) {
    console.error(`Error: Directory not found: ${dirPath}`);
    process.exit(1);
  }
  
  console.log(`Scanning directory: ${dirPath}`);
  const files = await scanDirectory(dirPath);
  
  if (files.length === 0) {
    console.log('No PDF or audio files found in the directory.');
    process.exit(0);
  }
  
  console.log(`Found ${files.length} file(s) to process.\n`);
  
  // Parse filenames and match to lessons
  const mappings: FileMapping[] = [];
  
  for (const file of files) {
    const parsed = parseFilenameForLesson(file.name);
    const lesson = await findLessonByParsedFilename(parsed);
    const type = getFileType(file.name);
    
    mappings.push({
      file,
      parsed,
      lesson,
      type: type === 'unknown' ? (parsed.type || 'podcast') : type,
    });
  }
  
  // Show preview
  console.log('\n=== File Matching Preview ===\n');
  
  const matched = mappings.filter(m => m.lesson);
  const unmatched = mappings.filter(m => !m.lesson);
  
  console.log(`Matched: ${matched.length} file(s)`);
  for (const mapping of matched) {
    console.log(`  ✓ ${mapping.file.name}`);
    console.log(`    → ${mapping.lesson!.title} (${mapping.type})`);
  }
  
  if (unmatched.length > 0) {
    console.log(`\nUnmatched: ${unmatched.length} file(s)`);
    for (const mapping of unmatched) {
      console.log(`  ✗ ${mapping.file.name}`);
      console.log(`    → Could not find matching lesson`);
      if (mapping.parsed.trackSlug || mapping.parsed.lessonTitle) {
        console.log(`    → Parsed: track="${mapping.parsed.trackSlug || 'none'}", lesson="${mapping.parsed.lessonTitle || 'none'}"`);
      }
    }
  }
  
  // Interactive confirmation if requested
  let filesToUpload = matched;
  if (flags.interactive) {
    filesToUpload = await interactiveConfirm(mappings);
  } else if (matched.length === 0) {
    console.log('\nNo files matched. Exiting.');
    process.exit(0);
  }
  
  // Upload files
  console.log(`\n=== Uploading ${filesToUpload.length} file(s) ===\n`);
  
  const results: Array<{ file: FileInfo; success: boolean; error?: string }> = [];
  
  for (let i = 0; i < filesToUpload.length; i++) {
    const mapping = filesToUpload[i];
    const lesson = mapping.lesson!;
    
    console.log(`[${i + 1}/${filesToUpload.length}] Uploading ${mapping.file.name}...`);
    
    try {
      let fileUrl: string;
      
      // Try API upload first, fallback to direct copy
      if (flags.autoMatch) {
        const apiResult = await uploadFileViaAPI(mapping.file.path);
        if (apiResult.success && apiResult.url) {
          fileUrl = apiResult.url;
        } else {
          // Fallback to direct copy
          fileUrl = await copyFileToUploads(mapping.file.path, lesson.id, mapping.type);
        }
      } else {
        // Direct copy
        fileUrl = await copyFileToUploads(mapping.file.path, lesson.id, mapping.type);
      }
      
      // Update lesson record
      await updateLessonWithFile(lesson.id, fileUrl, mapping.type);
      
      console.log(`  ✓ Successfully uploaded to ${lesson.title}`);
      results.push({ file: mapping.file, success: true });
    } catch (error: any) {
      console.error(`  ✗ Error: ${error.message}`);
      results.push({ file: mapping.file, success: false, error: error.message });
    }
  }
  
  // Summary
  console.log(`\n=== Upload Summary ===\n`);
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed files:');
    for (const result of results) {
      if (!result.success) {
        console.log(`  ✗ ${result.file.name}: ${result.error}`);
      }
    }
    process.exit(1);
  }
  
  console.log('\nAll files uploaded successfully!');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

