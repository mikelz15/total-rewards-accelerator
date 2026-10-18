"use client";

import { useState } from "react";
import { Button } from "@/components/ModuleShell";

export type CreditJob = {
  title: string;
  employer: string;
  credit: string;
  reason: string;
  calendar_months: number;
  credited_years: number;
  dropped_months: number;
  readable: boolean;
};

export type CreditLedger = {
  jobs: CreditJob[];
  credited_years: number;
  calendar_years: number;
  can_confirm: boolean;
  blocking: string[];
  education?: string | null;
  resume_text?: string;
};

type Props = {
  jobTitle: string;
  onConfirm: (years: number, education: string | null) => void;
  loadSample: () => Promise<CreditLedger>;
  tallyText: (text: string, targetTitle: string) => Promise<CreditLedger>;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900";

export function ResumeCredit({ jobTitle, onConfirm, loadSample, tallyText }: Props) {
  const [text, setText] = useState("");
  const [ledger, setLedger] = useState<CreditLedger | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(loader: () => Promise<CreditLedger>) {
    setBusy(true);
    setError(null);
    try {
      const next = await loader();
      setLedger(next);
      if (next.resume_text) setText(next.resume_text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tally failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
        Resume tally
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Same benchmark is full credit. Same family, or a match a grade off, is half.
        A different function is none. Overlap counts once. Confirm fills Years of experience.
      </p>
      <textarea
        className={`${inputClass} mt-3 min-h-28`}
        placeholder="Paste one resume. Or open the sample."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => void run(loadSample)}>
          {busy ? "Working…" : "Sample resume"}
        </Button>
        <Button
          disabled={busy || !text.trim()}
          onClick={() => void run(() => tallyText(text, jobTitle))}
        >
          Tally this resume
        </Button>
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      {ledger && (
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-1 pr-3">Job</th>
                  <th className="py-1 pr-3">Credit</th>
                  <th className="py-1 pr-3">Years</th>
                  <th className="py-1">Why</th>
                </tr>
              </thead>
              <tbody>
                {ledger.jobs.map((job, i) => (
                  <tr key={`${job.title}-${i}`} className="border-t border-teal-100">
                    <td className="py-2 pr-3 text-slate-900">
                      {job.title || "Untitled"}
                      {job.employer ? <span className="block text-xs text-slate-500">{job.employer}</span> : null}
                    </td>
                    <td className="py-2 pr-3 capitalize text-slate-700">{job.credit}</td>
                    <td className="py-2 pr-3 tabular-nums text-slate-700">
                      {job.credited_years}
                      {job.dropped_months > 0 ? (
                        <span className="block text-xs text-slate-500">{job.dropped_months} mo overlap dropped</span>
                      ) : null}
                    </td>
                    <td className="py-2 text-slate-600">{job.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate-700">
            {ledger.credited_years} credit years · {ledger.calendar_years} calendar years
            {ledger.education ? ` · ${ledger.education}` : ""}
          </p>
          {!ledger.can_confirm && ledger.blocking.length > 0 && (
            <p className="mt-1 text-xs text-amber-800">
              Set a date and a credit on {ledger.blocking.join(", ")} before confirm.
            </p>
          )}
          <div className="mt-3">
            <Button
              disabled={!ledger.can_confirm}
              onClick={() => onConfirm(ledger.credited_years, ledger.education || null)}
            >
              Confirm {ledger.credited_years} years
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
