import React from "react";
import { TrendingUp, Sparkles, BarChart3 } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./InvestmentInsights.module.css";

interface InvestmentInsightsProps {
  insights: string;
  predictions: string;
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

const InvestmentInsights: React.FC<InvestmentInsightsProps> = ({ insights, predictions }) => {
  return (
    <SectionCard title="Investment Insights" icon={<TrendingUp size={20} />}>
      <div className={styles.sections}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle} style={{ color: COLORS.black, fontFamily: FONTS.heading }}>
            <BarChart3 size={16} style={{ color: COLORS.status.success }} />
            Investment Opportunities
          </h4>
          <ul className={styles.bulletList}>
            {formatParagraph(insights, COLORS.gray[600])}
          </ul>
        </div>
        <hr className={styles.divider} />
        <div className={styles.predictionsSection} style={{ backgroundColor: COLORS.status.trendingBg }}>
          <span
            className={styles.aiBadge}
            style={{
              backgroundColor: COLORS.status.trending,
              color: COLORS.white,
              fontFamily: FONTS.body,
            }}
          >
            <Sparkles size={10} />
            AI-Generated
          </span>
          <h4 className={styles.sectionTitle} style={{ color: COLORS.black, fontFamily: FONTS.heading }}>
            AI Predictions
          </h4>
          <ul className={styles.bulletList}>
            {formatParagraph(predictions, COLORS.gray[700])}
          </ul>
          <p className={styles.disclaimer} style={{ color: COLORS.gray[400], fontFamily: FONTS.body }}>
            These predictions are AI-generated and should not be considered financial advice.
            Always conduct your own due diligence before making investment decisions.
          </p>
        </div>
      </div>
    </SectionCard>
  );
};

export default InvestmentInsights;
