import React, { useState } from "react";
import { Users, Package, Building2, Lightbulb } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import type { TopEntity } from "../../types/types";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./TopInsights.module.css";

interface TopInsightsProps {
  people: TopEntity[];
  products: TopEntity[];
  companies: TopEntity[];
}

type TabKey = "people" | "products" | "companies";

const tabConfig: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "people", label: "People", icon: <Users size={15} /> },
  { key: "products", label: "Products", icon: <Package size={15} /> },
  { key: "companies", label: "Companies", icon: <Building2 size={15} /> },
];

const TopInsights: React.FC<TopInsightsProps> = ({ people, products, companies }) => {
  const [activeTab, setActiveTab] = useState<TabKey>("people");

  const data: Record<TabKey, TopEntity[]> = { people, products, companies };
  const items = data[activeTab];

  return (
    <SectionCard title="Top Insights" icon={<Lightbulb size={20} />}>
      <div className={styles.tabs}>
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
            style={{
              color: activeTab === tab.key ? COLORS.primary : COLORS.gray[500],
              fontFamily: FONTS.body,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.list}>
        {items.map((entity, i) => (
          <div key={i} className={styles.entity}>
            <div className={styles.entityInfo}>
              <h4 className={styles.entityName} style={{ color: COLORS.black, fontFamily: FONTS.body }}>
                {entity.name}
              </h4>
              <p className={styles.entityDetail} style={{ color: COLORS.gray[600], fontFamily: FONTS.body }}>
                {entity.detail}
              </p>
            </div>
            <span
              className={styles.relevance}
              style={{
                backgroundColor: COLORS.status.trendingBg,
                color: COLORS.status.trending,
                fontFamily: FONTS.body,
              }}
            >
              {entity.relevance}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default TopInsights;
