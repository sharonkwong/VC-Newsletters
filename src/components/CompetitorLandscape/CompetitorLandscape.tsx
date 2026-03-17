import React from "react";
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import type { Competitor } from "../../types/types";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./CompetitorLandscape.module.css";

interface CompetitorLandscapeProps {
  competitors: Competitor[];
}

const momentumConfig = {
  rising: {
    icon: <TrendingUp size={14} />,
    label: "Rising",
    color: COLORS.status.success,
    bg: COLORS.status.successBg,
    dotColor: "#e41d26",
  },
  stable: {
    icon: <Minus size={14} />,
    label: "Stable",
    color: COLORS.gray[500],
    bg: COLORS.gray[100],
    dotColor: "#ffa500",
  },
  declining: {
    icon: <TrendingDown size={14} />,
    label: "Declining",
    color: COLORS.primary,
    bg: COLORS.primaryLight,
    dotColor: COLORS.gray[500],
  },
};

function calculatePosition(comp: Competitor, index: number, total: number): { x: number; y: number } {
  // Y axis: momentum (rising = top, declining = bottom)
  // Y axis: momentum (rising = top, declining = bottom) — keep away from corners (20-80%)
  const momentumY = { rising: 20 + Math.random() * 20, stable: 38 + Math.random() * 20, declining: 60 + Math.random() * 18 };
  const y = momentumY[comp.momentum];

  // X axis: stage maturity (later stage / public = right, early = left) — keep away from corners (18-82%)
  const stageLower = comp.stage.toLowerCase();
  let baseX = 50;
  if (stageLower.includes("public") || stageLower.includes("ipo")) baseX = 68 + Math.random() * 12;
  else if (stageLower.includes("series c") || stageLower.includes("series d") || stageLower.includes("late")) baseX = 58 + Math.random() * 12;
  else if (stageLower.includes("series b")) baseX = 42 + Math.random() * 14;
  else if (stageLower.includes("series a")) baseX = 28 + Math.random() * 14;
  else if (stageLower.includes("seed")) baseX = 18 + Math.random() * 12;
  else baseX = 25 + (index / total) * 50;

  return { x: Math.min(82, Math.max(18, baseX)), y: Math.min(80, Math.max(20, y)) };
}

const CompetitorLandscape: React.FC<CompetitorLandscapeProps> = ({ competitors }) => {
  const sorted = [...competitors].sort((a, b) => {
    const order = { rising: 0, stable: 1, declining: 2 };
    if (order[a.momentum] !== order[b.momentum]) return order[a.momentum] - order[b.momentum];
    return b.newsCount - a.newsCount;
  });

  const positions = React.useMemo(
    () => competitors.map((c, i) => ({ ...c, pos: calculatePosition(c, i, competitors.length) })),
    [competitors]
  );

  return (
    <SectionCard title="Competitor Landscape" icon={<Target size={20} />}>
      {/* Legend — above matrix, center aligned */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: "#e41d26" }} />
          <span style={{ color: COLORS.gray[500] }}>High Momentum</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: "#ffa500" }} />
          <span style={{ color: COLORS.gray[500] }}>Medium Momentum</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: COLORS.gray[500] }} />
          <span style={{ color: COLORS.gray[500] }}>Low Momentum</span>
        </div>
      </div>

      {/* 2x2 Matrix */}
      <div className={styles.matrix}>
        <div className={styles.axisLabelY}>Emerging ← → Established</div>
        <div className={styles.axisLabelXTop}>High News Momentum ↑</div>
        <div className={styles.axisLabelXBottom}>↓ Low News Momentum</div>

        <div className={styles.crosshairV} />
        <div className={styles.crosshairH} />

        <div className={`${styles.quadrantLabel} ${styles.quadrantTL}`} style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}>
          Rising Stars
        </div>
        <div className={`${styles.quadrantLabel} ${styles.quadrantTR}`} style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}>
          Market Leaders
        </div>
        <div className={`${styles.quadrantLabel} ${styles.quadrantBL}`} style={{ backgroundColor: COLORS.gray[100], color: COLORS.gray[500] }}>
          Early Stage
        </div>
        <div className={`${styles.quadrantLabel} ${styles.quadrantBR}`} style={{ backgroundColor: COLORS.gray[100], color: COLORS.gray[500] }}>
          Established Players
        </div>

        {positions.map((comp) => {
          const mConfig = momentumConfig[comp.momentum];
          return (
            <div
              key={comp.name}
              className={styles.dot}
              style={{ left: `${comp.pos.x}%`, top: `${comp.pos.y}%` }}
            >
              <div className={styles.dotCircle} style={{ backgroundColor: mConfig.dotColor }} />
              <div className={styles.dotLabel} style={{ color: COLORS.black }}>
                {comp.name}
              </div>
              <div className={styles.tooltip}>
                <div className={styles.tooltipName} style={{ color: COLORS.black }}>{comp.name}</div>
                <div className={styles.tooltipDesc} style={{ color: COLORS.gray[500] }}>{comp.description}</div>
                <div className={styles.tooltipFunding} style={{ color: COLORS.primary }}>
                  {comp.funding}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card grid detail */}
      <h4 className={styles.detailHeading} style={{ color: COLORS.black, fontFamily: FONTS.heading }}>
        Detailed Breakdown
      </h4>
      <div className={styles.grid}>
        {sorted.map((comp) => {
          const mConfig = momentumConfig[comp.momentum];
          return (
            <div key={comp.name} className={styles.competitorCard}>
              <div className={styles.cardHeader}>
                <h4 className={styles.name} style={{ color: COLORS.black, fontFamily: FONTS.heading }}>
                  {comp.name}
                </h4>
                <span
                  className={styles.momentum}
                  style={{ color: mConfig.color, backgroundColor: mConfig.bg }}
                >
                  {mConfig.icon}
                  {mConfig.label}
                </span>
              </div>
              <p className={styles.description} style={{ color: COLORS.gray[600], fontFamily: FONTS.body }}>
                {comp.description}
              </p>
              <div className={styles.meta}>
                <span className={styles.metaItem} style={{ color: COLORS.gray[500], fontFamily: FONTS.body }}>
                  <span className={styles.metaLabel}>Funding:</span> {comp.funding}
                </span>
                <span className={styles.metaItem} style={{ color: COLORS.gray[500], fontFamily: FONTS.body }}>
                  <span className={styles.metaLabel}>Stage:</span> {comp.stage}
                </span>
                <span className={styles.metaItem} style={{ color: COLORS.gray[500], fontFamily: FONTS.body }}>
                  <span className={styles.metaLabel}>Mentions:</span> {comp.newsCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default CompetitorLandscape;
