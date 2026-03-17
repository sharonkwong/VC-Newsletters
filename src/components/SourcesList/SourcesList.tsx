import React from "react";
import { Globe, ExternalLink, Eye, ArrowUpRight } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import type { Source } from "../../types/types";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./SourcesList.module.css";

interface SourcesListProps {
  sources: Source[];
}

const SourcesList: React.FC<SourcesListProps> = ({ sources }) => {
  return (
    <SectionCard title={`Sources (${sources.length})`} icon={<Globe size={20} />}>
      <div className={styles.list}>
        {sources.map((source, i) => (
          <div key={i} className={styles.source}>
            <div className={styles.sourceLeft}>
              <ExternalLink size={14} style={{ color: COLORS.gray[400], flexShrink: 0 }} />
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceTitle}
                style={{ color: COLORS.status.info, fontFamily: FONTS.body }}
              >
                {source.title}
              </a>
            </div>
            <div className={styles.sourceRight}>
              <span
                className={styles.typeBadge}
                style={{
                  backgroundColor: COLORS.gray[100],
                  color: COLORS.gray[600],
                  fontFamily: FONTS.body,
                }}
              >
                {source.type}
              </span>
              <span className={styles.views} style={{ color: COLORS.gray[500], fontFamily: FONTS.body }}>
                <Eye size={12} />
                {source.views}
              </span>
              {source.trending && (
                <span
                  className={styles.trendingBadge}
                  style={{
                    color: COLORS.status.trending,
                    backgroundColor: COLORS.status.trendingBg,
                    fontFamily: FONTS.body,
                  }}
                >
                  <ArrowUpRight size={10} />
                  Trending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default SourcesList;
