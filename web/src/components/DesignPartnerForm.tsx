"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  DESIGN_PARTNER_FIELDS,
  HONEYPOT_FIELD,
  UTM_FIELDS,
  countWords,
  isFieldVisible,
  submissionStatus,
  validateApplication,
  type DesignPartnerField,
} from "@/lib/design-partner/fields";

type Values = Record<string, string | boolean>;

const inputClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2";

function initialValues(): Values {
  const v: Values = { [HONEYPOT_FIELD]: "" };
  for (const f of DESIGN_PARTNER_FIELDS) v[f.name] = f.kind === "checkbox" ? false : "";
  return v;
}

export function DesignPartnerForm() {
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [utm, setUtm] = useState<Record<string, string>>({});
  const early = submissionStatus() === "interest";

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const k of UTM_FIELDS) {
      const v = q.get(k);
      if (v) found[k] = v;
    }
    setUtm(found);
  }, []);

  const groups = useMemo(() => {
    const out: { name: string; fields: DesignPartnerField[] }[] = [];
    for (const f of DESIGN_PARTNER_FIELDS) {
      const last = out[out.length - 1];
      if (last && last.name === f.group) last.fields.push(f);
      else out.push({ name: f.group, fields: [f] });
    }
    return out;
  }, []);

  function set(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const check = validateApplication(values);
    if (!check.ok) {
      setErrors(check.errors);
      setState("error");
      setMessage("Please fix the highlighted fields.");
      const first = DESIGN_PARTNER_FIELDS.find((f) => check.errors[f.name]);
      if (first) document.getElementById(`dp-${first.name}`)?.focus();
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/design-partner/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, utm }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        error?: string;
        fields?: Record<string, string>;
      };
      if (res.ok && data.ok) {
        setState("done");
        setMessage(
          data.status === "interest"
            ? "Thank you. Your submission is saved as early interest, and the TRA review team has it. Applications open December 1, and we will reply to your work email."
            : "Thank you. Your application is saved, and the TRA review team has it. We will reply to your work email."
        );
        return;
      }
      setState("error");
      if (data.fields) setErrors(data.fields);
      setMessage(
        data.error === "rate_limited"
          ? "Too many submissions from this connection. Please try again later."
          : data.error === "invalid_fields"
            ? "Please fix the highlighted fields."
            : "Something went wrong and your submission was not saved. Please try again in a few minutes."
      );
    } catch {
      setState("error");
      setMessage("We could not reach the server. Check your connection and try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-6" role="status">
        <h3 className="text-lg font-semibold text-teal-950">Submission received</h3>
        <p className="mt-2 text-base text-teal-900">{message}</p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900">Application form</h3>
      <p className="text-sm text-slate-600">
        {early
          ? "Applications open December 1. You can submit now: until then, submissions are saved as early interest. "
          : ""}
        Your answers are saved and sent to the TRA review team, and we reply to the work email you enter. Fields
        marked * are required.
      </p>

      {/* Spam trap: hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            name={HONEYPOT_FIELD}
            value={String(values[HONEYPOT_FIELD] ?? "")}
            onChange={(e) => set(HONEYPOT_FIELD, e.target.value)}
          />
        </label>
      </div>

      {groups.map((g) => (
        <fieldset key={g.name} className="space-y-4 border-t border-slate-200 pt-4 first-of-type:border-t-0 first-of-type:pt-0">
          <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">{g.name}</legend>
          {g.fields
            .filter((f) => isFieldVisible(f, values))
            .map((f) => (
              <FieldInput key={f.name} field={f} value={values[f.name]} error={errors[f.name]} onChange={set} />
            ))}
        </fieldset>
      ))}

      {message && state === "error" ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={state === "sending"}
        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {state === "sending" ? "Submitting…" : early ? "Submit early interest" : "Submit application"}
      </button>
    </form>
  );
}

function FieldInput({
  field: f,
  value,
  error,
  onChange,
}: {
  field: DesignPartnerField;
  value: string | boolean | undefined;
  error?: string;
  onChange: (name: string, value: string | boolean) => void;
}) {
  const id = `dp-${f.name}`;
  const errId = `${id}-error`;
  const common = {
    id,
    name: f.name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errId : undefined,
  };
  const label = (
    <>
      {f.label}
      {f.required ? <span className="text-rose-600"> *</span> : null}
    </>
  );
  const err = error ? (
    <p id={errId} className="mt-1 text-sm text-rose-700">
      {error}
    </p>
  ) : null;
  const help = f.help ? <p className="mt-0.5 text-xs text-slate-500">{f.help}</p> : null;

  if (f.kind === "checkbox") {
    return (
      <div>
        <label htmlFor={id} className="flex items-start gap-2 text-sm text-slate-700">
          <input
            {...common}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(f.name, e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>{label}</span>
        </label>
        {err}
      </div>
    );
  }

  const text = typeof value === "string" ? value : "";
  let control: React.ReactNode;
  if (f.kind === "select") {
    control = (
      <select {...common} value={text} onChange={(e) => onChange(f.name, e.target.value)} className={inputClass}>
        <option value="">Select…</option>
        {f.options?.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  } else if (f.kind === "textarea" || f.kind === "paragraph") {
    control = (
      <textarea
        {...common}
        rows={f.kind === "paragraph" ? 7 : 3}
        maxLength={f.maxLength}
        value={text}
        onChange={(e) => onChange(f.name, e.target.value)}
        className={inputClass}
      />
    );
  } else {
    control = (
      <input
        {...common}
        type={f.kind === "number" ? "number" : f.kind}
        inputMode={f.kind === "number" ? "numeric" : undefined}
        min={f.min}
        max={f.max}
        maxLength={f.maxLength}
        placeholder={f.placeholder}
        autoComplete={f.kind === "email" ? "email" : f.kind === "tel" ? "tel" : undefined}
        value={text}
        onChange={(e) => onChange(f.name, e.target.value)}
        className={inputClass}
      />
    );
  }

  let counter: React.ReactNode = null;
  if (f.kind === "paragraph") {
    const words = countWords(text);
    const inRange = words >= (f.minWords ?? 0) && words <= (f.maxWords ?? Infinity);
    counter = (
      <p className={`mt-1 text-xs ${inRange ? "text-teal-700" : "text-slate-500"}`} aria-live="polite">
        {words} {words === 1 ? "word" : "words"} · {f.minWords}–{f.maxWords} needed
      </p>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {help}
      {control}
      {counter}
      {err}
    </div>
  );
}
