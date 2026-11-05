"use client";

import Link from "next/link";
import { Card } from "@/components/ModuleShell";
import { useWorkspace } from "@/lib/workspace-context";
import { pathForRole, workspaceHref } from "@/lib/paths";

const DO: Record<string, string> = {
  "/app/cleaner": "Open Cleaner and run the clinic file. The cleaned rows stay in Datasets.",
  "/app/datasets": "Open the saved file. Do not upload it again.",
  "/app/job-match": "Match one internal job from the description, the duties, the family, and the level.",
  "/app/equity": "Read the group line. Market mid and who sits under it.",
  "/app/cycle": "Read the envelope. Nothing above midpoint unless the exception is confirmed.",
  "/app/philosophy": "Score the file against midpoint, performance, and leftover department effects.",
  "/app/governance": "Read the rules in force for the places on the file.",
  "/app/candidates": "Open the three people in Tracker. Move a stage or leave a note.",
  "/app/closer": "Open one person and read the four-year page.",
};

const NORTHLINE = {
  slug: "northline-regional",
  line: "Fourteen outpatient clinics on the Front Range. The March file is the full staff, 2,400 people, plus three candidates.",
  places: "Boulder to Wheat Ridge",
  file: "Northline staff file, March cycle",
};

export default function StartPage() {
  const { me, error } = useWorkspace();
  const path = pathForRole(me?.membership.role);
  const northline = me?.org.slug === NORTHLINE.slug;

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Get started</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {path.title}
        </h1>
        <p className="mt-2 text-slate-600">{path.line}</p>
      </div>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Institution</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{me?.org.name || "Workspace"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {northline
            ? NORTHLINE.line
            : "Your chair follows the steps below. The file, when there is one, is already in this workspace."}
        </p>
        {northline && (
          <p className="mt-3 text-sm text-slate-700">
            {NORTHLINE.places}. File: {NORTHLINE.file}. Plan {me?.org.plan}.{" "}
            {me?.org.max_upload_rows.toLocaleString("en-US")} rows.
          </p>
        )}
        {!northline && me && (
          <p className="mt-3 text-sm text-slate-700">
            Plan {me.org.plan}. {me.org.max_upload_rows.toLocaleString("en-US")} rows.
          </p>
        )}
        {!me && !error && <p className="mt-3 text-sm text-slate-500">Loading the workspace.</p>}
      </Card>

      <ol className="space-y-3">
        {path.steps.map((step, index) => {
          const href = workspaceHref(step.href);
          return (
            <li key={step.href}>
              <Card>
                <p className="text-xs font-semibold text-teal-800">Step {index + 1}</p>
                <h3 className="mt-1 font-semibold text-slate-900">{step.label}</h3>
                <p className="mt-2 text-sm text-slate-600">{DO[href] || step.note}</p>
                <Link href={href} className="mt-3 inline-block text-sm font-medium text-teal-800">
                  Do this
                </Link>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
