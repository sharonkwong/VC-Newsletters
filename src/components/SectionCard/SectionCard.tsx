import React from "react";
import { COLORS, FONTS } from "../../constants/constants";
import styles from "./SectionCard.module.css";

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children, className }) => {
  return (
    <div className={`${styles.card} ${className ?? ""}`}>
      <div className={styles.header}>
        <span className={styles.icon} style={{ color: COLORS.primary }}>
          {icon}
        </span>
        <h3 className={styles.title} style={{ fontFamily: FONTS.heading, color: COLORS.black }}>
          {title}
        </h3>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export default SectionCard;
