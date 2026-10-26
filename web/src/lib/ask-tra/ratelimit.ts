/**
 * Ask TRA per-visitor rate limiting.
 *
 * In-memory sliding windows keyed by a HASHED visitor IP (see visitorKey in
 * guardrails.ts) — raw IPs are never kept. Honest limitation: this state is
 * per server instance and resets on cold start, which is acceptable for a
 * marketing-site chat; if traffic grows, move these counters into the same
 * Supabase store the budget guard uses (store.ts) or an edge KV.
 */

interface WindowState {
  /** Timestamps (ms) of hits inside the short window. */
  hits: number[];
  /** Timestamps (ms) of hits inside the current day. */
  dayHits: number[];
  dayKey: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export class RateLimiter {
  private readonly map = new Map<string, WindowState>();

  constructor(
    private readonly perWindow: number,
    private readonly windowMs: number,
    private readonly perDay: number
  ) {}

  /** Returns true and records the hit when allowed; false when limited. */
  take(key: string, now = Date.now()): boolean {
    const dayKey = new Date(now).toISOString().slice(0, 10);
    let state = this.map.get(key);
    if (!state || state.dayKey !== dayKey) {
      state = { hits: [], dayHits: [], dayKey };
      this.map.set(key, state);
    }
    state.hits = state.hits.filter((t) => now - t < this.windowMs);
    state.dayHits = state.dayHits.filter((t) => now - t < DAY_MS);
    if (state.hits.length >= this.perWindow || state.dayHits.length >= this.perDay) {
      return false;
    }
    state.hits.push(now);
    state.dayHits.push(now);
    return true;
  }

  /** Opportunistic cleanup so the map cannot grow without bound. */
  sweep(now = Date.now()): void {
    if (this.map.size < 1000) return;
    this.map.forEach((state, key) => {
      const last = Math.max(0, ...state.dayHits);
      if (now - last > DAY_MS) this.map.delete(key);
    });
  }
}
