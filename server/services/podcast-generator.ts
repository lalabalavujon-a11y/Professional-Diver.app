import 'dotenv/config';
import OpenAI from 'openai';
import path from 'node:path';
import { promises as fs } from 'node:fs';

interface PodcastGenerationParams {
  lessonContent: string;
  lessonTitle: string;
  trackSlug: string;
  trackTitle?: string;
  voice?: string;
  outputDir?: string;
  useGPT?: boolean; // If false, uses expanded content only (cheaper - no GPT costs)
}

export interface PodcastResult {
  filePath: string;
  publicUrl?: string;
  durationSeconds?: number;
}

// Lazy initialization of OpenAI client - only create when needed and API key is available
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required for OpenAI features. Please set the environment variable.');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Generate a comprehensive podcast script from content (lesson content or PDF text)
 * Uses GPT to create an engaging, educational narrative optimized for revision lessons
 * CRITICAL: Maintains brand neutrality - no brand names, company names, or proprietary systems
 */
async function generatePodcastScript(
  content: string, // Can be lesson content or PDF-extracted text
  lessonTitle: string,
  trackTitle?: string,
  isFromPdf: boolean = false // Indicates if content came from PDF
): Promise<string> {
  const systemPrompt = `You are Diver Well, the professional diving education podcast host for Diver Well Training, creating comprehensive revision lesson podcasts. Create an engaging, detailed podcast script that thoroughly covers ALL aspects of the content.

CRITICAL REQUIREMENTS:
1. BRAND NEUTRALITY: Do NOT mention any brand names, company names, proprietary systems, or commercial products. Use generic industry-standard terminology only.
2. COMPREHENSIVENESS: This is a REVISION lesson - cover EVERY concept, detail, and aspect from the content. Leave nothing out.
3. LENGTH: The script MUST be 3,000-4,500 words to ensure 20-30 minutes of comprehensive coverage for revision.
4. DEPTH: Expand on technical terms, provide detailed explanations, include practical examples for each concept.
5. REVISION FOCUS: Structure as a complete review that helps students master all material.

The script should:
- Be conversational and engaging, as if teaching a student one-on-one
- Cover ALL concepts from the content thoroughly and in exhaustive detail
- Include multiple practical examples and real-world applications for EACH concept
- Expand on technical terms with comprehensive explanations
- Use natural transitions between topics
- Be appropriate for professional diving industry training (brand-neutral)
- Maintain a professional yet approachable tone
- Be detailed enough to fill 20-30 minutes of speaking time for complete revision

Format the script as plain text suitable for text-to-speech (no markdown, no special formatting, no music cues, no sound effects). Write in a natural speaking style.`;

  const contentSource = isFromPdf 
    ? 'PDF Content (extracted from lesson PDF):' 
    : 'Lesson Content:';
    
  const userPrompt = `Create a comprehensive 20-30 minute REVISION podcast script. The script must be 3,000-4,500 words to ensure complete coverage of all material.

Lesson Title: ${lessonTitle}
${trackTitle ? `Track: ${trackTitle}` : ''}
${isFromPdf ? 'Content Source: PDF (comprehensive revision format)' : ''}

${contentSource}
${content.substring(0, 8000)}${content.length > 8000 ? '...' : ''}

CRITICAL INSTRUCTIONS:
- This is a REVISION lesson - cover EVERY aspect comprehensively
- Write in a natural, conversational speaking style
- Cover ALL concepts, details, and examples thoroughly
- Include practical examples for each concept
- NO brand names, company names, or proprietary systems (use generic terms)
- Target 3,000-4,500 words for comprehensive 20-30 minute revision
- No markdown, no formatting, just plain conversational text
- Ensure complete coverage - nothing should be skipped

Generate the comprehensive revision podcast script now:`;

  try {
    // Use cheaper gpt-3.5-turbo model to reduce costs
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Cheaper than gpt-4o-mini
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000, // Increased for comprehensive revision podcasts (20-30 minutes)
    });

    let script = completion.choices[0]?.message?.content || '';
    if (!script || script.trim().length < 500) {
      throw new Error('Generated script is too short. Falling back to expanded content.');
    }

    // Clean up script - remove any markdown or formatting
    script = script
      .replace(/\*\*/g, '') // Remove bold
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
      .replace(/\n{3,}/g, '\n\n') // Normalize newlines
      .trim();

    // For revision podcasts, we need longer scripts (but TTS has 4096 char limit)
    // If too long, we'll need to split into multiple TTS calls (handled in generateLessonPodcast)
    // For now, keep full script - splitting will be handled in the calling function
    if (script.length > 4000) {
      // For very long scripts, we'll need to handle splitting in the TTS conversion
      console.warn(`Script is ${script.length} characters - may need splitting for TTS`);
    }

    return script;
  } catch (error) {
    console.warn('Failed to generate podcast script with GPT, using expanded content:', error);
    // Fallback to expanded content if GPT fails
    return expandContentForPodcast(lessonContent, lessonTitle);
  }
}

