import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const SECTION_IDS = [
  "executive-summary",
  "key-themes",
  "market-landscape",
  "competitor-landscape",
  "emerging-companies",
  "consensus-contrarian",
  "top-insights",
  "sources",
  "saved-notes",
];

export async function generateScreenshot(topic: string): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;
  const maxY = pageHeight - margin;
  let currentY = margin;

  const container = document.getElementById("executive-summary")?.parentElement;
  if (!container) return;

  // Capture title header (hide action buttons)
  const headerEl = container.querySelector("[class*='header']") as HTMLElement | null;
  if (headerEl) {
    const actionsEl = headerEl.querySelector("[class*='headerActions']") as HTMLElement | null;
    if (actionsEl) actionsEl.style.display = "none";

    const canvas = await html2canvas(headerEl, {
      scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff",
    });

    if (actionsEl) actionsEl.style.display = "";

    const imgH = (canvas.height * contentWidth) / canvas.width;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, currentY, contentWidth, imgH);
    currentY += imgH + 4;
  }

  // Expand all saved notes accordions before capturing
  const savedNotesEl = document.getElementById("saved-notes");
  const clickedButtons: HTMLButtonElement[] = [];
  if (savedNotesEl) {
    const buttons = savedNotesEl.querySelectorAll<HTMLButtonElement>("button[class*='noteHeader']");
    for (const btn of buttons) {
      const parent = btn.parentElement;
      const isExpanded = parent ? parent.querySelector("[class*='noteBody']") !== null : false;
      if (!isExpanded) {
        btn.click();
        clickedButtons.push(btn);
      }
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  // Capture each section and stack continuously
  for (const id of SECTION_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;

    const canvas = await html2canvas(el, {
      scale: 2, useCORS: true, logging: false, backgroundColor: "#fdfaf2",
    });

    const imgW = contentWidth;
    const imgH = (canvas.height * imgW) / canvas.width;

    // If it won't fit on the current page, start a new page
    if (currentY + imgH > maxY && currentY > margin + 1) {
      pdf.addPage();
      currentY = margin;
    }

    // If the section is taller than a full page, split it across pages
    if (imgH > maxY - margin) {
      const imgData = canvas.toDataURL("image/png");
      const fullImgHMm = imgH;
      let drawn = 0;

      while (drawn < fullImgHMm) {
        const spaceLeft = maxY - currentY;
        const drawH = Math.min(spaceLeft, fullImgHMm - drawn);

        // Use clipping: position the image so the already-drawn portion is above the page
        pdf.addImage(
          imgData, "PNG",
          margin,
          currentY - drawn,
          imgW,
          fullImgHMm
        );

        // Clip by covering areas outside the visible region with white rectangles
        if (drawn > 0) {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pageWidth, currentY, "F");
        }
        if (currentY + drawH < pageHeight) {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, currentY + drawH, pageWidth, pageHeight - (currentY + drawH), "F");
        }

        drawn += drawH;
        currentY += drawH;

        if (drawn < fullImgHMm) {
          pdf.addPage();
          currentY = margin;
        }
      }
      currentY += 4;
    } else {
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, currentY, imgW, imgH);
      currentY += imgH + 4;
    }
  }

  // Collapse saved notes back to original state
  clickedButtons.forEach((btn) => btn.click());

  const slug = topic.toLowerCase().replace(/\s+/g, "-");
  const date = new Date().toISOString().split("T")[0];
  pdf.save(`${slug}-full-report-${date}.pdf`);
}
