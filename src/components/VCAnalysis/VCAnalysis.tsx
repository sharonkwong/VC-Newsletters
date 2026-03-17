import React from "react";
import { BarChart3, Sparkles } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./VCAnalysis.module.css";

interface VCAnalysisProps {
  landscape: string;
  currentState: string;
  predictions: string;
  investmentInsights: string;
}

function formatParagraph(text: string, textColor: string): React.ReactNode[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences.map((sentence, i) => {
    const formatted = sentence
      .replace(/(\$[\d,.]+[BMK]?(?:\+)?)/g, "**$1**")
      .replace(/([\d,.]+%(?:\+)?)/g, "**$1**")
      .replace(/(\d+-?\d*x?\s*(?:fold|years?|months?))/gi, "**$1**")
      .replace(/\((\d+)\)/g, "(**$1**)")
      .replace(/^([^:]{3,40}):\s/, "**$1:** ");

    const parts = formatted.split(/\*\*(.+?)\*\*/g);
    const elements = parts.map((part, j) =>
      j % 2 === 1
        ? React.createElement("strong", { key: j, style: { color: COLORS.black } }, part)
        : part
    );

    return React.createElement(
      "li",
      { key: i, className: styles.bulletItem, style: { color: textColor, fontFamily: FONTS.body } },
      ...elements
    );
  });
}

const VCAnalysis: React.FC<VCAnalysisProps> = ({ landscape, currentState, predictions, investmentInsights }) => {
  return (
    <SectionCard title="Venture Capital Analysis" icon={<BarChart3 size={20} />}>
      <div className={styles.grid}>
        {/* 1. Market Landscape */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle} style={{ color: COLORS.primary, fontFamily: FONTS.heading }}>
            1. Market Landscape
          </h4>
          <ul className={styles.bulletList}>
            {formatParagraph(landscape, COLORS.gray[600])}
          </ul>
        </div>

        {/* 2. Current State */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle} style={{ color: COLORS.primary, fontFamily: FONTS.heading }}>
            2. Current State
          </h4>
          <ul className={styles.bulletList}>
            {formatParagraph(currentState, COLORS.gray[600])}
          </ul>
        </div>

        {/* 3. AI-Predicted Trends */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle} style={{ color: COLORS.primary, fontFamily: FONTS.heading }}>
            3. AI-Predicted Trends
          </h4>
          <ul className={styles.bulletList}>
            {formatParagraph(predictions, COLORS.gray[600])}
          </ul>
          <div className={styles.aiBadgeRow}>
            <span
              className={styles.aiBadge}
              style={{ backgroundColor: COLORS.status.warningBg, color: COLORS.status.warning }}
            >
              <Sparkles size={10} />
              AI-generated projection based on scraped data
            </span>
          </div>
        </div>

        {/* 4. Investment Insights */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle} style={{ color: COLORS.primary, fontFamily: FONTS.heading }}>
            4. Investment Insights
          </h4>
          <ul className={styles.bulletList}>
            {formatParagraph(investmentInsights, COLORS.gray[600])}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
};

export default VCAnalysis;