export async function generateLessonPodcast({
  lessonContent,
  lessonTitle,
  trackSlug,
  trackTitle,
  voice = 'alloy',
  outputDir = 'uploads/podcasts',
  useGPT = true, // Default to using GPT for better quality
}: PodcastGenerationParams): Promise<PodcastResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for podcast generation.');
  }

  await fs.mkdir(outputDir, { recursive: true });
  const filename = `${trackSlug}-${slugify(lessonTitle)}.mp3`;
  const targetPath = path.join(outputDir, filename);

  // Generate comprehensive podcast script
  let podcastScript: string;
  const isFromPdf = lessonContent.includes('PDF') || lessonContent.length > 10000; // Heuristic: PDF text is usually longer
  if (useGPT) {
    console.log(`  📝 Generating podcast script with GPT for: ${lessonTitle}${isFromPdf ? ' (from PDF content)' : ''}`);
    podcastScript = await generatePodcastScript(lessonContent, lessonTitle, trackTitle, isFromPdf);
  } else {
    console.log(`  📝 Generating podcast script (GPT-free, cost-effective) for: ${lessonTitle}`);
    podcastScript = expandContentForPodcast(lessonContent, lessonTitle);
  }
  
  // Check script length (aim for 3,000-4,500 words for 20-30 minute revision podcasts)
  const wordCount = podcastScript.split(/\s+/).filter(w => w.length > 0).length;
  console.log(`  📊 Script word count: ${wordCount} (target: 3,000-4,500 for 20-30 min revision)`);

  // Generate speech from script
  // Use tts-1 (standard) instead of tts-1-hd to reduce costs
  // tts-1 is 3x cheaper and still produces good quality
  // TTS API has a 4096 character limit, so we need to handle long scripts by splitting
  console.log(`  🎙️ Converting to speech...`);
  
  // TTS API limit is 4096 characters - for comprehensive revision podcasts, we may need to split
  const maxChars = 4096;
  const audioChunks: Buffer[] = [];
  let finalBuffer: Buffer;
  
  if (podcastScript.length > maxChars) {
    console.log(`  📝 Script is ${podcastScript.length} chars - splitting into ${Math.ceil(podcastScript.length / maxChars)} parts for TTS`);
    
    // Split script into chunks at sentence boundaries
    const chunks: string[] = [];
    let currentChunk = '';
    
    const sentences = podcastScript.split(/([.!?]+\s+)/);
    
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] + (sentences[i + 1] || '');
      
      if ((currentChunk + sentence).length <= maxChars) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    console.log(`  📝 Split into ${chunks.length} chunks for TTS`);
    
    // Generate audio for each chunk and concatenate
    const openai = getOpenAIClient();
    for (let i = 0; i < chunks.length; i++) {
      console.log(`  🎙️ Generating audio chunk ${i + 1}/${chunks.length}...`);
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: chunks[i],
        format: 'mp3',
        speed: 1.0,
      });
      
      const chunkBuffer = Buffer.from(await response.arrayBuffer());
      audioChunks.push(chunkBuffer);
    }
    
    // Concatenate all audio chunks
    finalBuffer = Buffer.concat(audioChunks);
  } else {
    // Single TTS call for shorter scripts
    const openai = getOpenAIClient();
    const response = await openai.audio.speech.create({
      model: 'tts-1', // Standard quality - 3x cheaper than tts-1-hd
      voice,
      input: podcastScript,
      format: 'mp3',
      speed: 1.0, // Normal speaking speed
    });

    // The OpenAI SDK returns a web Response; use arrayBuffer -> stream to file
    finalBuffer = Buffer.from(await response.arrayBuffer());
  }
  
  // Write final audio file
  await fs.writeFile(targetPath, finalBuffer);

  // Estimate duration (average speaking rate is ~150 words per minute)
  // For revision podcasts, we want comprehensive coverage
  const estimatedDuration = Math.round((wordCount / 150) * 60);

  console.log(`  ✓ Podcast generated: ${(finalBuffer.length / 1024 / 1024).toFixed(2)} MB, ~${Math.round(estimatedDuration / 60)} minutes (${wordCount} words)`);

  return {
    filePath: targetPath,
    durationSeconds: estimatedDuration,
  };
}

/**
 * Generate podcast from PDF content
 * Extracts text from PDF first, then generates comprehensive revision podcast
 */
