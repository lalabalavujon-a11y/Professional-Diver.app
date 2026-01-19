#!/usr/bin/env ts-node
/**
 * Organize GPT Knowledge Base Files for Upload
 * 
 * This script organizes exported knowledge base files into category folders
 * and creates upload guides, checklists, and manifests for OpenAI GPT upload.
 * 
 * Usage:
 *   tsx scripts/organize-gpt-uploads.ts
 */

import 'dotenv/config';
import { readdir, stat, readFile, writeFile, mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// File organization structure
const FILE_ORGANIZATION = {
  '01-foundation': [
    'air-diver-certification.md',
    'alst.md'
  ],
  '02-specialized': [
    'lst.md',
    'ndt-inspection.md',
    'diver-medic.md'
  ],
  '03-advanced': [
    'saturation-diving.md',
    'hyperbaric-operations.md',
    'underwater-welding.md',
    'commercial-supervisor.md'
  ],
  '04-supplementary': [
    'supplementary-kb-content.md'
  ]
};

// File metadata
const FILE_METADATA: Record<string, { title: string; description: string; uploadOrder: number }> = {
  'air-diver-certification.md': {
    title: 'Air Diver Certification',
    description: 'Foundation course for air diving skills, physics, and basic operations',
    uploadOrder: 1
  },
  'alst.md': {
    title: 'Assistant Life Support Technician (ALST)',
    description: 'Foundation life support systems and assistant operations',
    uploadOrder: 2
  },
  'lst.md': {
    title: 'Life Support Technician (LST)',
    description: 'Advanced life support systems for commercial diving operations',
    uploadOrder: 3
  },
  'ndt-inspection.md': {
    title: 'Inspection & Non-Destructive Testing (NDT)',
    description: 'Underwater inspection techniques, NDT methods, and documentation',
    uploadOrder: 4
  },
  'diver-medic.md': {
    title: 'Diver Medic Technician (DMT)',
    description: 'Emergency medical response, ABCDE protocols, and diving medicine',
    uploadOrder: 5
  },
  'saturation-diving.md': {
    title: 'Saturation Diver Training',
    description: 'Saturation diving systems, chamber operations, and deep-sea procedures',
    uploadOrder: 6
  },
  'hyperbaric-operations.md': {
    title: 'Hyperbaric Chamber Operations',
    description: 'Hyperbaric medicine, treatment protocols, and chamber management',
    uploadOrder: 7
  },
  'underwater-welding.md': {
    title: 'Advanced Underwater Welding',
    description: 'Underwater welding techniques, electrode selection, and quality control',
    uploadOrder: 8
  },
  'commercial-supervisor.md': {
    title: 'Commercial Dive Supervisor',
    description: 'Leadership, dive planning, risk assessment, and operations management',
    uploadOrder: 9
  },
  'supplementary-kb-content.md': {
    title: 'Supplementary Knowledge Base Content',
    description: 'CSWIP inspection protocols (3.1U/3.2U/3.4U) and DMT SAFE/ABCDE/ATOMFC protocols',
    uploadOrder: 10
  }
};

async function getFileSize(filePath: string): Promise<number> {
  const stats = await stat(filePath);
  return stats.size;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function main() {
  console.log('📁 Organizing GPT Knowledge Base files for upload...\n');

  const exportDir = path.join(process.cwd(), 'exports', 'gpt-knowledge-base');
  
  if (!existsSync(exportDir)) {
    console.error(`❌ Export directory not found: ${exportDir}`);
    console.error('   Please run export-gpt-knowledge-base.ts first');
    process.exit(1);
  }

  try {
    // Create category folders
    console.log('📂 Creating category folders...');
    for (const category of Object.keys(FILE_ORGANIZATION)) {
      const categoryPath = path.join(exportDir, category);
      if (!existsSync(categoryPath)) {
        await mkdir(categoryPath, { recursive: true });
        console.log(`   ✅ Created: ${category}/`);
      }
    }

    // Copy files to category folders
    console.log('\n📋 Organizing files into categories...');
    const manifest: ManifestItem[] = [];

    for (const [category, files] of Object.entries(FILE_ORGANIZATION)) {
      for (const fileName of files) {
        const sourcePath = path.join(exportDir, fileName);
        const destPath = path.join(exportDir, category, fileName);

        if (existsSync(sourcePath)) {
          await copyFile(sourcePath, destPath);
          const sizeBytes = await getFileSize(sourcePath);
          const sizeStr = formatFileSize(sizeBytes);
          const metadata = FILE_METADATA[fileName] || {
            title: fileName.replace('.md', ''),
            description: '',
            uploadOrder: 999
          };

          const manifestItem: ManifestItem = {
            category,
            fileName,
            filePath: `${category}/${fileName}`,
            size: sizeStr,
            sizeBytes,
            title: metadata.title,
            description: metadata.description,
            uploadOrder: metadata.uploadOrder
          };

          manifest.push(manifestItem);
          console.log(`   ✅ ${category}/${fileName} (${sizeStr})`);
        } else {
          console.warn(`   ⚠️  File not found: ${fileName}`);
        }
      }
    }

    // Sort manifest by upload order
    manifest.sort((a, b) => a.uploadOrder - b.uploadOrder);

    // Create upload manifest JSON
    console.log('\n📄 Creating upload manifest...');
    const manifestPath = path.join(exportDir, 'upload-manifest.json');
    await writeFile(manifestPath, JSON.stringify({
      exportDate: new Date().toISOString(),
      totalFiles: manifest.length,
      files: manifest,
      uploadSequence: manifest.map(f => ({
        order: f.uploadOrder,
        category: f.category,
        fileName: f.fileName,
        title: f.title
      }))
    }, null, 2), 'utf-8');
    console.log(`   ✅ Created: upload-manifest.json`);

    // Create upload guide
    console.log('\n📖 Creating upload guide...');
    const uploadGuide = await createUploadGuide(manifest);
    const guidePath = path.join(exportDir, 'UPLOAD_GUIDE.md');
    await writeFile(guidePath, uploadGuide, 'utf-8');
    console.log(`   ✅ Created: UPLOAD_GUIDE.md`);

    // Create upload checklist
    console.log('\n✅ Creating upload checklist...');
    const checklist = await createUploadChecklist(manifest);
    const checklistPath = path.join(exportDir, 'UPLOAD_CHECKLIST.md');
    await writeFile(checklistPath, checklist, 'utf-8');
    console.log(`   ✅ Created: UPLOAD_CHECKLIST.md`);

    // Summary
    console.log('\n✅ Organization complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Categories: ${Object.keys(FILE_ORGANIZATION).length}`);
    console.log(`   - Files organized: ${manifest.length}`);
    console.log(`   - Total size: ${await formatFileSize(manifest.reduce((sum, f) => sum + f.sizeBytes, 0))}`);
    console.log('\n📁 Organized structure:');
    for (const [category, files] of Object.entries(FILE_ORGANIZATION)) {
      console.log(`   ${category}/ (${files.length} files)`);
    }
    console.log('\n💡 Next Steps:');
    console.log('   1. Review UPLOAD_GUIDE.md for detailed upload instructions');
    console.log('   2. Use UPLOAD_CHECKLIST.md to track your upload progress');
    console.log('   3. Follow the upload sequence in upload-manifest.json');
    console.log('   4. Upload files category by category to OpenAI GPT');

  } catch (error) {
    console.error('❌ Organization error:', error);
    throw error;
  }
}

async function createUploadGuide(manifest: typeof FILE_METADATA extends Record<string, infer T> ? T[] : never[]): Promise<string> {
  return `# OpenAI GPT Knowledge Base Upload Guide

**Export Date:** ${new Date().toISOString()}
**Total Files:** ${manifest.length}

## Overview

This guide provides step-by-step instructions for uploading the Diver Well knowledge base files to your OpenAI GPT in an organized, structured manner.

## File Organization

Files have been organized into ${Object.keys(FILE_ORGANIZATION).length} categories:

### 01-Foundation (Upload First)
Foundation courses that build base knowledge:
${FILE_ORGANIZATION['01-foundation'].map(f => {
  const meta = FILE_METADATA[f];
  return `- **${meta?.title || f}** - \`01-foundation/${f}\` - ${meta?.description || ''}`;
}).join('\n')}

### 02-Specialized (Upload Second)
Specialized training tracks building on foundation:
${FILE_ORGANIZATION['02-specialized'].map(f => {
  const meta = FILE_METADATA[f];
  return `- **${meta?.title || f}** - \`02-specialized/${f}\` - ${meta?.description || ''}`;
}).join('\n')}

### 03-Advanced (Upload Third)
Advanced operations requiring prior knowledge:
${FILE_ORGANIZATION['03-advanced'].map(f => {
  const meta = FILE_METADATA[f];
  return `- **${meta?.title || f}** - \`03-advanced/${f}\` - ${meta?.description || ''}`;
}).join('\n')}

### 04-Supplementary (Upload Last)
Specialized protocols and supplementary content:
${FILE_ORGANIZATION['04-supplementary'].map(f => {
  const meta = FILE_METADATA[f];
  return `- **${meta?.title || f}** - \`04-supplementary/${f}\` - ${meta?.description || ''}`;
}).join('\n')}

## Upload Sequence

Follow this order for optimal knowledge base structure:

${manifest.map((f, i) => `${i + 1}. **${f.title}** (\`${f.filePath}\`) - ${f.size}`).join('\n')}

## Step-by-Step Upload Instructions

### Prerequisites
1. Access to OpenAI GPT configuration
2. Admin/editor permissions for your GPT
3. All files from the export directory

### Upload Process

#### Step 1: Access GPT Configuration
1. Navigate to your Diver Well GPT in OpenAI
2. Click "Edit" or "Configure" to access settings
3. Navigate to the "Knowledge" or "Knowledge Base" section

#### Step 2: Upload Foundation Files (Category 01)
1. Upload files from \`01-foundation/\` folder first
2. Upload in this order:
   ${FILE_ORGANIZATION['01-foundation'].map((f, i) => `${i + 1}. ${FILE_METADATA[f]?.title || f}`).join('\n   ')}
3. Wait for each file to process completely
4. Verify uploads appear in your knowledge base list

#### Step 3: Upload Specialized Files (Category 02)
1. Upload files from \`02-specialized/\` folder
2. Upload in this order:
   ${FILE_ORGANIZATION['02-specialized'].map((f, i) => `${i + 1}. ${FILE_METADATA[f]?.title || f}`).join('\n   ')}
3. Verify each upload completes successfully

#### Step 4: Upload Advanced Files (Category 03)
1. Upload files from \`03-advanced/\` folder
2. Upload in this order:
   ${FILE_ORGANIZATION['03-advanced'].map((f, i) => `${i + 1}. ${FILE_METADATA[f]?.title || f}`).join('\n   ')}
3. Verify all advanced content is accessible

#### Step 5: Upload Supplementary Content (Category 04)
1. Upload files from \`04-supplementary/\` folder
2. This includes CSWIP protocols and DMT emergency procedures
3. Verify specialized protocols are searchable

### Verification Steps

After each category upload:

1. **Test Search Functionality**
   - Ask GPT a question specific to that category
   - Verify it can find and reference the uploaded content
   - Check that responses are accurate and detailed

2. **Verify File Processing**
   - Check that all files show as "Processed" or "Ready"
   - Ensure no files are stuck in "Processing" state
   - Verify file sizes match expected values

3. **Test Cross-References**
   - Ask questions that span multiple categories
   - Verify GPT can connect related concepts
   - Check that foundational knowledge supports advanced topics

### Best Practices

1. **Upload in Batches**
   - Upload one category at a time
   - Wait for processing to complete before next category
   - Test after each category upload

2. **Monitor File Sizes**
   - OpenAI GPT has file size limits (typically 512MB per file)
   - Our files range from ${Math.min(...manifest.map(f => f.sizeBytes))} bytes to ${Math.max(...manifest.map(f => f.sizeBytes))} bytes
   - All files are well within limits

3. **Test Incrementally**
   - Test knowledge base after each category
   - Verify content is searchable and accurate
   - Document any issues immediately

4. **Maintain Order**
   - Follow the upload sequence strictly
   - Foundation files must be uploaded first
   - Advanced files depend on foundation knowledge

### Troubleshooting

#### File Won't Upload
- Check file size (must be under 512MB)
- Verify file format (must be .md, .txt, .pdf, etc.)
- Check file permissions
- Try uploading one file at a time

#### Content Not Searchable
- Wait for processing to complete (can take several minutes)
- Verify file was uploaded successfully
- Check file format and encoding
- Try re-uploading if issues persist

#### Inaccurate Responses
- Verify all files in a category are uploaded
- Check that upload order was followed
- Test with specific questions from uploaded content
- Consider re-uploading if content seems incomplete

### Post-Upload Verification

After all files are uploaded:

1. **Comprehensive Testing**
   - Test questions from each category
   - Verify cross-category knowledge connections
   - Check that supplementary protocols are accessible

2. **Content Verification**
   - Ask about CSWIP 3.1U/3.2U/3.4U protocols
   - Test DMT SAFE/ABCDE/ATOMFC protocols
   - Verify all track content is searchable

3. **Performance Check**
   - Test response accuracy
   - Verify response speed
   - Check for any missing content

## File Reference

### Complete File List

${manifest.map(f => `- **${f.title}** - \`${f.filePath}\` (${f.size})`).join('\n')}

