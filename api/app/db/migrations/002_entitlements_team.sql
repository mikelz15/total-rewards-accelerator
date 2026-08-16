-- Entitlements, suspend flag, team invites
-- Run in Supabase SQL editor after 001_saas.sql

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS entitlements_json JSONB;

-- Allow broader plan codes (trial, suite, module SKUs, etc.)
-- (no CHECK change if none existed beyond app layer)

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invites_org ON invites(org_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);

-- Ensure subscriptions table has modules_json (from 001)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS modules_json JSONB NOT NULL DEFAULT '[]'::jsonb;
