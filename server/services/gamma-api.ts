import 'dotenv/config';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Public Gamma API endpoint
const GAMMA_API_BASE = 'https://public-api.gamma.app/v1.0';

export interface GammaPdfResult {
  pdfUrl?: string;
  fileBuffer?: ArrayBuffer;
  localPath?: string;
}

// Helper function to sanitize lesson title for URL
function sanitizeLessonTitle(title: string): string {
  if (!title || typeof title !== 'string' || !title.trim()) {
    return 'lesson';
  }
  
  let sanitized = title.toLowerCase().trim();
  sanitized = sanitized.replace(/[\s_]+/g, '-');
  sanitized = sanitized.replace(/[^a-z0-9-]/g, '');
  sanitized = sanitized.replace(/-+/g, '-');
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100).replace(/-+$/, '');
  }
  
  return sanitized || 'lesson';
}

// Download PDF from Gamma URL and save locally with custom URL structure
export async function downloadAndSavePDF(gammaUrl: string, lessonTitle: string): Promise<string> {
  // Create the custom URL path: diver-well-training/[lesson-name].pdf
  const sanitizedTitle = sanitizeLessonTitle(lessonTitle);
  const customPath = `diver-well-training/${sanitizedTitle}.pdf`;
  const fullPath = path.join(process.cwd(), 'uploads', customPath);
  
  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  
  // Try to download PDF from Gamma
  // Gamma document URLs might need special handling - try direct download first
  let pdfResponse: Response;
  
  // Try the URL as-is first (in case it's already a PDF)
  pdfResponse = await fetch(gammaUrl);
  
  // If not a PDF, try appending export parameter
  if (!pdfResponse.ok || !pdfResponse.headers.get('content-type')?.includes('pdf')) {
    const exportUrl = gammaUrl.includes('?') 
      ? `${gammaUrl}&export=pdf` 
      : `${gammaUrl}?export=pdf`;
    pdfResponse = await fetch(exportUrl);
  }
  
  // If still not working, try Gamma's export API endpoint
  if (!pdfResponse.ok || !pdfResponse.headers.get('content-type')?.includes('pdf')) {
    // Extract document ID from Gamma URL if possible
    const docIdMatch = gammaUrl.match(/\/docs\/([a-z0-9]+)/);
    if (docIdMatch) {
      const docId = docIdMatch[1];
      const exportApiUrl = `https://gamma.app/api/export/${docId}/pdf`;
      pdfResponse = await fetch(exportApiUrl);
    }
  }
  
  if (!pdfResponse.ok) {
    throw new Error(`Failed to download PDF from Gamma: ${pdfResponse.status} ${pdfResponse.statusText}`);
  }
  
  const arrayBuffer = await pdfResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Save to local file
  await writeFile(fullPath, buffer);
  
  // Return the custom URL path
  return `/uploads/${customPath}`;
}

export async function generateLessonPDF(
  lessonContent: string,
  lessonTitle: string,
  trackTitle: string
): Promise<GammaPdfResult> {
  const apiKey = process.env.GAMMA_API_KEY;
  if (!apiKey) {
    throw new Error('GAMMA_API_KEY is required to generate PDFs.');
  }

  // Template-based generation: use /generations/from-template endpoint
  const body = {
    gammaId: 'g_y8099ohiceag889',  // Template ID in body, not URL
    prompt: `${trackTitle} - ${lessonTitle}\n\n${lessonContent}`,
    exportAs: 'pdf',
  };

  const response = await fetch(`${GAMMA_API_BASE}/generations/from-template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gamma API error: ${response.status} ${errorText}`);
  }

  const createResponse = (await response.json()) as { generationId?: string; id?: string };
  const generationId = createResponse.generationId || createResponse.id;
  
  if (!generationId) {
    throw new Error('Gamma API did not return a generation ID');
  }

  // Poll for the generation result
  const maxAttempts = 120; // 10 minutes max (5 second intervals)
  const pollInterval = 5000; // 5 seconds
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Wait before polling (except on first attempt)
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    const pollResponse = await fetch(`${GAMMA_API_BASE}/generations/${generationId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'accept': 'application/json',
      },
    });

    if (!pollResponse.ok) {
      const errorText = await pollResponse.text();
      throw new Error(`Gamma API polling error: ${pollResponse.status} ${errorText}`);
    }

    const pollData = (await pollResponse.json()) as any;
    
    // Log response structure on first attempt for debugging (only in development)
    if (attempt === 0 && process.env.NODE_ENV === 'development') {
      console.log('Gamma poll response (first check):', JSON.stringify(pollData, null, 2));
    }
    
    const status = pollData.status?.toLowerCase();
    
    // Check if generation is complete
    if (status === 'completed' || status === 'done' || status === 'success' || status === 'finished') {
      // Look for PDF URL in various possible field names
      const gammaUrl = pollData.pdfUrl || pollData.fileUrl || pollData.pdf || pollData.url || 
                       pollData.downloadUrl || pollData.gammaUrl || pollData.exportUrl ||
                       pollData.pdfDownloadUrl || pollData.export?.pdf || pollData.exports?.pdf ||
                       pollData.result?.pdfUrl || pollData.result?.url;
      
      if (gammaUrl) {
        try {
          // Download and save PDF locally with custom URL structure
          const customUrl = await downloadAndSavePDF(gammaUrl, lessonTitle);
          console.log(`   ✓ Downloaded and saved PDF: ${customUrl}`);
          return { pdfUrl: customUrl, localPath: customUrl };
        } catch (downloadError) {
          console.error(`   ⚠️ Failed to download PDF from Gamma, using Gamma URL:`, downloadError instanceof Error ? downloadError.message : downloadError);
          // Fallback: return Gamma URL if download fails
          return { pdfUrl: gammaUrl };
        }
      }
      
      // Log if status is complete but no URL found (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Generation complete but no PDF URL found. Full response:', JSON.stringify(pollData, null, 2));
      }
    }
    
    // If generation failed
    if (status === 'failed' || status === 'error' || status === 'cancelled') {
      throw new Error(`Gamma generation failed: ${pollData.error || pollData.message || 'Unknown error'}`);
    }
    
    // Continue polling if status is 'pending', 'processing', 'in_progress', etc.
    // Log progress every 10 attempts
    if (attempt > 0 && attempt % 10 === 0) {
      console.log(`Still polling... (attempt ${attempt}/${maxAttempts}, status: ${status})`);
    }
    
    if (attempt === maxAttempts - 1) {
      throw new Error(`Gamma generation timed out after ${maxAttempts} attempts. Last status: ${status}`);
    }
  }

  throw new Error('Gamma generation polling completed without result');
}

export default {
  generateLessonPDF,
};
