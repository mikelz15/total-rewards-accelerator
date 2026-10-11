-- First login and the Stripe trial write plan = 'trial'.
-- 001 only allowed demo, pilot, starter, and suite. The API also applies this
-- on the first signed-in request so a database that already ran 001 catches up.

ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_plan_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_plan_check
  CHECK (plan IN ('demo', 'pilot', 'starter', 'suite', 'trial'));
