/**
 * Webhook signature verification utilities
 * Implements HMAC signature verification for payment provider webhooks
 */

import crypto from 'crypto';

/**
 * Verify Revolut webhook signature
 * Revolut sends webhook signatures in the 'Revolut-Signature' header
 * Format: HMAC-SHA256 hex digest
 */
export function verifyRevolutWebhook(
  payload: string | object,
  signature: string | undefined,
  secret: string | undefined
): boolean {
  if (!secret) {
    console.warn('⚠️ REVOLUT_WEBHOOK_SECRET not configured - skipping signature verification');
    return true; // Allow in development if secret not set
  }

  if (!signature) {
    console.error('❌ Missing Revolut webhook signature');
    return false;
  }

  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(payloadString).digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('❌ Error verifying Revolut webhook signature:', error);
    return false;
  }
}

/**
 * Verify Stripe webhook signature
 * Stripe sends webhook signatures in the 'Stripe-Signature' header
 * Format: t=timestamp,v1=signature (comma-separated)
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string | undefined,
  secret: string | undefined
): boolean {
  if (!secret) {
    console.warn('⚠️ STRIPE_WEBHOOK_SECRET not configured - skipping signature verification');
    return true; // Allow in development if secret not set
  }

  if (!signature) {
    console.error('❌ Missing Stripe webhook signature');
    return false;
  }

  try {
    // Stripe signature format: t=timestamp,v1=signature
    const elements = signature.split(',');
    const signatureMap: Record<string, string> = {};
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      if (key && value) {
        signatureMap[key] = value;
      }
    }

    const timestamp = signatureMap.t;
    const signatureValue = signatureMap.v1;

    if (!timestamp || !signatureValue) {
      console.error('❌ Invalid Stripe signature format');
      return false;
    }

    // Verify timestamp is not too old (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    const signatureTime = parseInt(timestamp, 10);
    
    if (Math.abs(currentTime - signatureTime) > 300) { // 5 minutes tolerance
      console.error('❌ Stripe webhook signature timestamp too old');
      return false;
    }

    // Compute expected signature
    const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
    const signedPayload = `${timestamp}.${payloadString}`;
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(signedPayload).digest('hex');
    
    // Use timing-safe comparison
    const signatureBuffer = Buffer.from(signatureValue, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('❌ Error verifying Stripe webhook signature:', error);
    return false;
  }
}

/**
 * Verify PayPal webhook signature
 * PayPal uses its own webhook verification API
 * For now, we'll verify the signature using HMAC-SHA256 with webhook ID
 */
export function verifyPayPalWebhook(
  payload: string | object,
  signature: string | undefined,
  secret: string | undefined
): boolean {
  if (!secret) {
    console.warn('⚠️ PayPal webhook secret not configured - skipping signature verification');
    return true; // Allow in development if secret not set
  }

  if (!signature) {
    console.error('❌ Missing PayPal webhook signature');
    return false;
  }

  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(payloadString).digest('hex');
    
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (error) {
    console.error('❌ Error verifying PayPal webhook signature:', error);
    return false;
  }
}




