import { describe, expect, it } from "vitest";
import {
  MORE_TOOLS,
  PRIMARY_NAV,
  WORKFLOW,
  cardsForSeat,
  planPhrase,
  primaryNavForRole,
  seatPhrase,
  stepsCaption,
  welcomeName,
  workspaceMeta,
} from "@/lib/workspace-shell";

const suite = {
  cleaner: true,
  equity: true,
  tracker: true,
  closer: true,
  job_match: true,
};

describe("approved workspace shell", () => {
  it("keeps six working modules in the row", () => {
    expect(PRIMARY_NAV.map((link) => link.label)).toEqual([
      "Cleaner",
      "Equity",
      "Cycle",
      "Closer",
      "Tracker",
      "Job Match",
    ]);
  });

  it("numbers the owner path Cleaner, Equity, Cycle, Closer", () => {
    expect(cardsForSeat(WORKFLOW, "owner", suite).map((card) => card.title)).toEqual([
      "Cleaner",
      "Equity + Merit",
      "Cycle Lock",
      "Closer",
    ]);
    expect(stepsCaption(4)).toBe("Four steps, in order. Everything else is below.");
  });

  it("puts Job Match, Philosophy, Tracker, Datasets, and Rules beside the path", () => {
    expect(cardsForSeat(MORE_TOOLS, "owner", suite).map((card) => card.title)).toEqual([
      "Job Match",
      "Philosophy Check",
      "Tracker",
      "Datasets",
      "Rules",
    ]);
  });

  it("does not hand Cleaner to Talent", () => {
    expect(cardsForSeat(WORKFLOW, "ta", suite).map((card) => card.href)).toEqual(["/app/closer"]);
    expect(primaryNavForRole("ta").map((link) => link.label)).toEqual(["Closer", "Tracker"]);
  });

  it("writes the quiet meta line the mock uses", () => {
    expect(welcomeName("avery@northline.test")).toBe("Avery");
    expect(planPhrase("suite")).toBe("Suite plan");
    expect(seatPhrase("owner")).toBe("Rewards Owner seat");
    expect(
      workspaceMeta({
        org: "Northline Regional",
        plan: "suite",
        role: "owner",
        datasets: 3,
        candidates: 1,
      })
    ).toBe("Northline Regional · Suite plan · Rewards Owner seat · 3 datasets · 1 candidate file");
  });
});
