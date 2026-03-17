import React from "react";
import { Sparkles, Flame, TrendingUp, Star } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import type { EmergingCompany } from "../../types/types";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./EmergingCompanies.module.css";

interface EmergingCompaniesProps {
  companies: EmergingCompany[];
}

const trendConfig = {
  accelerating: {
    icon: <Flame size={12} />,
    label: "Accelerating",
    color: "#ea580c",
    bg: "#fff7ed",
  },
  growing: {
    icon: <TrendingUp size={12} />,
    label: "Growing",
    color: COLORS.status.success,
    bg: COLORS.status.successBg,
  },
  new: {
    icon: <Sparkles size={12} />,
    label: "New",
    color: COLORS.status.trending,
    bg: COLORS.status.trendingBg,
  },
};

const EmergingCompanies: React.FC<EmergingCompaniesProps> = ({ companies }) => {
  return (
    <SectionCard title="Emerging Companies" icon={<Star size={20} />}>
      <div className={styles.grid}>
        {companies.map((company) => {
          const trend = trendConfig[company.mentionTrend];
          return (
            <div key={company.name} className={styles.card}>
              <div className={styles.cardHeader}>
                <h4 className={styles.name} style={{ color: COLORS.black, fontFamily: FONTS.heading }}>
                  {company.name}
                </h4>
                <span
                  className={styles.trendBadge}
                  style={{ color: trend.color, backgroundColor: trend.bg }}
                >
                  {trend.icon}
                  {trend.label}
                </span>
              </div>
              <p className={styles.sector} style={{ color: COLORS.status.info, fontFamily: FONTS.body }}>
                {company.sector}
              </p>
              <p className={styles.description} style={{ color: COLORS.gray[600], fontFamily: FONTS.body }}>
                {company.description}
              </p>
              <div className={styles.signals}>
                {company.signals.map((signal, i) => (
                  <span
                    key={i}
                    className={styles.signal}
                    style={{
                      backgroundColor: COLORS.gray[100],
                      color: COLORS.gray[600],
                      fontFamily: FONTS.body,
                    }}
                  >
                    {signal}
                  </span>
                ))}
              </div>
              <div className={styles.metaRow} style={{ color: COLORS.gray[500], fontFamily: FONTS.body }}>
                <span className={styles.metaItem}>
                  <span className={styles.metaLabel}>Stage:</span> {company.fundingStage}
                </span>
                <span className={styles.metaItem}>
                  <span className={styles.metaLabel}>Founded:</span> {company.foundedYear}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default EmergingCompanies;
