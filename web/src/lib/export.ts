/** Client-side CSV download helpers for pilot export packs. */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return escapeCell(JSON.stringify(value));
    } catch {
      return "";
    }
  }
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function recordsToCsv(
  rows: Record<string, unknown>[],
  columns?: string[]
): string {
  if (!rows.length) return "";
  const cols =
    columns && columns.length
      ? columns
      : Array.from(
          rows.reduce((set, row) => {
            Object.keys(row).forEach((k) => set.add(k));
            return set;
          }, new Set<string>())
        );
  const header = cols.map(escapeCell).join(",");
  const body = rows
    .map((row) => cols.map((c) => escapeCell(row[c])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: string[]
) {
  downloadText(filename, recordsToCsv(rows, columns));
}

/** Staggered multi-file export (browsers often block simultaneous downloads). */
export async function downloadCsvPack(
  files: { filename: string; rows: Record<string, unknown>[]; columns?: string[] }[]
) {
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f.rows.length) continue;
    downloadCsv(f.filename, f.rows, f.columns);
    if (i < files.length - 1) {
      await new Promise((r) => setTimeout(r, 350));
    }
  }
}

export function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}
