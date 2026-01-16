#!/usr/bin/env tsx
/**
 * Screenshot Organization Script
 * Organizes 529 screenshots from Pictures folder into logical development phases
 * with labels and documentation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

interface Screenshot {
  originalPath: string;
  filename: string;
  date: string;
  time: string;
  category?: string;
  description?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'images');
const PICTURES_DIR = path.join(os.homedir(), 'Pictures');

// Development phase categories with date ranges and descriptions
const DEVELOPMENT_PHASES = [
  {
    name: '01-initial-setup',
    label: 'Initial Setup & Project Bootstrap',
    dateRange: { start: '2025-09-29', end: '2025-10-15' },
    description: 'Project initialization, dependencies, configuration files, basic structure'
  },
  {
    name: '02-project-structure',
    label: 'Project Structure & Architecture',
    dateRange: { start: '2025-10-16', end: '2025-11-15' },
    description: 'Folder structure, component architecture, routing setup, state management'
  },
  {
    name: '03-database-design',
    label: 'Database Design & Schema',
    dateRange: { start: '2025-11-16', end: '2025-12-05' },
    description: 'Database schema design, migrations, seed data, data modeling'
  },
  {
    name: '04-authentication',
    label: 'Authentication & User Management',
    dateRange: { start: '2025-12-06', end: '2025-12-10' },
    description: 'User authentication, authorization, profile management, security'
  },
  {
    name: '05-user-interface',
    label: 'User Interface Development',
    dateRange: { start: '2025-12-11', end: '2025-12-20' },
    description: 'UI components, layouts, styling, responsive design, user experience'
  },
  {
    name: '06-content-management',
    label: 'Content Management System',
    dateRange: { start: '2025-12-21', end: '2025-12-27' },
    description: 'Lesson management, track creation, content editor, media uploads'
  },
  {
    name: '07-exam-system',
    label: 'Exam & Assessment System',
    dateRange: { start: '2025-12-28', end: '2026-01-02' },
    description: 'Exam creation, question management, grading, results tracking'
  },
  {
    name: '08-media-handling',
    label: 'Media Handling & Podcasts',
    dateRange: { start: '2026-01-03', end: '2026-01-05' },
    description: 'Podcast generation, audio processing, media library, file management'
  },
  {
    name: '09-voice-features',
    label: 'Voice Features & AI Integration',
    dateRange: { start: '2026-01-06', end: '2026-01-07' },
    description: 'Voice interaction, AI tutors, Gemini/OpenAI integration, real-time audio'
  },
  {
    name: '10-deployment',
    label: 'Deployment & Infrastructure',
    dateRange: { start: '2026-01-08', end: '2026-01-09' },
    description: 'CloudFlare setup, Railway deployment, domain configuration, CI/CD'
  },
  {
    name: '11-testing',
    label: 'Testing & Quality Assurance',
    dateRange: { start: '2026-01-10', end: '2026-01-11' },
    description: 'Unit tests, integration tests, manual testing, bug discovery'
  },
  {
    name: '12-bug-fixes',
    label: 'Bug Fixes & Critical Issues',
    dateRange: { start: '2026-01-12', end: '2026-01-13' },
    description: 'Bug fixes, error handling, performance optimization, security patches'
  },
  {
    name: '13-enhancements',
    label: 'Enhancements & New Features',
    dateRange: { start: '2026-01-14', end: '2026-01-15' },
    description: 'Feature additions, UI improvements, functionality enhancements'
  },
  {
    name: '14-documentation',
    label: 'Documentation & Guides',
    dateRange: { start: '2026-01-16', end: '2026-01-17' },
    description: 'API documentation, user guides, development notes, README files'
  },
  {
    name: '15-final-polish',
    label: 'Final Polish & Optimization',
    dateRange: { start: '2026-01-18', end: '2026-12-31' },
    description: 'Final touches, performance tuning, UI polish, production readiness'
  }
];

function parseScreenshotDate(filename: string): { date: string; time: string } | null {
  // Screen Shot 2025-10-02 at 14.12.20.png
  const match = filename.match(/Screen Shot (\d{4}-\d{2}-\d{2}) at (\d{2}\.\d{2}\.\d{2})/);
  if (match) {
    return { date: match[1], time: match[2] };
  }
  return null;
}

function categorizeScreenshot(screenshot: Screenshot): string {
  const date = screenshot.date;
  
  for (const phase of DEVELOPMENT_PHASES) {
    if (date >= phase.dateRange.start && date <= phase.dateRange.end) {
      return phase.name;
    }
  }
  
  // Default to final polish for anything outside defined ranges
  return '15-final-polish';
}

function getAllScreenshots(): Screenshot[] {
  try {
    const result = execSync(
      `find "${PICTURES_DIR}" -type f -iname "Screen Shot*" 2>/dev/null || true`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
    );
    
    const files = result.trim().split('\n').filter(Boolean);
    
    return files.map(file => {
      const filename = path.basename(file);
      const dateInfo = parseScreenshotDate(filename);
      
      return {
        originalPath: file,
        filename,
        date: dateInfo?.date || 'unknown',
        time: dateInfo?.time || 'unknown'
      };
    }).sort((a, b) => {
      // Sort by date then time
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  } catch (error) {
    console.error('Error finding screenshots:', error);
    return [];
  }
}

function createOrganizationStructure() {
  // Ensure all category directories exist
  for (const phase of DEVELOPMENT_PHASES) {
    const phaseDir = path.join(IMAGES_DIR, phase.name);
    if (!fs.existsSync(phaseDir)) {
      fs.mkdirSync(phaseDir, { recursive: true });
    }
  }
}

function generateDocumentation(screenshots: Screenshot[]): string {
  const categorized = new Map<string, Screenshot[]>();
  
  for (const screenshot of screenshots) {
    const category = categorizeScreenshot(screenshot);
    if (!categorized.has(category)) {
      categorized.set(category, []);
    }
    categorized.get(category)!.push(screenshot);
  }
  
  let doc = `# Professional Diver Training App - Screenshot Documentation\n\n`;
  doc += `**Total Screenshots:** ${screenshots.length}\n`;
  doc += `**Generated:** ${new Date().toISOString()}\n\n`;
  doc += `This document provides a comprehensive guide to all screenshots captured during the development of the Professional Diver Training App. Screenshots are organized by development phase and include labels describing their purpose.\n\n`;
  doc += `---\n\n`;
  
  for (const phase of DEVELOPMENT_PHASES) {
    const phaseScreenshots = categorized.get(phase.name) || [];
    
    doc += `## ${phase.label}\n\n`;
    doc += `**Category:** \`${phase.name}\`\n\n`;
    doc += `**Date Range:** ${phase.dateRange.start} to ${phase.dateRange.end}\n\n`;
    doc += `**Description:** ${phase.description}\n\n`;
    doc += `**Screenshots Count:** ${phaseScreenshots.length}\n\n`;
    
    if (phaseScreenshots.length > 0) {
      doc += `### Screenshot List\n\n`;
      doc += `| # | Date | Time | Filename | Status |\n`;
      doc += `|---|------|------|----------|--------|\n`;
      
      phaseScreenshots.forEach((screenshot, index) => {
        const num = index + 1;
        const relativePath = path.relative(PROJECT_ROOT, screenshot.originalPath);
        const status = '📋 To be reviewed';
        doc += `| ${num} | ${screenshot.date} | ${screenshot.time} | \`${screenshot.filename}\` | ${status} |\n`;
      });
      
      doc += `\n`;
    } else {
      doc += `*No screenshots found in this phase.*\n\n`;
    }
    
    doc += `---\n\n`;
  }
  
  // Add summary table
  doc += `## Summary by Phase\n\n`;
  doc += `| Phase | Label | Screenshots | Date Range |\n`;
  doc += `|-------|-------|-------------|------------|\n`;
  
  for (const phase of DEVELOPMENT_PHASES) {
    const count = categorized.get(phase.name)?.length || 0;
    doc += `| ${phase.name} | ${phase.label} | ${count} | ${phase.dateRange.start} to ${phase.dateRange.end} |\n`;
  }
  
  return doc;
}

function generateIndexFile(screenshots: Screenshot[]): string {
  let index = `# Screenshot Index - Quick Reference\n\n`;
  index += `**Total:** ${screenshots.length} screenshots\n\n`;
  index += `## Chronological List\n\n`;
  index += `| # | Date | Time | Category | Filename |\n`;
  index += `|---|------|------|----------|----------|\n`;
  
  screenshots.forEach((screenshot, idx) => {
    const category = categorizeScreenshot(screenshot);
    const phase = DEVELOPMENT_PHASES.find(p => p.name === category);
    const categoryLabel = phase ? phase.label : category;
    
    index += `| ${idx + 1} | ${screenshot.date} | ${screenshot.time} | ${categoryLabel} | \`${screenshot.filename}\` |\n`;
  });
  
  return index;
}

async function main() {
  console.log('🔍 Finding all screenshots...');
  const screenshots = getAllScreenshots();
  console.log(`✅ Found ${screenshots.length} screenshots`);
  
  console.log('📁 Creating organization structure...');
  createOrganizationStructure();
  console.log('✅ Structure created');
  
  console.log('📝 Generating documentation...');
  const documentation = generateDocumentation(screenshots);
  const docPath = path.join(IMAGES_DIR, 'SCREENSHOT_DOCUMENTATION.md');
  fs.writeFileSync(docPath, documentation);
  console.log(`✅ Documentation saved to: ${docPath}`);
  
  console.log('📋 Generating index file...');
  const indexContent = generateIndexFile(screenshots);
  const indexPath = path.join(IMAGES_DIR, 'SCREENSHOT_INDEX.md');
  fs.writeFileSync(indexPath, indexContent);
  console.log(`✅ Index saved to: ${indexPath}`);
  
  // Generate symlink script for easy access
  console.log('🔗 Creating organization script...');
  let symlinkScript = `#!/bin/bash
# Script to create symlinks organizing screenshots by category
# Run this from the project root: bash scripts/create-screenshot-symlinks.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PICTURES_DIR="$HOME/Pictures"
IMAGES_DIR="$PROJECT_ROOT/images"

echo "Creating symlinks for screenshots..."

`;
  
  for (const screenshot of screenshots) {
    const category = categorizeScreenshot(screenshot);
    const targetDir = path.join(IMAGES_DIR, category);
    const targetPath = path.join(targetDir, screenshot.filename);
    const sourcePath = screenshot.originalPath;
    
    symlinkScript += `mkdir -p "${targetDir}"\n`;
    symlinkScript += `ln -sf "${sourcePath}" "${targetPath}"\n`;
  }
  
  symlinkScript += `\necho "✅ Symlinks created!"\n`;
  symlinkScript += `echo "Screenshots are now organized in: $IMAGES_DIR"\n`;
  
  const symlinkPath = path.join(PROJECT_ROOT, 'scripts', 'create-screenshot-symlinks.sh');
  fs.writeFileSync(symlinkPath, symlinkScript);
  fs.chmodSync(symlinkPath, '755');
  console.log(`✅ Symlink script saved to: ${symlinkPath}`);
  
  console.log('\n✨ Organization complete!');
  console.log(`\n📚 Next steps:`);
  console.log(`1. Review ${docPath} to add specific labels to each screenshot`);
  console.log(`2. Run ${symlinkPath} to create organized symlinks (optional)`);
  console.log(`3. Use ${indexPath} as a quick reference`);
}

main().catch(console.error);
