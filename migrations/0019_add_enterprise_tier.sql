-- Migration: Add ENTERPRISE tier to subscription_tier enum
-- Created: January 2025
-- Description: Adds Enterprise tier ($250/month, $2500/year) for large organizations

-- PostgreSQL: Add ENTERPRISE value to the subscription_tier enum
-- This is safe to run - it won't fail if the value already exists
DO $$ 
BEGIN
    -- Add ENTERPRISE to subscription_tier enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'ENTERPRISE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_tier')
    ) THEN
        ALTER TYPE subscription_tier ADD VALUE 'ENTERPRISE';
    END IF;
END $$;

-- Update any existing enterprise role users to have the ENTERPRISE subscription tier
UPDATE users 
SET subscription_tier = 'ENTERPRISE', 
    network_access_tier = 'ENTERPRISE',
    updated_at = NOW()
WHERE role = 'ENTERPRISE' 
AND (subscription_tier IS NULL OR subscription_tier != 'ENTERPRISE');

-- Log the migration
INSERT INTO feature_update_log (
    title, 
    description, 
    category, 
    status, 
    version,
    affected_components,
    technical_details,
    deployed_at,
    created_at,
    updated_at
) VALUES (
    'Enterprise Tier Added',
    'Added Enterprise subscription tier at $250/month and $2,500/year for large organizations with 50+ users. Includes unlimited team members, SSO/SAML integration, dedicated account manager, custom integrations, SLA guarantees, and 24/7 priority support.',
    'FEATURE',
    'DEPLOYED',
    '1.5.0',
    '["subscription-tier-service", "pricing-page", "landing-page", "affiliate-dashboard", "schema"]'::json,
    'Added ENTERPRISE to subscription_tier enum in PostgreSQL. Updated pricing service with Enterprise tier pricing and features. Created comprehensive pricing page with all tiers. Updated affiliate commission structure.',
    NOW(),
    NOW(),
    NOW()
);
