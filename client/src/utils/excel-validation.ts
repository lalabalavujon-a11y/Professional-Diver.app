/**
 * Excel File Input Validation Utilities
 * Provides security checks for Excel file uploads to prevent malicious files
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 10000; // Maximum rows allowed in Excel file
const MAX_COLUMNS = 100; // Maximum columns allowed
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/excel',
  'application/x-excel',
  'application/x-msexcel',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates Excel file before processing
 * Checks file size, extension, MIME type, and basic structure
 */
export function validateExcelFile(file: File): ValidationResult {
  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  // Check MIME type if available (browser-dependent)
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    // Warn but don't fail - MIME types can be unreliable
    console.warn(`Unexpected MIME type: ${file.type}. Proceeding with caution.`);
  }

  return { valid: true };
}

/**
 * Validates parsed Excel data structure
 * Checks row count, column count, and data integrity
 */
export function validateExcelData(data: any[]): ValidationResult {
  if (!Array.isArray(data)) {
    return {
      valid: false,
      error: 'Invalid data format: expected array',
    };
  }

  // Check row count
  if (data.length > MAX_ROWS) {
    return {
      valid: false,
      error: `File contains too many rows (${data.length}). Maximum allowed: ${MAX_ROWS}`,
    };
  }

  // Check if data is empty
  if (data.length === 0) {
    return {
      valid: false,
      error: 'File contains no data rows',
    };
  }

  // Check column count in first row
  const firstRow = data[0];
  if (firstRow && typeof firstRow === 'object') {
    const columnCount = Object.keys(firstRow).length;
    if (columnCount > MAX_COLUMNS) {
      return {
        valid: false,
        error: `File contains too many columns (${columnCount}). Maximum allowed: ${MAX_COLUMNS}`,
      };
    }
  }

  // Check for suspicious patterns that might indicate malicious content
  for (const row of data) {
    if (typeof row === 'object' && row !== null) {
      for (const [key, value] of Object.entries(row)) {
        // Check for suspiciously long strings (potential DoS)
        if (typeof value === 'string' && value.length > 100000) {
          return {
            valid: false,
            error: 'File contains suspiciously long values. Maximum cell value length: 100,000 characters',
          };
        }

        // Check for suspicious column names (prototype pollution attempts)
        if (key.includes('__proto__') || key.includes('constructor') || key.includes('prototype')) {
          return {
            valid: false,
            error: 'File contains potentially malicious column names',
          };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Sanitizes Excel data to prevent prototype pollution
 */
export function sanitizeExcelData(data: any[]): any[] {
  return data.map((row) => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      return row;
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(row)) {
      // Skip prototype pollution attempts
      if (
        key === '__proto__' ||
        key === 'constructor' ||
        key === 'prototype' ||
        key.startsWith('__') ||
        key.startsWith('constructor.')
      ) {
        continue;
      }

      // Sanitize string values - limit length and remove control characters
      if (typeof value === 'string') {
        sanitized[key] = value
          .slice(0, 100000) // Limit length
          .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  });
}

/**
 * Validates and processes Excel file with timeout protection
 */
export async function validateAndProcessExcelFile<T>(
  file: File,
  processor: (data: any[]) => Promise<T>,
  timeoutMs: number = 30000 // 30 second timeout
): Promise<T> {
  // Validate file first
  const fileValidation = validateExcelFile(file);
  if (!fileValidation.valid) {
    throw new Error(fileValidation.error);
  }

  // Process with timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Processing timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([processor([]), timeoutPromise]);
    
    // Validate processed data
    if (Array.isArray(result)) {
      const dataValidation = validateExcelData(result);
      if (!dataValidation.valid) {
        throw new Error(dataValidation.error);
      }
    }

    return result as T;
  } catch (error: any) {
    if (error.message.includes('timeout')) {
      throw error;
    }
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
}

