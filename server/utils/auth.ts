/**
 * Authentication utilities for password hashing and verification
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plain text password against a hashed password
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string | null): Promise<boolean> {
  if (!hashedPassword) {
    return false;
  }
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Check if password meets security requirements
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }
  return { valid: true };
}




