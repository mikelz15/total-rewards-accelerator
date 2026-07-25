/**
 * Design Partner Pilot SOW — 2-page US Letter DOCX (v0.3 Placement Engine)
 */
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
        PageNumber, LevelFormat } = require("docx");
const fs = require("fs");
const path = require("path");

const outDir = __dirname;
const border = { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function cell(text, opts = {}) {
  const {
    bold = false,
    width = 4680,
    fill = null,
    align = AlignmentType.LEFT,
    fontSize = 18,
    color = "0F172A",
  } = opts;
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({ text, bold, font: "Arial", size: fontSize, color }),
        ],
      }),
    ],
  });
}

function p(text, opts = {}) {
  const {
    bold = false,
    size = 18,
    color = "0F172A",
    spaceAfter = 80,
    spaceBefore = 0,
    align = AlignmentType.LEFT,
  } = opts;
  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter, before: spaceBefore },
    children: [new TextRun({ text, bold, font: "Arial", size, color })],
  });
}

function heading(text) {
  return new Paragraph({
    spacing: { before: 140, after: 70 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: "0F766E", space: 4 },
    },
    children: [
      new TextRun({ text, bold: true, font: "Arial", size: 21, color: "0F766E" }),
    ],
  });
}

function bullet(text, ref = "bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 36 },
    children: [new TextRun({ text, font: "Arial", size: 16, color: "1E293B" })],
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 18 } } },
  },
  numbering: {
    config: ["bullets", "bullets2", "out", "client", "mod"].map((reference) => ({
      reference,
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 180 } } },
        },
      ],
    })),
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 650, right: 680, bottom: 650, left: 680 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "Total Rewards Accelerator v0.3  ·  Design Partner Pilot SOW",
                  font: "Arial",
                  size: 14,
                  color: "64748B",
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Confidential  ·  Page ",
                  font: "Arial",
                  size: 13,
                  color: "94A3B8",
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: "Arial",
                  size: 13,
                  color: "94A3B8",
                }),
                new TextRun({
                  text: " of ",
                  font: "Arial",
                  size: 13,
                  color: "94A3B8",
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: "Arial",
                  size: 13,
                  color: "94A3B8",
                }),
                new TextRun({
                  text: "  ·  Not legal advice — review with counsel before execution",
                  font: "Arial",
                  size: 13,
                  color: "94A3B8",
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        p("STATEMENT OF WORK", {
          bold: true,
          size: 26,
          color: "0F172A",
          spaceAfter: 30,
        }),
        p("Design Partner Pilot — Total Rewards Accelerator", {
          bold: true,
          size: 20,
          color: "0F766E",
          spaceAfter: 40,
        }),
        p(
          "Mikéz Comp Engineering Toolkit (v0.3): Market Data Cleaner · Placement Engine (YOE + Education) · Pay Equity Auditor · Flight Risk · Merit Remediation · Candidate Tracker · Candidate Closer",
          { size: 14, color: "64748B", spaceAfter: 100 }
        ),

        heading("1. Parties & effective date"),
        new Table({
          width: { size: 10880, type: WidthType.DXA },
          columnWidths: [2720, 2720, 2720, 2720],
          rows: [
            new TableRow({
              children: [
                cell("Provider", { bold: true, width: 2720, fill: "F1F5F9", fontSize: 15 }),
                cell("Client", { bold: true, width: 2720, fill: "F1F5F9", fontSize: 15 }),
                cell("Effective date", { bold: true, width: 2720, fill: "F1F5F9", fontSize: 15 }),
                cell("Pilot end date", { bold: true, width: 2720, fill: "F1F5F9", fontSize: 15 }),
              ],
            }),
            new TableRow({
              children: [
                cell(
                  "Michael Lopez / Mikez L.L. HR & Lean Global Solutions (or successor entity) — \"Provider\"",
                  { width: 2720, fontSize: 14 }
                ),
                cell("[CLIENT LEGAL NAME] — \"Client\"", { width: 2720, fontSize: 14 }),
                cell("[MM/DD/YYYY]", { width: 2720, fontSize: 14 }),
                cell("[MM/DD/YYYY] (4–6 weeks from kickoff)", { width: 2720, fontSize: 14 }),
              ],
            }),
          ],
        }),
        p("Primary contacts: Provider — mikez.lopez15@gmail.com · Client — [Name, email, title]", {
          size: 14,
          color: "475569",
          spaceBefore: 60,
          spaceAfter: 30,
        }),

        heading("2. Purpose"),
        p(
          "Provider will deliver a fixed-scope Design Partner Pilot of the Total Rewards Accelerator (\"Accelerator\") with hands-on Comp Engineering advisory. The pilot applies a shared Placement Engine (wage-calculator mindset: years of experience + education → expected position-in-range) alongside classic market mid-compa analysis. Goals: clean HRIS-style data; surface equity and experience-adjusted placement gaps; model merit pool remediation (mid and/or expected placement); assess flight risk with explainable drivers; and (optional) support offer total-wealth messaging. This is early access / design-partner software, not general-availability multi-tenant SaaS.",
          { size: 16, spaceAfter: 50 }
        ),

        heading("3. Product modules in scope"),
        bullet("Market Data Cleaner — messy HRIS exports, column mapping, money/dates/ratings, YOE & education fields.", "mod"),
        bullet("Placement Engine — expected rate / expected compa from experience + education credits vs range min–mid–max; keeps classic actual compa (pay ÷ mid).", "mod"),
        bullet("Pay Equity Auditor — mid-compa heatmap, under/over flags, top raise targets, top placement gaps.", "mod"),
        bullet("Flight Risk — rules-based 0–100 scores with drivers (including gap below expected placement).", "mod"),
        bullet("Merit / Remediation sandbox — fund toward market mid, expected placement, or max of both.", "mod"),
        bullet("Candidate Tracker + Candidate Closer — pipeline stages; 4-year total-wealth projection + PDF; optional recommended base from placement.", "mod"),

        heading("4. Scope of services (included)"),
        bullet("Kickoff (up to 60 minutes): goals, success metrics, data approach, policy assumptions (years-to-mid, education credits)."),
        bullet("Scrubbed-data guidance; Cleaner run on Client-approved file or approved sample (includes YOE/education mapping where present)."),
        bullet("Dual-lens readout: (a) market mid-compa / gap-to-parity; (b) expected placement / placement gap from YOE + education."),
        bullet("Flight-risk overview with transparent drivers (not legal, clinical, or guaranteed attrition prediction)."),
        bullet("Merit sandbox: at least one primary pool scenario + one alternate (Client sets pool $ and target mode)."),
        bullet("Optional: Candidate Closer walkthrough with placement recommendation and sample total-wealth PDF."),
        bullet("Written summary (~2–4 pages): findings, illustrative $ impact, recommended next steps."),
        bullet("Two office-hour sessions (up to 45 minutes each) during the pilot term."),
        bullet("Roadmap input: Client ranks top three feature requests (e.g., import custom Exp Key / education credit tables)."),

        heading("5. Out of scope"),
        bullet("Full ownership of Client’s annual merit or budget process.", "out"),
        bullet("Legal pay-equity certification, attorney opinion, or regulatory filing.", "out"),
        bullet("Production HRIS integration, SSO, or enterprise security certification (e.g., SOC 2).", "out"),
        bullet("Unlimited enterprise seats or multi-entity programs beyond agreed scope.", "out"),
        bullet("Payroll write-back or permanent hosting of Client production databases.", "out"),
        bullet("Custom ML flight-risk models trained on Client data (rules-based model only unless separately scoped).", "out"),

        heading("6. Client responsibilities"),
        bullet("Provide scrubbed data (no SSN/national ID; prefer hashed or synthetic employee IDs) or approve sample approach.", "client"),
        bullet("Where possible, include years of experience, education, and required education (or job minimums) for placement analysis.", "client"),
        bullet("Assign a single point of contact for pool assumptions, policy choices, and scheduling.", "client"),
        bullet("Attend sessions and provide timely feedback on drafts and placement defaults.", "client"),
        bullet("Use outputs for internal evaluation/pilot purposes only unless otherwise agreed.", "client"),

        heading("7. Fees & payment"),
        new Table({
          width: { size: 10880, type: WidthType.DXA },
          columnWidths: [3626, 3627, 3627],
          rows: [
            new TableRow({
              children: [
                cell("Package", { bold: true, width: 3626, fill: "0F766E", fontSize: 15, color: "FFFFFF" }),
                cell("Investment (USD)", { bold: true, width: 3627, fill: "0F766E", fontSize: 15, color: "FFFFFF" }),
                cell("Payment schedule", { bold: true, width: 3627, fill: "0F766E", fontSize: 15, color: "FFFFFF" }),
              ],
            }),
            new TableRow({
              children: [
                cell("Design Partner Pilot (standard)", { width: 3626, fontSize: 15 }),
                cell("$4,500", { width: 3627, fontSize: 15, bold: true }),
                cell("50% at signature/kickoff; 50% at final readout", { width: 3627, fontSize: 14 }),
              ],
            }),
            new TableRow({
              children: [
                cell("Early-bird (first 3 seats, if offered)", { width: 3626, fontSize: 15 }),
                cell("$3,000", { width: 3627, fontSize: 15, bold: true }),
                cell("100% upfront preferred", { width: 3627, fontSize: 14 }),
              ],
            }),
            new TableRow({
              children: [
                cell("Complex / multi-entity (if scoped)", { width: 3626, fontSize: 15 }),
                cell("$6,500", { width: 3627, fontSize: 15, bold: true }),
                cell("50% / 50% as above", { width: 3627, fontSize: 14 }),
              ],
            }),
          ],
        }),
        p(
          "Selected package for this SOW: [ ] $3,000  [ ] $4,500  [ ] $6,500   Total due: $________    Invoices Net 15. Virtual-first; no travel expected.",
          { size: 15, spaceBefore: 80, spaceAfter: 30 }
        ),
        p(
          "Cancellation: full refund if cancelled before kickoff; after kickoff, fees earned for sessions and work delivered are non-refundable.",
          { size: 14, color: "475569", spaceAfter: 30 }
        ),

        heading("8. Data handling & confidentiality"),
        p(
          "Client is the data controller. Provider processes Client data only to perform this pilot. Prefer scrubbed files. Provider will not use Client employee data to train public foundation models. Files retained only for the pilot and deleted within thirty (30) days after pilot close (or sooner on written request), except for anonymized learnings and generic product improvements. Mutual confidentiality applies to non-public information for three (3) years. Outputs are illustrative decision support, not legal, tax, or formal pay-equity certification. Placement and flight-risk scores are policy-configurable heuristics, not guarantees of market outcomes or employee behavior.",
          { size: 15, spaceAfter: 30 }
        ),

        heading("9. Intellectual property"),
        p(
          "Client owns Client data and Client-specific outputs generated from that data. Provider owns the Accelerator software, Placement Engine methods, templates, and all generic improvements. Client receives a non-exclusive, non-transferable license to use pilot outputs for internal business purposes. No right to resell, reverse engineer, or sublicense the software is granted. Anonymized feedback may improve the product.",
          { size: 15, spaceAfter: 30 }
        ),

        heading("10. Disclaimers, liability & term"),
        p(
          "Services will be performed in a professional manner. Software is early access and provided AS IS for pilot evaluation. Provider does not warrant uninterrupted or error-free operation. Except for willful misconduct, Provider’s aggregate liability under this SOW is limited to fees paid by Client under this SOW. Neither party is liable for indirect or consequential damages. Public case studies require Client’s prior written approval (anonymized LinkedIn story optional: [ ] Yes  [ ] No). Term runs from Effective Date through Pilot End Date unless extended in writing. Either party may terminate for convenience with seven (7) days’ written notice; Client pays for work performed. Upon successful pilot, parties may discuss a monthly Comp Engineering retainer or future SaaS access under a separate agreement. Governing law: State of Colorado, USA (or Client’s HQ state if mutually amended).",
          { size: 15, spaceAfter: 100 }
        ),

        heading("11. Acceptance"),
        p("By signing below, the parties agree to this Statement of Work.", {
          size: 15,
          spaceAfter: 140,
        }),

        new Table({
          width: { size: 10880, type: WidthType.DXA },
          columnWidths: [5440, 5440],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders,
                  width: { size: 5440, type: WidthType.DXA },
                  children: [
                    p("PROVIDER", { bold: true, size: 15, spaceAfter: 160 }),
                    p("Signature: _______________________________", { size: 15, spaceAfter: 100 }),
                    p("Name: Michael Lopez", { size: 15, spaceAfter: 60 }),
                    p("Title: _______________________________", { size: 15, spaceAfter: 60 }),
                    p("Date: _______________________________", { size: 15, spaceAfter: 30 }),
                  ],
                }),
                new TableCell({
                  borders: noBorders,
                  width: { size: 5440, type: WidthType.DXA },
                  children: [
                    p("CLIENT", { bold: true, size: 15, spaceAfter: 160 }),
                    p("Signature: _______________________________", { size: 15, spaceAfter: 100 }),
                    p("Name: _______________________________", { size: 15, spaceAfter: 60 }),
                    p("Title: _______________________________", { size: 15, spaceAfter: 60 }),
                    p("Date: _______________________________", { size: 15, spaceAfter: 30 }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    },
  ],
});

const outPath = path.join(outDir, "TRA-Design-Partner-Pilot-SOW.docx");
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log("Wrote", outPath);
});
