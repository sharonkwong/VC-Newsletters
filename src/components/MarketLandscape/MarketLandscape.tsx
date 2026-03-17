import React from "react";
import { Globe } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./MarketLandscape.module.css";

interface MarketLandscapeProps {
  landscape: string;
  currentState: string;
}

function formatParagraph(text: string): React.ReactNode[] {
  // Split on sentence boundaries, group into bullet points
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences.map((sentence, i) => {
    // Bold key patterns: numbers/percentages, dollar amounts, and the first few words before a colon or dash
    const formatted = sentence
      // Bold dollar amounts and percentages
      .replace(/(\$[\d,.]+[BMK]?(?:\+)?)/g, "**$1**")
      .replace(/([\d,.]+%(?:\+)?)/g, "**$1**")
      // Bold numbers with context like "20 articles" or "3-5x"
      .replace(/(\d+-?\d*x?\s*(?:fold|years?|months?))/gi, "**$1**")
      // Bold text before a colon (if short enough to be a label)
      .replace(/^([^:]{3,40}):\s/, "**$1:** ");

    // Convert **text** to JSX
    const parts = formatted.split(/\*\*(.+?)\*\*/g);
    const elements = parts.map((part, j) =>
      j % 2 === 1
        ? React.createElement("strong", { key: j, style: { color: COLORS.black } }, part)
        : part
    );

    return React.createElement(
      "li",
      { key: i, className: styles.bulletItem, style: { color: COLORS.gray[600], fontFamily: FONTS.body } },
      ...elements
    );
  });
}

const MarketLandscape: React.FC<MarketLandscapeProps> = ({ landscape, currentState }) => {
  return (
    <SectionCard title="Market Landscape" icon={<Globe size={20} />}>
      <div className={styles.sections}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle} style={{ color: COLORS.primary, fontFamily: FONTS.heading }}>
            {/* <BarChart3 size={16} style={{ color: COLORS.status.info }} /> */}
            Market Structure
          </h4>
          <ul className={styles.bulletList}>
            {formatParagraph(landscape)}
          </ul>
        </div>
        <hr className={styles.divider} />
        <div className={styles.section}>
          <h4 className={styles.sectionTitle} style={{ color: COLORS.primary, fontFamily: FONTS.heading }}>
            {/* <TrendingUp size={16} style={{ color: COLORS.status.success }} /> */}
            Current Dynamics
          </h4>
          <ul className={styles.bulletList}>
            {formatParagraph(currentState)}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
};

export default MarketLandscape;
