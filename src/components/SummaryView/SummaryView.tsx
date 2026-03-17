import { useState, useRef, useEffect } from "react";
import { Download, Share2, ChevronDown, FileText, Image, FileSpreadsheet } from "lucide-react";
import ShareModal from "../ShareModal/ShareModal";
import { formatDateInTimezone } from "../../utils/timezone";
import ExecutiveSummary from "../ExecutiveSummary/ExecutiveSummary";
import ThemesList from "../ThemesList/ThemesList";
import VCAnalysis from "../VCAnalysis/VCAnalysis";
import CompetitorLandscape from "../CompetitorLandscape/CompetitorLandscape";
import EmergingCompanies from "../EmergingCompanies/EmergingCompanies";
import ConsensusContrarian from "../ConsensusContrarian/ConsensusContrarian";
import TopInsights from "../TopInsights/TopInsights";
import SourcesList from "../SourcesList/SourcesList";
import SavedNotes from "../SavedNotes/SavedNotes";
import { generateNewsletterPDF } from "../../utils/pdfExport";
import { generateNewsletterPPT } from "../../utils/pptExport";
import { generateScreenshot } from "../../utils/screenshotExport";
import { COLORS, FONTS, FREQUENCY_OPTIONS } from "../../constants/constants";
import type { Newsletter } from "../../types/types";
import styles from "./SummaryView.module.css";

interface SavedNote {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

interface SummaryViewProps {
  summary: Newsletter;
  onFrequencyChange?: (frequency: string) => void;
  savedNotes?: SavedNote[];
  onDeleteNote?: (id: string) => void;
}

export function SummaryView({ summary, onFrequencyChange, savedNotes = [], onDeleteNote }: SummaryViewProps) {
  const [freqOpen, setFreqOpen] = useState(false);
  const [currentFreq, setCurrentFreq] = useState(summary.frequency);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentFreq(summary.frequency);
  }, [summary.frequency]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFreqOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFreqSelect = (value: string, label: string) => {
    const freqLabel = value === "once" ? "One-time Research" : `${label} Updates`;
    setCurrentFreq(freqLabel);
    setFreqOpen(false);
    onFrequencyChange?.(value);
  };

  const handleExport = async (format: "pdf" | "ppt" | "screenshot") => {
    setExportOpen(false);
    if (format === "pdf") {
      generateNewsletterPDF(summary);
    } else if (format === "ppt") {
      generateNewsletterPPT(summary);
    } else {
      await generateScreenshot(summary.topic);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.topic} style={{ color: COLORS.black, fontFamily: FONTS.heading }}>
            {summary.topic}
          </h2>
          <div className={styles.meta} style={{ color: COLORS.gray[500] }}>
            <span>Generated: {formatDateInTimezone(summary.generatedDate)}</span>
            {summary.updatedDate && <span> · Updated: {formatDateInTimezone(summary.updatedDate)}</span>}
          </div>
        </div>

        <div className={styles.headerActions}>
          {/* Frequency dropdown */}
          <div className={styles.freqDropdown} ref={dropdownRef}>
            <button
              className={styles.freqButton}
              onClick={() => setFreqOpen(!freqOpen)}
              style={{ backgroundColor: COLORS.primaryLight, color: COLORS.primary }}
            >
              {currentFreq}
              <ChevronDown size={14} />
            </button>
            {freqOpen && (
              <div className={styles.freqMenu}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={styles.freqMenuItem}
                    onClick={() => handleFreqSelect(opt.value, opt.label)}
                    style={{ color: COLORS.gray[700] }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export dropdown */}
          <div className={styles.exportDropdown} ref={exportRef}>
            <button
              className={styles.actionBtn}
              onClick={() => setExportOpen(!exportOpen)}
              style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
            >
              <Download size={14} />
              Export
              <ChevronDown size={12} />
            </button>
            {exportOpen && (
              <div className={styles.exportMenu}>
                <button className={styles.exportMenuItem} onClick={() => handleExport("pdf")}>
                  <FileText size={14} style={{ color: COLORS.primary }} />
                  <span style={{ color: COLORS.gray[700] }}>Export as PDF</span>
                </button>
                <button className={styles.exportMenuItem} onClick={() => handleExport("ppt")}>
                  <FileSpreadsheet size={14} style={{ color: COLORS.primary }} />
                  <span style={{ color: COLORS.gray[700] }}>Export as PPT</span>
                </button>
                <button className={styles.exportMenuItem} onClick={() => handleExport("screenshot")}>
                  <Image size={14} style={{ color: COLORS.primary }} />
                  <span style={{ color: COLORS.gray[700] }}>Export Newsletter</span>
                </button>
              </div>
            )}
          </div>

          {/* Share button */}
          <button
            className={styles.actionBtnOutline}
            onClick={() => setShareOpen(true)}
            style={{ color: COLORS.gray[700] }}
          >
            <Share2 size={14} />
            Share
          </button>
        </div>
      </div>

      {shareOpen && (
        <ShareModal
          topic={summary.topic}
          frequency={currentFreq}
          newsletter={summary}
          onClose={() => setShareOpen(false)}
        />
      )}

      <div id="executive-summary">
        <ExecutiveSummary bullets={summary.executiveSummary} />
      </div>

      <div id="key-themes">
        <ThemesList themes={summary.themes} />
      </div>

      <div id="market-landscape">
        <VCAnalysis
          landscape={summary.landscape}
          currentState={summary.currentState}
          predictions={summary.predictions}
          investmentInsights={summary.investmentInsights}
        />
      </div>

      {summary.competitors.length > 0 && (
        <div id="competitor-landscape">
          <CompetitorLandscape competitors={summary.competitors} />
        </div>
      )}

      {summary.emergingCompanies.length > 0 && (
        <div id="emerging-companies">
          <EmergingCompanies companies={summary.emergingCompanies} />
        </div>
      )}

      <div id="consensus-contrarian">
        <ConsensusContrarian consensus={summary.consensus} contrarian={summary.contrarian} />
      </div>

      {(summary.topPeople.length > 0 || summary.topProducts.length > 0 || summary.topCompanies.length > 0) && (
        <div id="top-insights">
          <TopInsights
            people={summary.topPeople}
            products={summary.topProducts}
            companies={summary.topCompanies}
          />
        </div>
      )}

      <div id="sources">
        <SourcesList sources={summary.sources} />
      </div>

      <div id="saved-notes">
        <SavedNotes notes={savedNotes} onDelete={onDeleteNote} />
      </div>
    </div>
  );
}
