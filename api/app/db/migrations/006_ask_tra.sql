-- Ask TRA (public website chat assistant).
--
-- Two tables, both service-role only: RLS is enabled with NO policies, so the
-- public anon/authenticated API cannot read or write them at all. The web
-- app's Ask TRA routes use the service-role key (SUPABASE_SERVICE_ROLE_KEY).
--
-- ask_tra_usage_monthly holds ONLY aggregate counters — questions answered,
-- refusals, handoffs, token totals, estimated USD cost. Chat content is never
-- stored anywhere. ask_tra_handoffs is the "Talk to Mike" queue, used only
-- until mail transport (Resend) is wired; rows are messages addressed to Rio.

CREATE TABLE IF NOT EXISTS ask_tra_usage_monthly (
  month         TEXT PRIMARY KEY,
  questions     INTEGER NOT NULL DEFAULT 0,
  refusals      INTEGER NOT NULL DEFAULT 0,
  handoffs      INTEGER NOT NULL DEFAULT 0,
  input_tokens  BIGINT  NOT NULL DEFAULT 0,
  output_tokens BIGINT  NOT NULL DEFAULT 0,
  est_cost_usd  NUMERIC(10, 4) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ask_tra_handoffs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  question   TEXT NOT NULL,
  delivered  BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE ask_tra_usage_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE ask_tra_handoffs ENABLE ROW LEVEL SECURITY;

-- Atomic monthly increment so concurrent web instances cannot lose counts.
CREATE OR REPLACE FUNCTION ask_tra_add_usage(
  p_month TEXT,
  p_questions INTEGER,
  p_refusals INTEGER,
  p_handoffs INTEGER,
  p_input_tokens BIGINT,
  p_output_tokens BIGINT,
  p_est_cost_usd NUMERIC
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ask_tra_usage_monthly (
    month, questions, refusals, handoffs, input_tokens, output_tokens, est_cost_usd, updated_at
  ) VALUES (
    p_month, p_questions, p_refusals, p_handoffs, p_input_tokens, p_output_tokens, p_est_cost_usd, now()
  )
  ON CONFLICT (month) DO UPDATE SET
    questions     = ask_tra_usage_monthly.questions + EXCLUDED.questions,
    refusals      = ask_tra_usage_monthly.refusals + EXCLUDED.refusals,
    handoffs      = ask_tra_usage_monthly.handoffs + EXCLUDED.handoffs,
    input_tokens  = ask_tra_usage_monthly.input_tokens + EXCLUDED.input_tokens,
    output_tokens = ask_tra_usage_monthly.output_tokens + EXCLUDED.output_tokens,
    est_cost_usd  = ask_tra_usage_monthly.est_cost_usd + EXCLUDED.est_cost_usd,
    updated_at    = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
