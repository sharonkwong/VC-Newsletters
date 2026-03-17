import jsPDF from "jspdf";
import type { Newsletter } from "../types/types";
import { formatDateInTimezone } from "./timezone";

const C = {
  primary: [228, 29, 38] as [number, number, number],
  black: [26, 26, 26] as [number, number, number],
  gray: [107, 107, 107] as [number, number, number],
  lightGray: [200, 200, 200] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
};

const M = { left: 14, right: 14, top: 14 };
const PW = 210;
const CW = PW - M.left - M.right;

function wrap(pdf: jsPDF, text: string, x: number, y: number, w: number, lh: number): number {
  for (const line of pdf.splitTextToSize(text, w)) { pdf.text(line, x, y); y += lh; }
  return y;
}

function heading(pdf: jsPDF, title: string, y: number): number {
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...C.primary);
  pdf.text(title.toUpperCase(), M.left, y);
  y += 1.5;
  pdf.setDrawColor(...C.primary);
  pdf.setLineWidth(0.4);
  pdf.line(M.left, y, M.left + CW, y);
  y += 4;
  return y;
}

export function generateNewsletterPDF(newsletter: Newsletter): void {
  const pdf = new jsPDF("p", "mm", "a4");
  const formattedDate = formatDateInTimezone(newsletter.generatedDate);
  let y = M.top;

  // --- Date top-right ---
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...C.gray);
  pdf.text(formattedDate, PW - M.right, y, { align: "right" });

  // --- Title ---
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...C.black);
  pdf.text(newsletter.topic, M.left, y);
  y += 5.5;

  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...C.gray);
  pdf.text("Emerson Collective  |  News Intelligence Report", M.left, y);
  y += 2;
  pdf.setDrawColor(...C.lightGray);
  pdf.setLineWidth(0.2);
  pdf.line(M.left, y, M.left + CW, y);
  y += 7;

  // --- Executive Summary ---
  y = heading(pdf, "Executive Summary", y);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...C.black);
  for (let i = 0; i < newsletter.executiveSummary.length; i++) {
    y = wrap(pdf, `${i + 1}.  ${newsletter.executiveSummary[i]}`, M.left, y, CW, 3.4);
    y += 1;
  }
  y += 4;

  // --- Key Themes ---
  y = heading(pdf, "Key Themes", y);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...C.black);
  for (const theme of newsletter.themes) {
    y = wrap(pdf, `•  ${theme}`, M.left, y, CW, 3.4);
    y += 0.8;
  }
  y += 4;

  // --- Investment Insights ---
  y = heading(pdf, "Investment Insights", y);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...C.black);
  const insightSentences = newsletter.investmentInsights.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  for (const s of insightSentences.slice(0, 4)) {
    y = wrap(pdf, `•  ${s}`, M.left, y, CW, 3.4);
    y += 0.8;
  }
  y += 4;

  // --- AI-Predicted Trends ---
  y = heading(pdf, "AI-Predicted Trends", y);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...C.black);
  const predSentences = newsletter.predictions.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  for (const s of predSentences.slice(0, 4)) {
    y = wrap(pdf, `•  ${s}`, M.left, y, CW, 3.4);
    y += 0.8;
  }
  y += 4;

  // --- Consensus vs. Contrarian Views (two columns) ---
  if (newsletter.consensus.length > 0 || newsletter.contrarian.length > 0) {
    y = heading(pdf, "Consensus vs. Contrarian Views", y);
    const halfW = (CW - 6) / 2;

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...C.blue);
    pdf.text("CONSENSUS", M.left, y);
    pdf.setTextColor(...C.amber);
    pdf.text("CONTRARIAN", M.left + halfW + 6, y);
    y += 3.5;

    const ccStartY = y;
    pdf.setFontSize(7.5);

    let cY = ccStartY;
    pdf.setTextColor(...C.black);
    for (const v of newsletter.consensus.slice(0, 3)) {
      pdf.setFont("helvetica", "bold");
      cY = wrap(pdf, `• ${v.title}`, M.left, cY, halfW, 3);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...C.gray);
      cY = wrap(pdf, v.description, M.left + 2, cY, halfW - 2, 2.8);
      pdf.setTextColor(...C.black);
      cY += 1.5;
    }

    let ctY = ccStartY;
    for (const v of newsletter.contrarian.slice(0, 3)) {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...C.black);
      ctY = wrap(pdf, `• ${v.title}`, M.left + halfW + 6, ctY, halfW, 3);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...C.gray);
      ctY = wrap(pdf, v.description, M.left + halfW + 8, ctY, halfW - 2, 2.8);
      ctY += 1.5;
    }
    y = Math.max(cY, ctY) + 4;
  }

  // --- Top Insights (three columns) ---
  const hasInsights = newsletter.topPeople.length > 0 || newsletter.topProducts.length > 0 || newsletter.topCompanies.length > 0;
  if (hasInsights) {
    y = heading(pdf, "Top Insights: Key Players, Products & Companies", y);
    const colW = (CW - 8) / 3;
    pdf.setFontSize(7.5);
    const tiStartY = y;

    const renderCol = (items: { name: string; detail: string }[], label: string, x: number) => {
      let cy = tiStartY;
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...C.primary);
      pdf.text(label, x, cy);
      cy += 3.5;
      pdf.setTextColor(...C.black);
      for (const item of items.slice(0, 3)) {
        pdf.setFont("helvetica", "bold");
        cy = wrap(pdf, item.name, x, cy, colW, 3);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...C.gray);
        cy = wrap(pdf, item.detail, x, cy, colW, 2.8);
        pdf.setTextColor(...C.black);
        cy += 1.5;
      }
      return cy;
    };

    const pY = renderCol(newsletter.topPeople, "PEOPLE", M.left);
    const prY = renderCol(newsletter.topProducts, "PRODUCTS", M.left + colW + 4);
    const coY = renderCol(newsletter.topCompanies, "COMPANIES", M.left + (colW + 4) * 2);
    y = Math.max(pY, prY, coY) + 2;
  }

  // --- Footer ---
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(...C.gray);
  pdf.text(
    "Generated by News Intelligence (Emerson Collective). AI-generated predictions are labeled accordingly. Confidential — For internal use only.",
    M.left,
    290
  );

  // Save
  const slug = newsletter.topic.toLowerCase().replace(/\s+/g, "-");
  const date = new Date().toISOString().split("T")[0];
  pdf.save(`${slug}-leadership-summary-${date}.pdf`);
}
