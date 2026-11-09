-- Philosophy (and saved Cycle locks) write analysis_runs rows with kinds the
-- 001 CHECK never listed. The insert failed, the API returned a bare 500, and
-- the browser reported it as a CORS error on /api/v1/philosophy/run.
-- Widen the allowed kinds. Existing rows are untouched.

ALTER TABLE analysis_runs DROP CONSTRAINT IF EXISTS analysis_runs_kind_check;
ALTER TABLE analysis_runs
  ADD CONSTRAINT analysis_runs_kind_check
  CHECK (kind IN ('audit', 'flight_risk', 'remediation', 'placement', 'clean', 'philosophy', 'cycle'));
