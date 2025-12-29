import MD5 from 'crypto-js/md5';

/**
 * Generate Gravatar URL from email address
 * @param email - User's email address
 * @param size - Image size in pixels (default: 200)
 * @param defaultImage - Default image type if Gravatar doesn't exist (default: 'identicon')
 * @returns Gravatar URL
 */
export function getGravatarUrl(
  email: string,
  size: number = 200,
  defaultImage: string = 'identicon'
): string {
  if (!email) return '';
  
  // Normalize email: trim and convert to lowercase
  const normalizedEmail = email.trim().toLowerCase();
  
  // Generate MD5 hash of email
  const hash = MD5(normalizedEmail).toString();
  
  // Build Gravatar URL
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}&r=pg`;
}

/**
 * Check if a Gravatar exists for an email
 * @param email - User's email address
 * @returns Promise that resolves to true if Gravatar exists
 */
export async function checkGravatarExists(email: string): Promise<boolean> {
  if (!email) return false;
  
  try {
    const gravatarUrl = getGravatarUrl(email, 1, '404');
    const response = await fetch(gravatarUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking Gravatar:', error);
    return false;
  }
}








