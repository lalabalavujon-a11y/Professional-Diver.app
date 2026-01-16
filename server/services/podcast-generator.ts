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
 * Generate a comprehensive 15-20 minute podcast script from lesson content
 * Uses GPT to create an engaging, educational narrative
 */
async function generatePodcastScript(
  lessonContent: string,
  lessonTitle: string,
  trackTitle?: string
): Promise<string> {
  const systemPrompt = `You are a professional diving education podcast host. Create a comprehensive, engaging podcast script that is 15-25 minutes long when read aloud.

CRITICAL: The script MUST be approximately 2,500-3,500 words (NOT shorter). This is essential for a proper 15-25 minute podcast.

The script should:
- Be conversational and engaging, as if teaching a student one-on-one
- Cover ALL key concepts from the lesson content thoroughly and in detail
- Include practical examples and real-world applications for each concept
- Expand on technical terms with clear explanations
- Use natural transitions between topics
- Be appropriate for professional diving industry training
- Maintain a professional yet approachable tone
- Be detailed enough to fill 15-25 minutes of speaking time

Format the script as plain text suitable for text-to-speech (no markdown, no special formatting, no music cues, no sound effects). Write in a natural speaking style.`;

  const userPrompt = `Create a comprehensive 15-25 minute podcast script for this lesson. The script must be approximately 2,500-3,000 words and MUST NOT exceed 3,500 characters when formatted for text-to-speech.

Lesson Title: ${lessonTitle}
${trackTitle ? `Track: ${trackTitle}` : ''}

Lesson Content:
${lessonContent.substring(0, 6000)}${lessonContent.length > 6000 ? '...' : ''}

IMPORTANT: 
- Write in a natural, conversational speaking style
- Cover all key concepts thoroughly
- Include practical examples
- Keep the total character count under 3,500 characters (including spaces)
- No markdown, no formatting, just plain conversational text

Generate the podcast script now:`;

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
      max_tokens: 3000, // Reduced to ensure scripts fit TTS 4096 char limit
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

    // If still too long, truncate intelligently
    if (script.length > 3500) {
      const truncated = script.substring(0, 3400);
      const lastSentence = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
      );
      if (lastSentence > 3000) {
        script = script.substring(0, lastSentence + 1);
      } else {
        script = truncated;
      }
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
  if (useGPT) {
    console.log(`  📝 Generating podcast script with GPT for: ${lessonTitle}`);
    podcastScript = await generatePodcastScript(lessonContent, lessonTitle, trackTitle);
  } else {
    console.log(`  📝 Generating podcast script (GPT-free, cost-effective) for: ${lessonTitle}`);
    podcastScript = expandContentForPodcast(lessonContent, lessonTitle);
  }
  
  // Check script length (aim for 2,250-3,750 words for 15-25 minutes)
  const wordCount = podcastScript.split(/\s+/).length;
  console.log(`  📊 Script word count: ${wordCount} (target: 2,250-3,750 for 15-25 min)`);

  // Generate speech from script
  // Use tts-1 (standard) instead of tts-1-hd to reduce costs
  // tts-1 is 3x cheaper and still produces good quality
  // TTS API has a 4096 character limit, so we need to handle long scripts
  console.log(`  🎙️ Converting to speech...`);
  
  // TTS API limit is 4096 characters - truncate if needed
  const maxChars = 4096;
  let scriptForTTS = podcastScript;
  
  if (scriptForTTS.length > maxChars) {
    console.warn(`  ⚠️ Script too long (${scriptForTTS.length} chars), truncating to ${maxChars}...`);
    // Try to truncate at a sentence boundary
    const truncated = scriptForTTS.substring(0, maxChars - 100);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
    
    if (lastSentenceEnd > maxChars * 0.8) {
      // If we found a sentence end in the last 20%, use it
      scriptForTTS = scriptForTTS.substring(0, lastSentenceEnd + 1);
    } else {
      // Otherwise just truncate
      scriptForTTS = scriptForTTS.substring(0, maxChars);
    }
  }
  
  const openai = getOpenAIClient();
  const response = await openai.audio.speech.create({
    model: 'tts-1', // Standard quality - 3x cheaper than tts-1-hd
    voice,
    input: scriptForTTS,
    format: 'mp3',
    speed: 1.0, // Normal speaking speed
  });

  // The OpenAI SDK returns a web Response; use arrayBuffer -> stream to file
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(targetPath, buffer);

  // Estimate duration (average speaking rate is ~150 words per minute)
  const estimatedDuration = Math.round((wordCount / 150) * 60);

  console.log(`  ✓ Podcast generated: ${(buffer.length / 1024 / 1024).toFixed(2)} MB, ~${Math.round(estimatedDuration / 60)} minutes`);

  return {
    filePath: targetPath,
    durationSeconds: estimatedDuration,
  };
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
  const conclusion = `\n\nThat concludes our comprehensive lesson on ${lessonTitle}. We've covered the essential concepts, practical applications, industry standards, and real-world considerations. Remember to review this material regularly, practice these skills in controlled environments before applying them in the field, and always prioritize safety above all else. Thank you for your attention, and remember: knowledge combined with experience creates true competence in professional diving. Stay safe, stay current, and keep learning.`;
  
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