### File Sizes Summary

- **Smallest:** ${manifest.reduce((min, f) => f.sizeBytes < min.sizeBytes ? f : min, manifest[0]).fileName} (${manifest.reduce((min, f) => f.sizeBytes < min.sizeBytes ? f : min, manifest[0]).size})
- **Largest:** ${manifest.reduce((max, f) => f.sizeBytes > max.sizeBytes ? f : max, manifest[0]).fileName} (${manifest.reduce((max, f) => f.sizeBytes > max.sizeBytes ? f : max, manifest[0]).size})
- **Total:** ${formatFileSize(manifest.reduce((sum, f) => sum + f.sizeBytes, 0))}

## Support

If you encounter issues during upload:
1. Check OpenAI GPT documentation
2. Verify file formats and sizes
3. Review upload logs/errors
4. Contact OpenAI support if needed

---

**Last Updated:** ${new Date().toISOString()}
`;
}

async function createUploadChecklist(manifest: ManifestItem[]): Promise<string> {
  const categories = Object.keys(FILE_ORGANIZATION);
  
  let checklist = `# OpenAI GPT Knowledge Base Upload Checklist

**Export Date:** ${new Date().toISOString()}
**Total Files:** ${manifest.length}

Use this checklist to track your upload progress. Check off each item as you complete it.

