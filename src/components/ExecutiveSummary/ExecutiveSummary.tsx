import React from "react";
import { FileText } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./ExecutiveSummary.module.css";

interface ExecutiveSummaryProps {
  bullets: string[];
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ bullets }) => {
  return (
    <SectionCard title="Executive Summary" icon={<FileText size={20} />}>
      <ol className={styles.list}>
        {bullets.map((bullet, index) => (
          <li key={index} className={styles.item}>
            <span
              className={styles.badge}
              style={{
                backgroundColor: COLORS.primaryLight,
                color: COLORS.primary,
                fontFamily: FONTS.body,
              }}
            >
              {index + 1}
            </span>
            <p className={styles.text} style={{ color: COLORS.gray[700], fontFamily: FONTS.body }}>
              {bullet}
            </p>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
};

export default ExecutiveSummary;
