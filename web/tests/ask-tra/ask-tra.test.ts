import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  detectSensitiveData,
  estimateCostUsd,
  visitorKey,
} from "@/lib/ask-tra/guardrails";
import { RateLimiter } from "@/lib/ask-tra/ratelimit";
import { budgetStatus, monthKey, type MonthUsage } from "@/lib/ask-tra/store";

describe("detectSensitiveData — blocks real personal data", () => {
  it("flags an SSN", () => {
    expect(detectSensitiveData("one of our people is 123-45-6789 in the file")?.kind).toBe("ssn");
  });

  it("flags a Luhn-valid card number", () => {
    expect(detectSensitiveData("card on file 4242 4242 4242 4242 thanks")?.kind).toBe("card");
  });

  it("flags a labelled date of birth", () => {
    expect(detectSensitiveData("her date of birth: 04/12/1988")?.kind).toBe("dob");
  });

  it("flags pasted pay rows (many lines with money)", () => {
    const dump = [
      "row a — $92,000",
      "row b — $88,500",
      "row c — $110,000",
      "row d — $101,250",
    ].join("\n");
    expect(detectSensitiveData(dump)).not.toBeNull();
  });

  it("flags multiple names paired with pay", () => {
    const dump = "Jane Doe — $92,000\nMarcus Chen — $88,500";
    expect(detectSensitiveData(dump)?.kind).toBe("named-pay");
  });

  it("flags CSV rows with HR headers", () => {
    const dump = [
      "Employee Name,Department,Annual Salary,Midpoint,Hire Date",
      "A B,Eng,90000,110000,2020-01-01",
      "C D,Eng,95000,110000,2021-01-01",
      "E F,Eng,99000,110000,2022-01-01",
    ].join("\n");
    expect(detectSensitiveData(dump)).not.toBeNull();
  });
});

describe("detectSensitiveData — allows normal product questions", () => {
  it("allows a Closer example with one offer's numbers", () => {
    expect(
      detectSensitiveData("If base is $185,000 with a 20% bonus and LTI, what does Closer show?")
    ).toBeNull();
  });

  it("allows a single hypothetical name + salary (a sample-style question)", () => {
    expect(detectSensitiveData("Say Jane Smith makes $120,000 — how would the demo handle it?")).toBeNull();
  });

  it("allows plain module questions", () => {
    expect(detectSensitiveData("What is Cycle Lock and is it a separate charge?")).toBeNull();
    expect(detectSensitiveData("How does the four-year wealth projection work?")).toBeNull();
  });

  it("does not flag long non-card numbers", () => {
    expect(detectSensitiveData("We have about 1234567890123 rows across systems")).toBeNull();
  });
});

describe("estimateCostUsd", () => {
  it("prices gpt-4o-mini usage at gateway list rates", () => {
    const cost = estimateCostUsd("openai/gpt-4o-mini", {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
    });
    expect(cost).toBeCloseTo(0.75, 6);
  });

  it("handles missing usage as zero", () => {
    expect(estimateCostUsd("openai/gpt-4o-mini", undefined)).toBe(0);
  });
});

describe("visitorKey", () => {
  it("hashes IPs and never returns the raw value", () => {
    const key = visitorKey("203.0.113.7");
    expect(key).not.toContain("203.0.113.7");
    expect(key).toHaveLength(32);
    expect(visitorKey("203.0.113.7")).toBe(key);
  });
});

describe("RateLimiter", () => {
  it("enforces the short window", () => {
    const rl = new RateLimiter(3, 60_000, 100);
    const t = 1_000_000;
    expect(rl.take("k", t)).toBe(true);
    expect(rl.take("k", t + 1)).toBe(true);
    expect(rl.take("k", t + 2)).toBe(true);
    expect(rl.take("k", t + 3)).toBe(false);
    expect(rl.take("k", t + 61_000)).toBe(true);
  });

  it("enforces the daily cap", () => {
    const rl = new RateLimiter(100, 60_000, 2);
    const t = Date.UTC(2026, 9, 25, 12, 0, 0);
    expect(rl.take("k", t)).toBe(true);
    expect(rl.take("k", t + 120_000)).toBe(true);
    expect(rl.take("k", t + 240_000)).toBe(false);
  });

  it("tracks visitors independently", () => {
    const rl = new RateLimiter(1, 60_000, 100);
    expect(rl.take("a")).toBe(true);
    expect(rl.take("a")).toBe(false);
    expect(rl.take("b")).toBe(true);
  });
});

describe("budget guard", () => {
  const base: MonthUsage = {
    month: "2026-10",
    questions: 0,
    refusals: 0,
    handoffs: 0,
    inputTokens: 0,
    outputTokens: 0,
    estCostUsd: 0,
  };

  it("is open below the alert line", () => {
    expect(budgetStatus({ ...base, estCostUsd: 19.99 })).toBe("open");
  });

  it("alerts at $20 but keeps answering", () => {
    expect(budgetStatus({ ...base, estCostUsd: 20 })).toBe("alert");
    expect(budgetStatus({ ...base, estCostUsd: 24.99 })).toBe("alert");
  });

  it("pauses at the $25 cap", () => {
    expect(budgetStatus({ ...base, estCostUsd: 25 })).toBe("paused");
  });

  it("formats month keys as YYYY-MM", () => {
    expect(monthKey(new Date("2026-10-25T12:00:00Z"))).toBe("2026-10");
  });
});

describe("knowledge file hygiene", () => {
  const raw = readFileSync(
    fileURLToPath(new URL("../../src/content/ask-tra-knowledge.md", import.meta.url)),
    "utf8"
  );
  // Same comment-stripping the prompt builder applies: maintainer notes are
  // review scaffolding, not model knowledge.
  const knowledge = raw.replace(/<!--[\s\S]*?-->/g, "");

  it("quotes no prices and no dollar figures for TRA", () => {
    expect(knowledge).not.toMatch(/\$\s?\d/);
  });

  it("excludes audit-flagged overclaim language", () => {
    expect(knowledge.toLowerCase()).not.toContain("three clicks");
    expect(knowledge.toLowerCase()).not.toContain("dual-lens");
    expect(knowledge.toLowerCase()).not.toContain("flight risk");
    expect(knowledge.toLowerCase()).not.toContain("every module included");
  });

  it("excludes unreleased features entirely", () => {
    expect(knowledge.toLowerCase()).not.toContain("job match");
    expect(knowledge.toLowerCase()).not.toContain("jobmatch");
  });

  it("states the Closer guardrail explicitly", () => {
    expect(knowledge).toContain("four-year total wealth trajectory");
    expect(knowledge.toLowerCase()).toContain("does not compare an offer against your internal pay ranges");
  });

  it("routes handoffs to Rio's inbox and says replies are by email", () => {
    expect(knowledge).toContain("heyrio@mail.grokbot.com");
    expect(knowledge.toLowerCase()).toContain("replies come back by email");
  });
});