## Pre-Upload Preparation

- [ ] Review UPLOAD_GUIDE.md for detailed instructions
- [ ] Verify all files exist in organized folders
- [ ] Check file sizes are within OpenAI limits
- [ ] Ensure you have GPT configuration access
- [ ] Backup current GPT knowledge base (if any)

## Category 01: Foundation Files

${FILE_ORGANIZATION['01-foundation'].map(f => {
  const meta = FILE_METADATA[f];
  return `- [ ] Upload: **${meta?.title || f}** (\`01-foundation/${f}\`)`;
}).join('\n')}

**Verification:**
- [ ] All foundation files uploaded successfully
- [ ] Files show as "Processed" in GPT
- [ ] Test search: "What is air diver certification?"
- [ ] Test search: "What does an ALST do?"

## Category 02: Specialized Files

${FILE_ORGANIZATION['02-specialized'].map(f => {
  const meta = FILE_METADATA[f];
  return `- [ ] Upload: **${meta?.title || f}** (\`02-specialized/${f}\`)`;
}).join('\n')}

**Verification:**
- [ ] All specialized files uploaded successfully
- [ ] Files show as "Processed" in GPT
- [ ] Test search: "What is NDT inspection?"
- [ ] Test search: "What is the ABCDE protocol?"
- [ ] Test search: "What does an LST do?"

