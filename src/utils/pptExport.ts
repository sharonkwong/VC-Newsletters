import PptxGenJS from "pptxgenjs";
import type { Newsletter } from "../types/types";
import { formatDateInTimezone } from "./timezone";

const PRIMARY = "E41D26";
const BLACK = "1A1A1A";
const GRAY = "6B6B6B";
const LIGHT_GRAY = "E5E5E5";
const WHITE = "FFFFFF";
const BG = "FDFAF2";
const BLUE = "2563EB";
const AMBER = "D97706";
const GREEN = "16A34A";

function addTitleBar(slide: PptxGenJS.Slide, title: string) {
  // Red accent bar
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.08,
    h: "100%",
    fill: { color: PRIMARY },
  });

  // Title
  slide.addText(title, {
    x: 0.6,
    y: 0.35,
    w: 8.5,
    h: 0.5,
    fontSize: 24,
    fontFace: "Helvetica",
    bold: true,
    color: BLACK,
  });

  // Bottom line
  slide.addShape("line", {
    x: 0.6,
    y: 0.9,
    w: 8.8,
    h: 0,
    line: { color: LIGHT_GRAY, width: 1 },
  });
}

function addSlideWithBg(pptx: PptxGenJS): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  slide.background = { color: WHITE };
  return slide;
}

