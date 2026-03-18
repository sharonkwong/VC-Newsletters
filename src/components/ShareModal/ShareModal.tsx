import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Clock,
  Mail,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CalendarClock,
  Link2,
  FileText,
  FileSpreadsheet,
  Image,
  Loader2,
  Check,
} from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import type { Newsletter } from "../../types/types";
import styles from "./ShareModal.module.css";

interface ShareRecord {
  email: string;
  date: string;
  format: string;
}

interface ScheduledEmail {
  email: string;
  addedDate: string;
  format: string;
}

type ExportFormat = "pdf" | "ppt" | "screenshot";

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: typeof FileText }[] = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "ppt", label: "PPT", icon: FileSpreadsheet },
  { value: "screenshot", label: "Newsletter", icon: Image },
];

interface ShareModalProps {
  topic: string;
  frequency: string;
  newsletter: Newsletter;
  onClose: () => void;
}

export default function ShareModal({ topic, frequency, onClose }: ShareModalProps) {
  const [shareEmail, setShareEmail] = useState("");
  const [shareFormat, setShareFormat] = useState<ExportFormat>("pdf");
  const [formatOpen, setFormatOpen] = useState(false);
  const [shareHistory, setShareHistory] = useState<ShareRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleFormat, setScheduleFormat] = useState<ExportFormat>("pdf");
  const [scheduleFormatOpen, setScheduleFormatOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  const formatRef = useRef<HTMLDivElement>(null);
  const scheduleFormatRef = useRef<HTMLDivElement>(null);

  const storageKeyShare = `newsIntel-share-${topic}`;
  const storageKeySchedule = `newsIntel-schedule-${topic}`;

  useEffect(() => {
    const savedHistory = localStorage.getItem(storageKeyShare);
    if (savedHistory) setShareHistory(JSON.parse(savedHistory));
    const savedSchedule = localStorage.getItem(storageKeySchedule);
    if (savedSchedule) setScheduledEmails(JSON.parse(savedSchedule));
  }, [storageKeyShare, storageKeySchedule]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formatRef.current && !formatRef.current.contains(e.target as Node)) {
        setFormatOpen(false);
      }
      if (scheduleFormatRef.current && !scheduleFormatRef.current.contains(e.target as Node)) {
        setScheduleFormatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleShareSend = async () => {
    const trimmed = shareEmail.trim();
    if (!trimmed || !trimmed.includes("@")) return;

    setSendState("sending");

    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const record: ShareRecord = {
      email: trimmed,
      date: new Date().toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", hour12: true,
      }),
      format: shareFormat.toUpperCase(),
    };

    const updated = [record, ...shareHistory];
    setShareHistory(updated);
    localStorage.setItem(storageKeyShare, JSON.stringify(updated));
    setShareEmail("");

    setSendState("sent");
    setTimeout(() => setSendState("idle"), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddSchedule = () => {
    const trimmed = scheduleEmail.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    if (scheduledEmails.some((e) => e.email === trimmed)) return;

    const entry: ScheduledEmail = {
      email: trimmed,
      addedDate: new Date().toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      }),
      format: scheduleFormat.toUpperCase(),
    };

    const updated = [...scheduledEmails, entry];
    setScheduledEmails(updated);
    localStorage.setItem(storageKeySchedule, JSON.stringify(updated));
    setScheduleEmail("");
  };

  const handleRemoveSchedule = (email: string) => {
    const updated = scheduledEmails.filter((e) => e.email !== email);
    setScheduledEmails(updated);
    localStorage.setItem(storageKeySchedule, JSON.stringify(updated));
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  const currentFormatOption = FORMAT_OPTIONS.find((f) => f.value === shareFormat)!;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        style={{ fontFamily: FONTS.body }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ color: COLORS.black, fontFamily: FONTS.heading }}>
            Share & Distribute
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} style={{ color: COLORS.gray[500] }} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Copy Link */}
          <button
            className={styles.copyLinkBtn}
            onClick={handleCopyLink}
            style={{ color: copied ? COLORS.primary : COLORS.gray[600] }}
          >
            <Link2 size={14} />
            {copied ? "Copied!" : "Copy link to this newsletter"}
          </button>

          <hr className={styles.divider} />

          {/* Section 1: Share this newsletter */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h4 className={styles.sectionTitle} style={{ color: COLORS.black }}>
                  <Mail size={16} style={{ color: COLORS.primary }} />
                  Share This Newsletter
                </h4>
                <p className={styles.sectionDesc} style={{ color: COLORS.gray[500] }}>
                  Send the latest intelligence report to a colleague or stakeholder.
                </p>
              </div>
              <button
                className={styles.historyToggle}
                onClick={() => setShowHistory(!showHistory)}
                style={{ color: COLORS.gray[500] }}
              >
                <Clock size={14} />
                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div className={styles.inputRow}>
              <input
                type="email"
                className={styles.emailInput}
                placeholder="Enter email address..."
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleShareSend)}
              />

              {/* Format dropdown */}
              <div className={styles.formatDropdown} ref={formatRef}>
                <button
                  className={styles.formatBtn}
                  onClick={() => setFormatOpen(!formatOpen)}
                  style={{ color: COLORS.gray[700] }}
                >
                  <currentFormatOption.icon size={13} />
                  {currentFormatOption.label}
                  <ChevronDown size={11} />
                </button>
                {formatOpen && (
                  <div className={styles.formatMenu}>
                    {FORMAT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`${styles.formatMenuItem} ${shareFormat === opt.value ? styles.formatMenuItemActive : ""}`}
                        onClick={() => { setShareFormat(opt.value); setFormatOpen(false); }}
                      >
                        <opt.icon size={13} style={{ color: shareFormat === opt.value ? COLORS.primary : COLORS.gray[500] }} />
                        <span style={{ color: shareFormat === opt.value ? COLORS.primary : COLORS.gray[700] }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                className={styles.sendBtn}
                onClick={handleShareSend}
                disabled={!shareEmail.trim() || !shareEmail.includes("@") || sendState !== "idle"}
                style={{
                  backgroundColor: sendState === "sent" ? COLORS.status.success : COLORS.primary,
                  color: COLORS.white,
                }}
              >
                {sendState === "sending" ? (
                  <><Loader2 size={14} className={styles.spinner} /> Sending</>
                ) : sendState === "sent" ? (
                  <><Check size={14} /> Sent!</>
                ) : (
                  <><Send size={14} /> Send</>
                )}
              </button>
            </div>

            {showHistory && (
              <div className={styles.historyList}>
                {shareHistory.length === 0 ? (
                  <p className={styles.emptyText} style={{ color: COLORS.gray[400] }}>
                    No sharing history yet.
                  </p>
                ) : (
                  shareHistory.map((record, i) => (
                    <div key={i} className={styles.historyItem}>
                      <Mail size={12} style={{ color: COLORS.gray[400] }} />
                      <span className={styles.historyEmail} style={{ color: COLORS.black }}>
                        {record.email}
                      </span>
                      {record.format && (
                        <span className={styles.historyFormat} style={{ color: COLORS.primary, backgroundColor: COLORS.primaryLight }}>
                          {record.format}
                        </span>
                      )}
                      <span className={styles.historyDate} style={{ color: COLORS.gray[400] }}>
                        {record.date}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <hr className={styles.divider} />

          {/* Section 2: Schedule newsletter updates */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle} style={{ color: COLORS.black }}>
              <CalendarClock size={16} style={{ color: COLORS.primary }} />
              Schedule Newsletter Updates
            </h4>
            <p className={styles.sectionDesc} style={{ color: COLORS.gray[500] }}>
              Recipients added below will automatically receive the latest version of this report
              whenever it is refreshed on your selected cadence ({frequency.toLowerCase()}).
            </p>

            <div className={styles.inputRow}>
              <input
                type="email"
                className={styles.emailInput}
                placeholder="Add recipient email..."
                value={scheduleEmail}
                onChange={(e) => setScheduleEmail(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleAddSchedule)}
              />

              {/* Schedule format dropdown */}
              <div className={styles.formatDropdown} ref={scheduleFormatRef}>
                <button
                  className={styles.formatBtn}
                  onClick={() => setScheduleFormatOpen(!scheduleFormatOpen)}
                  style={{ color: COLORS.gray[700] }}
                >
                  {(() => { const opt = FORMAT_OPTIONS.find((f) => f.value === scheduleFormat)!; return <><opt.icon size={13} />{opt.label}<ChevronDown size={11} /></>; })()}
                </button>
                {scheduleFormatOpen && (
                  <div className={styles.formatMenu}>
                    {FORMAT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`${styles.formatMenuItem} ${scheduleFormat === opt.value ? styles.formatMenuItemActive : ""}`}
                        onClick={() => { setScheduleFormat(opt.value); setScheduleFormatOpen(false); }}
                      >
                        <opt.icon size={13} style={{ color: scheduleFormat === opt.value ? COLORS.primary : COLORS.gray[500] }} />
                        <span style={{ color: scheduleFormat === opt.value ? COLORS.primary : COLORS.gray[700] }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                className={styles.addBtn}
                onClick={handleAddSchedule}
                disabled={!scheduleEmail.trim() || !scheduleEmail.includes("@")}
                style={{ color: COLORS.primary }}
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            {scheduledEmails.length > 0 && (
              <div className={styles.recipientList}>
                {scheduledEmails.map((entry) => (
                  <div key={entry.email} className={styles.recipientItem}>
                    <div className={styles.recipientInfo}>
                      <Mail size={12} style={{ color: COLORS.gray[400] }} />
                      <span className={styles.recipientEmail} style={{ color: COLORS.black }}>
                        {entry.email}
                      </span>
                      {entry.format && (
                        <span className={styles.historyFormat} style={{ color: COLORS.primary, backgroundColor: COLORS.primaryLight }}>
                          {entry.format}
                        </span>
                      )}
                      <span className={styles.recipientDate} style={{ color: COLORS.gray[400] }}>
                        Added {entry.addedDate}
                      </span>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemoveSchedule(entry.email)}
                      title="Remove"
                    >
                      <Trash2 size={12} style={{ color: COLORS.gray[400] }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