## Category 03: Advanced Files

${FILE_ORGANIZATION['03-advanced'].map(f => {
  const meta = FILE_METADATA[f];
  return `- [ ] Upload: **${meta?.title || f}** (\`03-advanced/${f}\`)`;
}).join('\n')}

**Verification:**
- [ ] All advanced files uploaded successfully
- [ ] Files show as "Processed" in GPT
- [ ] Test search: "What is saturation diving?"
- [ ] Test search: "How does hyperbaric treatment work?"
- [ ] Test search: "What are commercial dive supervisor responsibilities?"

## Category 04: Supplementary Content

${FILE_ORGANIZATION['04-supplementary'].map(f => {
  const meta = FILE_METADATA[f];
  return `- [ ] Upload: **${meta?.title || f}** (\`04-supplementary/${f}\`)`;
}).join('\n')}

**Verification:**
- [ ] Supplementary content uploaded successfully
- [ ] File shows as "Processed" in GPT
- [ ] Test search: "What is CSWIP 3.1U?"
- [ ] Test search: "What is the A-LODER format?"
- [ ] Test search: "What is the DMT SAFE protocol?"
- [ ] Test search: "What is ATOMF protocol?"

## Final Verification

### Content Testing
- [ ] Test question from each category
- [ ] Verify cross-category knowledge connections
- [ ] Test CSWIP protocols (3.1U, 3.2U, 3.4U)
- [ ] Test DMT protocols (SAFE, ABCDE, ATOMF)
- [ ] Verify all track content is accessible

### Performance Testing
- [ ] Response accuracy is high
- [ ] Response speed is acceptable
- [ ] No missing content detected
- [ ] All file references work correctly

### Documentation
- [ ] Document any upload issues encountered
- [ ] Note any files that required re-upload
- [ ] Record upload completion date/time
- [ ] Save this completed checklist

## Upload Summary

**Upload Started:** _______________
**Upload Completed:** _______________
**Total Files Uploaded:** ___ / ${manifest.length}
**Issues Encountered:** _______________

## Notes

_Use this space to document any issues, observations, or notes about the upload process._

---

**Checklist Version:** 1.0
**Last Updated:** ${new Date().toISOString()}
`;

  return checklist;
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
