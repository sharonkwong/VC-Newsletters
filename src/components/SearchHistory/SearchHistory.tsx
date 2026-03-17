import React from "react";
import { Clock, Trash2, RefreshCw, Search } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import type { HistoryItem } from "../../types/types";
import styles from "./SearchHistory.module.css";

interface SearchHistoryProps {
  history: HistoryItem[];
  selectedId?: string | null;
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onRefresh: (id: string) => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ history, selectedId, onSelect, onDelete, onRefresh }) => {
  const sorted = [...history].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className={styles.container} style={{ fontFamily: FONTS.body }}>
      <h3 className={styles.header} style={{ color: COLORS.black, fontFamily: FONTS.heading }}>
        <Clock size={16} style={{ color: COLORS.gray[500] }} />
        Search History
      </h3>
      <div className={styles.list}>
        {sorted.length === 0 ? (
          <div className={styles.empty}>
            <Search size={24} style={{ color: COLORS.gray[300] }} />
            <p className={styles.emptyText} style={{ color: COLORS.gray[500] }}>
              No search history yet
            </p>
            <p className={styles.emptyHint} style={{ color: COLORS.gray[400] }}>
              Your past research topics will appear here
            </p>
          </div>
        ) : (
          sorted.map((item) => (
            <div
              key={item.id}
              className={`${styles.item} ${selectedId === item.id ? styles.itemSelected : ""}`}
              onClick={() => onSelect(item)}
            >
              <div className={styles.itemInfo}>
                <p className={styles.topic} style={{ color: COLORS.black }}>
                  {item.topic}
                </p>
                <div className={styles.meta}>
                  <span className={styles.date} style={{ color: COLORS.gray[400] }}>
                    {item.date}
                  </span>
                  <span
                    className={styles.freqBadge}
                    style={{
                      backgroundColor: COLORS.primaryLight,
                      color: COLORS.primary,
                    }}
                  >
                    {item.frequency}
                  </span>
                </div>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh(item.id);
                  }}
                  title="Re-run research"
                >
                  <RefreshCw size={14} style={{ color: COLORS.gray[500] }} />
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  title="Delete"
                >
                  <Trash2 size={14} style={{ color: COLORS.gray[500] }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SearchHistory;
