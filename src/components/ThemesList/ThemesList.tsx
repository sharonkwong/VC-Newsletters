import React from "react";
import { Zap } from "lucide-react";
import { FONTS } from "../../constants/constants";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./ThemesList.module.css";

interface ThemesListProps {
  themes: string[];
}

const PILL_COLORS = [
  { bg: "#eff6ff", text: "#2563eb" },
  { bg: "#f5f3ff", text: "#7c3aed" },
  { bg: "#f0fdf4", text: "#16a34a" },
  { bg: "#fffbeb", text: "#d97706" },
  { bg: "#fff5f5", text: "#e41d26" },
  { bg: "#ecfeff", text: "#0891b2" },
];

const ThemesList: React.FC<ThemesListProps> = ({ themes }) => {
  return (
    <SectionCard title="Key Themes" icon={<Zap size={20} />}>
      <div className={styles.container}>
        {themes.map((theme, index) => {
          const color = PILL_COLORS[index % PILL_COLORS.length];
          return (
            <span
              key={index}
              className={styles.pill}
              style={{
                backgroundColor: color.bg,
                color: color.text,
                fontFamily: FONTS.body,
              }}
            >
              {theme}
            </span>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default ThemesList;
