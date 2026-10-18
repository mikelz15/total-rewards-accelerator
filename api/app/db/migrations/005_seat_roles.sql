-- Seats added after 001: recruiter (ta), HRBP, executive.
-- The API also widens this check on the first signed-in request.

ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_role_check;
ALTER TABLE memberships ADD CONSTRAINT memberships_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'ta', 'hrbp', 'executive', 'viewer'));