export async function generatePodcastFromPdf({
  pdfUrl,
  lessonTitle,
  trackSlug,
  trackTitle,
  voice = 'alloy',
  outputDir = 'uploads/podcasts',
}: {
  pdfUrl: string;
  lessonTitle: string;
  trackSlug: string;
  trackTitle?: string;
  voice?: string;
  outputDir?: string;
}): Promise<PodcastResult> {
  // Import PDF text extractor
  const { extractTextFromPdf } = await import('./pdf-text-extractor.js');
  
  console.log(`📄 Extracting text from PDF: ${pdfUrl}`);
  const pdfText = await extractTextFromPdf(pdfUrl);
  
  console.log(`📝 PDF text extracted: ${pdfText.split(/\s+/).filter(w => w.length > 0).length} words`);
  
  // Generate podcast from PDF text
  return generateLessonPodcast({
    lessonContent: pdfText, // Use PDF-extracted text
    lessonTitle,
    trackSlug,
    trackTitle,
    voice,
    outputDir,
    useGPT: true, // Always use GPT for PDF-based podcasts to ensure quality
  });
}

/**
 * Expand lesson content into a 15-25 minute podcast script without using GPT
 * This is a cost-effective method that intelligently expands the content
 */
function expandContentForPodcast(content: string, lessonTitle: string): string {
  // Clean markdown
  let expanded = content
    .replace(/#{1,6}\s+/g, '') // remove markdown headings
    .replace(/\*\*/g, '') // bold markers
    .replace(/`/g, '') // inline code markers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // remove markdown links, keep text
    .replace(/\n{3,}/g, '\n\n') // normalize multiple newlines
    .trim();

  // Add comprehensive introduction
  const intro = `Welcome to this comprehensive lesson on ${lessonTitle}. In this podcast, we'll explore the key concepts, practical applications, and industry standards that are essential for professional diving operations. This training will help you understand not just what to do, but why it matters in real-world scenarios. Let's begin our deep dive into this important topic.\n\n`;
  
  // Add transitions and explanations between major sections
  expanded = expanded.replace(/\n\n([A-Z][^\n]{30,})/g, (match, p1) => {
    return '\n\nNow, let\'s take a closer look at ' + p1 + '. This is a crucial aspect of professional diving that requires careful understanding.';
  });
  
  // Expand bullet points and lists into full sentences
  expanded = expanded.replace(/^[-*•]\s+(.+)$/gm, (match, p1) => {
    return 'One important point to remember is that ' + p1 + '. This means that in practice, you need to pay close attention to how this applies in real diving scenarios.';
  });
  
  // Add context to technical terms and concepts
  expanded = expanded.replace(
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b(?=\s+is|\s+are|\s+refers|\s+means)/g,
    '$1, which is a fundamental concept in professional diving operations,'
  );
  
  // Expand sentences with additional context
  expanded = expanded.replace(
    /([.!?])\s+([A-Z][a-z])/g,
    (match, punct, next) => {
      // Add explanatory phrases to expand content
      const expansions = [
        ' This is critical for safety.',
        ' Understanding this properly can make the difference between success and failure.',
        ' In professional diving, this knowledge is essential.',
        ' This applies directly to real-world diving operations.',
      ];
      const randomExpansion = expansions[Math.floor(Math.random() * expansions.length)];
      return `${punct}${randomExpansion} ${next}`;
    }
  );
  
  // Add practical application notes
  expanded = expanded.replace(
    /(procedure|technique|method|protocol|standard)/gi,
    (match) => {
      if (Math.random() > 0.7) { // 30% chance to expand
        return `${match}, which you'll use regularly in your diving career,`;
      }
      return match;
    }
  );
  
  // Calculate current length
  const currentWords = expanded.split(/\s+/).length;
  const targetWords = 3000; // ~20 minutes (middle of 15-25 range)
  
  // If still too short, add more explanatory content
  if (currentWords < targetWords) {
    const shortfall = targetWords - currentWords;
    const additionalContent = `\n\nLet me emphasize a few key takeaways from this lesson. First, understanding these concepts thoroughly is essential for your safety and the safety of your team. Second, practice and real-world application will help solidify your understanding. Third, always refer back to industry standards and regulations when applying these principles. Finally, continuous learning and staying current with industry developments is crucial for professional growth in the diving industry.`;
    expanded += additionalContent;
  }
  
  // Add comprehensive conclusion
  const conclusion = `\n\nThat concludes our comprehensive lesson on ${lessonTitle}. We've covered the essential concepts, practical applications, industry standards, and real-world considerations. Remember to review this material regularly, practice these skills in controlled environments before applying them in the field, and always prioritize safety above all else. This is Diver Well, signing off. Remember: knowledge combined with experience creates true competence in professional diving. Stay safe, stay current, and keep learning.`;
  
  return intro + expanded + conclusion;
}

function optimizeContentForPodcast(content: string): string {
  return content
    .replace(/#{1,6}\s+/g, '') // remove markdown headings
    .replace(/\*\*/g, '') // bold markers
    .replace(/`/g, '') // inline code markers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // remove markdown links, keep text
    .replace(/\n{3,}/g, '\n\n') // normalize multiple newlines
    .trim();
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export default {
  generateLessonPodcast,
};
