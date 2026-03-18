import { List } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import type { Newsletter } from "../../types/types";
import styles from "./TableOfContents.module.css";

interface TableOfContentsProps {
  newsletter: Newsletter;
}

interface TocItem {
  id: string;
  label: string;
  show: boolean;
}

export default function TableOfContents({ newsletter }: TableOfContentsProps) {
  const items: TocItem[] = [
    { id: "executive-summary", label: "Executive Summary", show: true },
    { id: "key-themes", label: "Key Themes", show: true },
    { id: "market-landscape", label: "VC Analysis", show: true },
    { id: "competitor-landscape", label: "Competitor Landscape", show: newsletter.competitors.length > 0 },
    { id: "emerging-companies", label: "Emerging Startups", show: newsletter.emergingCompanies.length > 0 },
    { id: "consensus-contrarian", label: "Consensus vs. Contrarian", show: true },
    { id: "top-insights", label: "Top Insights", show: newsletter.topPeople.length > 0 || newsletter.topProducts.length > 0 || newsletter.topCompanies.length > 0 },
    { id: "sources", label: "Sources & References", show: true },
    { id: "saved-notes", label: "Saved Notes", show: true },
  ];

  const visibleItems = items.filter((item) => item.show);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; // sticky header height + padding
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - headerOffset, behavior: "smooth" });
    }
  };

  return (
    <nav className={styles.nav} style={{ fontFamily: FONTS.body }}>
      <div className={styles.header}>
        <List size={14} style={{ color: COLORS.gray[400] }} />
        <span className={styles.title} style={{ color: COLORS.gray[500] }}>Contents</span>
      </div>
      <ul className={styles.list}>
        {visibleItems.map((item) => (
          <li key={item.id}>
            <button
              className={styles.link}
              onClick={() => handleClick(item.id)}
              style={{ color: COLORS.gray[600] }}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
