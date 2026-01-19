import 'dotenv/config';
import pdfParse from 'pdf-parse';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Extract text content from a PDF file
 * Supports both local file paths and HTTP/HTTPS URLs
 * Used for generating podcasts from PDF content
 */
export async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  let pdfBuffer: Buffer;

  try {
    // Handle URLs (HTTP/HTTPS)
    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
      console.log(`📄 Downloading PDF from URL: ${pdfUrl}`);
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
      console.log(`📄 Downloaded PDF, size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    } 
    // Handle local file paths
    else if (pdfUrl.startsWith('/') || !pdfUrl.includes('://')) {
      // Resolve relative paths (e.g., /uploads/file.pdf)
      const filePath = pdfUrl.startsWith('/') 
        ? path.join(process.cwd(), pdfUrl) 
        : path.resolve(pdfUrl);
      
      console.log(`📄 Reading PDF from local path: ${filePath}`);
      pdfBuffer = await fs.readFile(filePath);
      console.log(`📄 Read PDF, size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    } 
    else {
      throw new Error(`Invalid PDF URL format: ${pdfUrl}`);
    }

    // Extract text using pdf-parse
    console.log('📄 Extracting text from PDF...');
    const data = await pdfParse(pdfBuffer);
    
    const extractedText = data.text || '';
    const wordCount = extractedText.split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`✅ PDF text extracted: ${wordCount} words, ${extractedText.length} characters`);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('PDF appears to be empty or contains no extractable text. The PDF may be image-based or corrupted.');
    }

    // Clean up extracted text
    let cleanedText = extractedText
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .replace(/\s{3,}/g, ' ') // Normalize multiple spaces
      .trim();

    // Remove common PDF artifacts (page numbers, headers, footers)
    // This helps with brand neutrality by removing potential brand mentions in headers/footers
    cleanedText = cleanedText
      .replace(/\d+\s*$/gm, '') // Remove trailing page numbers
      .replace(/^Page\s+\d+.*$/gmi, '') // Remove "Page X" lines
      .replace(/\n{3,}/g, '\n\n') // Clean up extra newlines after removal
      .trim();

    console.log(`✅ Cleaned text: ${cleanedText.split(/\s+/).filter(w => w.length > 0).length} words`);
    
    return cleanedText;
  } catch (error) {
    console.error('❌ Error extracting text from PDF:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
    throw new Error('Failed to extract text from PDF: Unknown error');
  }
}

export default {
  extractTextFromPdf,
};
