import { Download, Mail, Smartphone } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import { generateNewsletterPDF } from "../../utils/pdfExport";
import type { Newsletter } from "../../types/types";
import styles from "./ExportBar.module.css";

interface ExportBarProps {
  topic: string;
  frequency: string;
  newsletter: Newsletter;
}

export function ExportBar({ topic, frequency, newsletter }: ExportBarProps) {
  const handlePDFExport = () => {
    generateNewsletterPDF(newsletter);
  };

  const handleNotify = (method: "email" | "sms") => {
    alert(
      `Setting up ${method.toUpperCase()} notifications for "${topic}"...\n\nYou will receive ${frequency.toLowerCase()} updates when new intelligence is available.`
    );
  };

  return (
    <div className={styles.bar} style={{ fontFamily: FONTS.body }}>
      <div className={styles.info}>
        <p className={styles.topicName} style={{ color: COLORS.black }}>
          {topic}
        </p>
        <span
          className={styles.freqBadge}
          style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
        >
          {frequency}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${styles.primaryBtn}`}
          onClick={handlePDFExport}
          style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
        >
          <Download size={14} />
          Export PDF
        </button>
        <button
          className={styles.actionBtn}
          onClick={() => handleNotify("email")}
          style={{ color: COLORS.gray[700] }}
        >
          <Mail size={14} />
          Email
        </button>
        <button
          className={styles.actionBtn}
          onClick={() => handleNotify("sms")}
          style={{ color: COLORS.gray[700] }}
        >
          <Smartphone size={14} />
          SMS
        </button>
      </div>
    </div>
  );
}