export async function generateNewsletterPPT(newsletter: Newsletter): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "News Intelligence — Emerson Collective";
  pptx.title = `${newsletter.topic} — Intelligence Report`;

  // ========== SLIDE 1: Title Slide ==========
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: WHITE };

  // Red accent block
  titleSlide.addShape("rect", {
    x: 0,
    y: 0,
    w: 0.15,
    h: "100%",
    fill: { color: PRIMARY },
  });

  titleSlide.addText(newsletter.topic, {
    x: 0.8,
    y: 1.8,
    w: 8,
    h: 1.2,
    fontSize: 40,
    fontFace: "Helvetica",
    bold: true,
    color: BLACK,
  });

  titleSlide.addText("Intelligence Report", {
    x: 0.8,
    y: 3.0,
    w: 8,
    h: 0.5,
    fontSize: 20,
    fontFace: "Helvetica",
    color: GRAY,
  });

  titleSlide.addShape("line", {
    x: 0.8,
    y: 3.7,
    w: 2.5,
    h: 0,
    line: { color: PRIMARY, width: 3 },
  });

  titleSlide.addText(`${formatDateInTimezone(newsletter.generatedDate)}  |  ${newsletter.frequency}`, {
    x: 0.8,
    y: 4.0,
    w: 8,
    h: 0.4,
    fontSize: 12,
    fontFace: "Helvetica",
    color: GRAY,
  });

  titleSlide.addText("News Intelligence  —  Emerson Collective", {
    x: 0.8,
    y: 6.6,
    w: 8,
    h: 0.3,
    fontSize: 10,
    fontFace: "Helvetica",
    color: GRAY,
    italic: true,
  });

  // ========== SLIDE 2: Executive Summary ==========
  const execSlide = addSlideWithBg(pptx);
  addTitleBar(execSlide, "Executive Summary");

  const bulletCount = newsletter.executiveSummary.length;
  const availableHeight = 5.8;
  const bulletSpacing = bulletCount > 1 ? availableHeight / bulletCount : 1.1;

  newsletter.executiveSummary.forEach((bullet, i) => {
    const yStart = 1.2 + i * bulletSpacing;

    // Number circle
    execSlide.addShape("ellipse", {
      x: 0.6,
      y: yStart,
      w: 0.38,
      h: 0.38,
      fill: { color: PRIMARY },
    });

    execSlide.addText(`${i + 1}`, {
      x: 0.6,
      y: yStart,
      w: 0.38,
      h: 0.38,
      fontSize: 13,
      fontFace: "Helvetica",
      bold: true,
      color: WHITE,
      align: "center",
      valign: "middle",
    });

    execSlide.addText(bullet, {
      x: 1.2,
      y: yStart - 0.05,
      w: 10.5,
      h: bulletSpacing - 0.15,
      fontSize: 13,
      fontFace: "Helvetica",
      color: BLACK,
      lineSpacingMultiple: 1.3,
      valign: "top",
    });
  });

  // ========== SLIDE 3: Key Themes ==========
  const themesSlide = addSlideWithBg(pptx);
  addTitleBar(themesSlide, "Key Themes");

  newsletter.themes.forEach((theme, i) => {
    const yStart = 1.2 + i * 0.8;

    themesSlide.addShape("rect", {
      x: 0.6,
      y: yStart,
      w: 8.8,
      h: 0.6,
      fill: { color: BG },
      rectRadius: 0.05,
    });

    themesSlide.addShape("rect", {
      x: 0.6,
      y: yStart,
      w: 0.06,
      h: 0.6,
      fill: { color: PRIMARY },
    });

    themesSlide.addText(theme, {
      x: 0.85,
      y: yStart,
      w: 8.4,
      h: 0.6,
      fontSize: 13,
      fontFace: "Helvetica",
      color: BLACK,
      valign: "middle",
    });
  });

  // ========== SLIDE 4: Venture Capital Analysis (2x2 quadrant) ==========
  const vcSlide = addSlideWithBg(pptx);
  addTitleBar(vcSlide, "Venture Capital Analysis");

  const quadGap = 0.15;
  const qLeft = 0.15;
  const quadW = (13.04 - quadGap) / 2;
  const qRight = qLeft + quadW + quadGap;
  const qTop = 1.05;
  const quadH = 2.7;
  const qBottom = qTop + quadH + quadGap;

  const splitToBullets = (text: string, max: number): string => {
    const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    return sentences.slice(0, max).map((s) => `•  ${s}`).join("\n");
  };

  // Quadrant backgrounds
  const quadrants = [
    { x: qLeft, y: qTop, title: "1. Market Landscape", content: splitToBullets(newsletter.landscape, 4) },
    { x: qRight, y: qTop, title: "2. Current State", content: splitToBullets(newsletter.currentState, 4) },
    { x: qLeft, y: qBottom, title: "3. AI-Predicted Trends", content: splitToBullets(newsletter.predictions, 4) },
    { x: qRight, y: qBottom, title: "4. Investment Insights", content: splitToBullets(newsletter.investmentInsights, 4) },
  ];

  quadrants.forEach((q) => {
    // Card background
    vcSlide.addShape("rect", {
      x: q.x,
      y: q.y,
      w: quadW,
      h: quadH,
      fill: { color: BG },
      rectRadius: 0.06,
      line: { color: LIGHT_GRAY, width: 0.5 },
    });

    // Title
    vcSlide.addText(q.title, {
      x: q.x + 0.2,
      y: q.y + 0.12,
      w: quadW - 0.4,
      h: 0.3,
      fontSize: 12,
      fontFace: "Helvetica",
      bold: true,
      color: PRIMARY,
    });

    // Bullet content
    vcSlide.addText(q.content, {
      x: q.x + 0.2,
      y: q.y + 0.5,
      w: quadW - 0.4,
      h: quadH - 0.65,
      fontSize: 9,
      fontFace: "Helvetica",
      color: BLACK,
      lineSpacingMultiple: 1.3,
      valign: "top",
    });
  });

  // ========== SLIDE 5: Competitor Landscape ==========
  if (newsletter.competitors.length > 0) {
    const compSlide = addSlideWithBg(pptx);
    addTitleBar(compSlide, "Competitor Landscape");

    // Table header
    const tableRows: PptxGenJS.TableRow[] = [
      [
        { text: "Company", options: { bold: true, color: WHITE, fill: { color: PRIMARY }, fontSize: 12, fontFace: "Helvetica", valign: "middle" } },
        { text: "Description", options: { bold: true, color: WHITE, fill: { color: PRIMARY }, fontSize: 12, fontFace: "Helvetica", valign: "middle" } },
        { text: "Momentum", options: { bold: true, color: WHITE, fill: { color: PRIMARY }, fontSize: 12, fontFace: "Helvetica", valign: "middle" } },
        { text: "Funding", options: { bold: true, color: WHITE, fill: { color: PRIMARY }, fontSize: 12, fontFace: "Helvetica", valign: "middle" } },
        { text: "Stage", options: { bold: true, color: WHITE, fill: { color: PRIMARY }, fontSize: 12, fontFace: "Helvetica", valign: "middle" } },
      ],
    ];

    newsletter.competitors.forEach((c, i) => {
      const bgColor = i % 2 === 0 ? WHITE : BG;
      const momentumColor = c.momentum === "rising" ? GREEN : c.momentum === "declining" ? PRIMARY : GRAY;
      tableRows.push([
        { text: c.name, options: { bold: true, fontSize: 11, fontFace: "Helvetica", color: BLACK, fill: { color: bgColor }, valign: "middle" } },
        { text: c.description, options: { fontSize: 10, fontFace: "Helvetica", color: GRAY, fill: { color: bgColor }, valign: "middle" } },
        { text: c.momentum.charAt(0).toUpperCase() + c.momentum.slice(1), options: { fontSize: 11, fontFace: "Helvetica", color: momentumColor, bold: true, fill: { color: bgColor }, valign: "middle" } },
        { text: c.funding, options: { fontSize: 11, fontFace: "Helvetica", color: BLACK, fill: { color: bgColor }, valign: "middle" } },
        { text: c.stage, options: { fontSize: 11, fontFace: "Helvetica", color: BLACK, fill: { color: bgColor }, valign: "middle" } },
      ]);
    });

    compSlide.addTable(tableRows, {
      x: 0.4,
      y: 1.2,
      w: 12.2,
      border: { type: "solid", pt: 0.5, color: LIGHT_GRAY },
      colW: [2.0, 5.0, 1.6, 1.8, 1.8],
      rowH: 0.6,
    });
  }

  // ========== SLIDE 6: Emerging Companies ==========
  if (newsletter.emergingCompanies.length > 0) {
    const emSlide = addSlideWithBg(pptx);
    addTitleBar(emSlide, "Emerging Startups");

    newsletter.emergingCompanies.forEach((company, i) => {
      const yStart = 1.2 + i * 1.3;
      const cardW = 8.8;

      emSlide.addShape("rect", {
        x: 0.6,
        y: yStart,
        w: cardW,
        h: 1.1,
        fill: { color: BG },
        rectRadius: 0.05,
      });

      emSlide.addText(company.name, {
        x: 0.8,
        y: yStart + 0.08,
        w: 4,
        h: 0.3,
        fontSize: 14,
        fontFace: "Helvetica",
        bold: true,
        color: BLACK,
      });

      const trendColor = company.mentionTrend === "accelerating" ? PRIMARY : company.mentionTrend === "growing" ? GREEN : BLUE;
      emSlide.addText(company.mentionTrend.toUpperCase(), {
        x: 7.5,
        y: yStart + 0.08,
        w: 1.7,
        h: 0.3,
        fontSize: 9,
        fontFace: "Helvetica",
        bold: true,
        color: trendColor,
        align: "right",
      });

      emSlide.addText(company.description, {
        x: 0.8,
        y: yStart + 0.4,
        w: 8.4,
        h: 0.3,
        fontSize: 10,
        fontFace: "Helvetica",
        color: GRAY,
      });

      emSlide.addText(`${company.fundingStage}  |  Founded ${company.foundedYear}  |  ${company.sector}`, {
        x: 0.8,
        y: yStart + 0.72,
        w: 8.4,
        h: 0.25,
        fontSize: 9,
        fontFace: "Helvetica",
        color: GRAY,
        italic: true,
      });
    });
  }

  // ========== SLIDE 7: Consensus vs. Contrarian ==========
  if (newsletter.consensus.length > 0 || newsletter.contrarian.length > 0) {
    const ccSlide = addSlideWithBg(pptx);
    addTitleBar(ccSlide, "Consensus vs. Contrarian Views");

    const colW = 5.8;
    const colRight = 0.6 + colW + 0.25;

    // Consensus header
    ccSlide.addText("CONSENSUS", {
      x: 0.6,
      y: 1.15,
      w: colW,
      h: 0.35,
      fontSize: 12,
      fontFace: "Helvetica",
      bold: true,
      color: BLUE,
    });

    newsletter.consensus.forEach((v, i) => {
      const yStart = 1.6 + i * 1.35;
      ccSlide.addShape("rect", {
        x: 0.6,
        y: yStart,
        w: colW,
        h: 1.15,
        fill: { color: "EFF6FF" },
        rectRadius: 0.05,
      });
      ccSlide.addText(v.title, {
        x: 0.75,
        y: yStart + 0.08,
        w: colW - 0.3,
        h: 0.3,
        fontSize: 11,
        fontFace: "Helvetica",
        bold: true,
        color: BLACK,
      });
      ccSlide.addText(v.description, {
        x: 0.75,
        y: yStart + 0.4,
        w: colW - 0.3,
        h: 0.65,
        fontSize: 9,
        fontFace: "Helvetica",
        color: GRAY,
        lineSpacingMultiple: 1.3,
        valign: "top",
      });
    });

    // Contrarian header
    ccSlide.addText("CONTRARIAN", {
      x: colRight,
      y: 1.15,
      w: colW,
      h: 0.35,
      fontSize: 12,
      fontFace: "Helvetica",
      bold: true,
      color: AMBER,
    });

    newsletter.contrarian.forEach((v, i) => {
      const yStart = 1.6 + i * 1.35;
      ccSlide.addShape("rect", {
        x: colRight,
        y: yStart,
        w: colW,
        h: 1.15,
        fill: { color: "FFFBEB" },
        rectRadius: 0.05,
      });
      ccSlide.addText(v.title, {
        x: colRight + 0.15,
        y: yStart + 0.08,
        w: colW - 0.3,
        h: 0.3,
        fontSize: 11,
        fontFace: "Helvetica",
        bold: true,
        color: BLACK,
      });
      ccSlide.addText(v.description, {
        x: colRight + 0.15,
        y: yStart + 0.4,
        w: colW - 0.3,
        h: 0.65,
        fontSize: 9,
        fontFace: "Helvetica",
        color: GRAY,
        lineSpacingMultiple: 1.3,
        valign: "top",
      });
    });
  }

  // ========== SLIDE 8: Top Insights ==========
  const hasInsights = newsletter.topPeople.length > 0 || newsletter.topProducts.length > 0 || newsletter.topCompanies.length > 0;
  if (hasInsights) {
    const topSlide = addSlideWithBg(pptx);
    addTitleBar(topSlide, "Top Insights");

    const colW = 3.8;
    const gap = 0.25;
    const categories = [
      { title: "KEY PEOPLE", items: newsletter.topPeople, x: 0.6 },
      { title: "KEY PRODUCTS", items: newsletter.topProducts, x: 0.6 + colW + gap },
      { title: "KEY COMPANIES", items: newsletter.topCompanies, x: 0.6 + (colW + gap) * 2 },
    ];

    categories.forEach((cat) => {
      topSlide.addText(cat.title, {
        x: cat.x,
        y: 1.2,
        w: colW,
        h: 0.3,
        fontSize: 10,
        fontFace: "Helvetica",
        bold: true,
        color: PRIMARY,
      });

      cat.items.slice(0, 4).forEach((item, i) => {
        const yStart = 1.6 + i * 1.25;

        topSlide.addShape("rect", {
          x: cat.x,
          y: yStart,
          w: colW,
          h: 1.1,
          fill: { color: BG },
          rectRadius: 0.05,
        });

        topSlide.addText(item.name, {
          x: cat.x + 0.15,
          y: yStart + 0.08,
          w: colW - 0.3,
          h: 0.28,
          fontSize: 11,
          fontFace: "Helvetica",
          bold: true,
          color: BLACK,
        });

        topSlide.addText(item.detail, {
          x: cat.x + 0.15,
          y: yStart + 0.38,
          w: colW - 0.3,
          h: 0.62,
          fontSize: 9,
          fontFace: "Helvetica",
          color: GRAY,
          lineSpacingMultiple: 1.3,
          valign: "top",
        });
      });
    });
  }

  // ========== Sources slides (10 per slide) ==========
  const PER_PAGE = 10;
  const totalSources = newsletter.sources.length;
  const totalPages = Math.ceil(totalSources / PER_PAGE);

  for (let page = 0; page < totalPages; page++) {
    const srcSlide = addSlideWithBg(pptx);
    addTitleBar(srcSlide, "Sources");

    const headerRow: PptxGenJS.TableRow = [
      { text: "#", options: { bold: true, color: WHITE, fill: { color: PRIMARY }, fontSize: 10, fontFace: "Helvetica", align: "center", valign: "middle" } },
      { text: "Title", options: { bold: true, color: WHITE, fill: { color: PRIMARY }, fontSize: 10, fontFace: "Helvetica", valign: "middle" } },
      { text: "Source", options: { bold: true, color: WHITE, fill: { color: PRIMARY }, fontSize: 10, fontFace: "Helvetica", valign: "middle" } },
    ];

    const srcRows: PptxGenJS.TableRow[] = [headerRow];
    const start = page * PER_PAGE;
    const end = Math.min(start + PER_PAGE, totalSources);

    for (let i = start; i < end; i++) {
      const s = newsletter.sources[i];
      const bgColor = (i - start) % 2 === 0 ? WHITE : BG;
      const hasUrl = s.url && s.url !== "#";
      srcRows.push([
        { text: `${i + 1}`, options: { fontSize: 9, fontFace: "Helvetica", color: GRAY, fill: { color: bgColor }, align: "center", valign: "middle" } },
        {
          text: s.title,
          options: {
            fontSize: 9,
            fontFace: "Helvetica",
            color: hasUrl ? "2563EB" : BLACK,
            fill: { color: bgColor },
            underline: { style: hasUrl ? "sng" as const : "none" as const },
            hyperlink: hasUrl ? { url: s.url } : undefined,
            valign: "middle",
          },
        },
        { text: s.type, options: { fontSize: 9, fontFace: "Helvetica", color: GRAY, fill: { color: bgColor }, valign: "middle" } },
      ]);
    }

    srcSlide.addTable(srcRows, {
      x: 0.6,
      y: 1.2,
      w: 9.0,
      border: { type: "solid", pt: 0.5, color: LIGHT_GRAY },
      colW: [0.6, 6.2, 2.2],
      rowH: 0.55,
    });
  }

  // ========== Save ==========
  const slug = newsletter.topic.toLowerCase().replace(/\s+/g, "-");
  const date = new Date().toISOString().split("T")[0];
  await pptx.writeFile({ fileName: `${slug}-intelligence-${date}.pptx` });
}
