import { useState, useEffect, useRef } from "react";
import { Sparkles, Settings, User, Globe, Mail, Phone } from "lucide-react";
import SearchBar from "./components/SearchBar/SearchBar";
import { SummaryView } from "./components/SummaryView/SummaryView";
import SearchHistory from "./components/SearchHistory/SearchHistory";
import ChatBot from "./components/ChatBot/ChatBot";
import TableOfContents from "./components/TableOfContents/TableOfContents";
import { mockSummaries } from "./data/mockData";
import { COLORS, FONTS, APP_NAME, APP_ORG, SUGGESTED_TOPICS } from "./constants/constants";
import { TIMEZONES, getTimezone, setTimezone } from "./utils/timezone";
import type { Newsletter, HistoryItem } from "./types/types";
import styles from "./App.module.css";

function generateGenericNewsletter(query: string, frequency: string): Newsletter {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const freqLabel = frequency === "once" ? "One-time Research" : `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Updates`;

  return {
    topic: query,
    date: dateStr,
    generatedDate: `${dateStr} at ${timeStr}`,
    updatedDate: null,
    frequency: freqLabel,
    executiveSummary: [
      `Market analysis for ${query} shows significant growth potential with emerging opportunities across multiple sectors and geographic regions.`,
      `Key players are focusing on innovation and strategic partnerships to capture market share in this rapidly evolving landscape.`,
      `Regulatory environment is becoming more defined, creating both opportunities and challenges for market participants.`,
      `Technology adoption is accelerating, with early movers establishing competitive advantages through proprietary platforms and data assets.`,
      `Investment activity remains strong with substantial capital flowing into category leaders demonstrating clear product-market fit and scalable business models.`,
    ],
    themes: [
      "Digital transformation and technology adoption driving market evolution",
      "Consolidation trends as established players acquire innovative startups",
      "Regulatory compliance creating barriers to entry and competitive moats",
      "Customer acquisition costs rising, emphasizing importance of retention",
      "Global expansion opportunities in emerging markets",
    ],
    sources: [
      { title: `${query} Industry Overview 2026`, url: "#", type: "Industry Report", trending: true },
      { title: `Market Analysis: ${query} Sector Trends`, url: "#", type: "Research Paper", trending: true },
      { title: `Investment Landscape for ${query}`, url: "#", type: "VC Analysis", trending: false },
      { title: `${query}: Technology Adoption Survey`, url: "#", type: "Survey Results", trending: false },
    ],
    landscape: `The ${query} market is characterized by rapid innovation and increasing competition. Established players are defending their positions through strategic acquisitions and platform expansion while new entrants target underserved niches with specialized solutions.`,
    currentState: `Current market dynamics show strong demand across both enterprise and consumer segments. Adoption rates are accelerating as solutions mature and demonstrate clear ROI. However, challenges persist around integration complexity, data privacy concerns, and regulatory compliance.`,
    predictions: `[AI-Generated Analysis] Based on pattern analysis of current market signals, we anticipate significant growth opportunities through 2028. Continued consolidation is expected with 40-50% of current market participants being acquired or ceasing operations. Technology advances will enable new use cases and expand addressable markets by 2-3x.`,
    investmentInsights: `Investment opportunities exist across the value chain. Most attractive segments include: (1) Platform plays with strong network effects and recurring revenue models; (2) Vertical solutions for high-margin industries with specific compliance requirements; (3) Infrastructure/tooling companies serving the ecosystem.`,
    competitors: [],
    emergingCompanies: [],
    consensus: [
      { title: "Market Growth Trajectory", description: `The ${query} market will continue its upward trajectory driven by increasing demand and technological maturity.` },
      { title: "Consolidation Phase", description: "The market is entering a consolidation phase where larger players will acquire smaller competitors." },
      { title: "Enterprise Adoption", description: "Enterprise adoption is the primary growth driver and will accelerate over the next 2-3 years." },
    ],
    contrarian: [
      { title: "Growth Deceleration Risk", description: "Current growth rates may be unsustainable as market saturation approaches faster than consensus estimates." },
      { title: "Regulatory Headwinds", description: "Upcoming regulatory changes could significantly reshape the competitive landscape and invalidate current business models." },
    ],
    topPeople: [],
    topProducts: [],
    topCompanies: [],
  };
}

export default function App() {
  const [currentSummary, setCurrentSummary] = useState<Newsletter | null>(null);
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioningOut, setIsTransitioningOut] = useState(false);

  // Persist frequency overrides per topic
  const getFreqOverrides = (): Record<string, string> => {
    try {
      return JSON.parse(localStorage.getItem("newsIntelFreqOverrides") || "{}");
    } catch { return {}; }
  };

  const saveFreqOverride = (topic: string, freqLabel: string) => {
    const overrides = getFreqOverrides();
    overrides[topic.toLowerCase()] = freqLabel;
    localStorage.setItem("newsIntelFreqOverrides", JSON.stringify(overrides));
  };

  const applyFreqOverride = (newsletter: Newsletter): Newsletter => {
    const overrides = getFreqOverrides();
    const override = overrides[newsletter.topic.toLowerCase()];
    if (override) {
      return { ...newsletter, frequency: override };
    }
    return newsletter;
  };
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tzPickerOpen, setTzPickerOpen] = useState(false);
  const [currentTz, setCurrentTz] = useState(getTimezone());
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
        setTzPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("newsIntelHistory");
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem("newsIntelHistory", JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  const handleSearch = (query: string, frequency: string) => {
    setIsLoading(true);

    setTimeout(() => {
      const queryLower = query.toLowerCase();
      let summary = mockSummaries[queryLower];

      if (!summary) {
        summary = generateGenericNewsletter(query, frequency);
      } else {
        const freqLabel = frequency === "once"
          ? "One-time Research"
          : `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Updates`;
        summary = { ...summary, frequency: freqLabel };
      }

      // Stamp with current time (ISO) so timezone conversion is accurate
      summary = { ...summary, generatedDate: new Date().toISOString() };

      // Apply any saved frequency override
      summary = applyFreqOverride(summary);

      setCurrentSummary(summary);

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        topic: query,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        frequency: frequency === "once" ? "One-time" : frequency.charAt(0).toUpperCase() + frequency.slice(1),
      };

      setSearchHistory((prev) => [historyItem, ...prev.slice(0, 19)]);
      setSelectedHistoryId(historyItem.id);
      setIsLoading(false);
    }, 1200);
  };

  const handleHistorySelect = (item: HistoryItem) => {
    const queryLower = item.topic.toLowerCase();
    const freqRaw = item.frequency.toLowerCase().replace("one-time", "once");
    let summary = mockSummaries[queryLower] || generateGenericNewsletter(item.topic, freqRaw);
    const freqLabel = item.frequency.toLowerCase() === "one-time"
      ? "One-time Research"
      : `${item.frequency} Updates`;
    summary = { ...summary, generatedDate: new Date().toISOString(), frequency: freqLabel };
    summary = applyFreqOverride(summary);
    setCurrentSummary(summary);
    setSelectedHistoryId(item.id);
  };

  const handleHistoryDelete = (id: string) => {
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem("newsIntelHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const handleHistoryRefresh = (id: string) => {
    const item = searchHistory.find((h) => h.id === id);
    if (item) {
      handleSearch(item.topic, item.frequency.toLowerCase().replace("one-time", "once"));
    }
  };

  const handleFrequencyChange = (newFrequency: string) => {
    if (!currentSummary) return;
    const freqLabel = newFrequency === "once"
      ? "One-time Research"
      : `${newFrequency.charAt(0).toUpperCase() + newFrequency.slice(1)} Updates`;
    const displayFreq = newFrequency === "once" ? "One-time" : newFrequency.charAt(0).toUpperCase() + newFrequency.slice(1);

    // Update the current summary
    setCurrentSummary({ ...currentSummary, frequency: freqLabel });

    // Persist the override so it survives reload
    saveFreqOverride(currentSummary.topic, freqLabel);

    // Update the matching history item
    setSearchHistory((prev) => {
      const updated = prev.map((item) =>
        item.topic.toLowerCase() === currentSummary.topic.toLowerCase()
          ? { ...item, frequency: displayFreq }
          : item
      );
      localStorage.setItem("newsIntelHistory", JSON.stringify(updated));
      return updated;
    });
  };

  interface SavedNote {
    id: string;
    question: string;
    answer: string;
    timestamp: string;
  }

  const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);

  // Load saved notes when topic changes
  useEffect(() => {
    if (currentSummary) {
      const notes = JSON.parse(localStorage.getItem(`newsIntel-notes-${currentSummary.topic.toLowerCase()}`) || "[]");
      setSavedNotes(notes);
    } else {
      setSavedNotes([]);
    }
  }, [currentSummary?.topic]);

  const handleSaveQA = (question: string, answer: string) => {
    if (!currentSummary) return;
    const note: SavedNote = {
      id: `note-${Date.now()}`,
      question,
      answer,
      timestamp: new Date().toISOString(),
    };
    const updated = [note, ...savedNotes];
    setSavedNotes(updated);
    localStorage.setItem(`newsIntel-notes-${currentSummary.topic.toLowerCase()}`, JSON.stringify(updated));
  };

  const handleDeleteNote = (id: string) => {
    if (!currentSummary) return;
    const updated = savedNotes.filter((n) => n.id !== id);
    setSavedNotes(updated);
    localStorage.setItem(`newsIntel-notes-${currentSummary.topic.toLowerCase()}`, JSON.stringify(updated));
  };

  const handleUnsaveQA = (answer: string) => {
    if (!currentSummary) return;
    const updated = savedNotes.filter((n) => n.answer !== answer);
    setSavedNotes(updated);
    localStorage.setItem(`newsIntel-notes-${currentSummary.topic.toLowerCase()}`, JSON.stringify(updated));
  };

  return (
    <div className={styles.app} style={{ backgroundColor: COLORS.secondary }}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div
            className={styles.brand}
            onClick={() => {
              if (!currentSummary) return;
              setIsTransitioningOut(true);
              setTimeout(() => {
                setCurrentSummary(null);
                setSelectedHistoryId(null);
                setIsTransitioningOut(false);
              }, 350);
            }}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.logoIcon} style={{ backgroundColor: COLORS.primary }}>
              <Sparkles size={24} color={COLORS.white} />
            </div>
            <div className={styles.brandText}>
              <h1 style={{ color: COLORS.black, fontFamily: FONTS.heading }}>{APP_NAME}</h1>
              <p style={{ color: COLORS.gray[500] }}>{APP_ORG}</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.headerDate} style={{ color: COLORS.gray[500] }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div className={styles.settingsWrapper} ref={settingsRef}>
              <button
                className={styles.settingsBtn}
                onClick={() => { setSettingsOpen(!settingsOpen); setTzPickerOpen(false); setProfileOpen(false); }}
                style={{ color: COLORS.gray[500] }}
              >
                <Settings size={18} />
              </button>
              {settingsOpen && (
                <div className={styles.settingsMenu}>
                  <button
                    className={styles.settingsItem}
                    onClick={() => { setProfileOpen(!profileOpen); setTzPickerOpen(false); }}
                    style={{ color: COLORS.gray[700] }}
                  >
                    <User size={14} />
                    Profile
                  </button>
                  {profileOpen && (
                    <div className={styles.profileCard}>
                      <div className={styles.profileRow}>
                        <User size={13} style={{ color: COLORS.primary }} />
                        <span style={{ color: COLORS.gray[600] }}>Sharon Kwong</span>
                      </div>
                      <div className={styles.profileRow}>
                        <Mail size={13} style={{ color: COLORS.primary }} />
                        <span style={{ color: COLORS.gray[600] }}>sharonjkwong@gmail.com</span>
                      </div>
                      <div className={styles.profileRow}>
                        <Phone size={13} style={{ color: COLORS.primary }} />
                        <span style={{ color: COLORS.gray[600] }}>(408) 702-7692</span>
                      </div>
                    </div>
                  )}
                  <button
                    className={styles.settingsItem}
                    onClick={() => setTzPickerOpen(!tzPickerOpen)}
                    style={{ color: COLORS.gray[700] }}
                  >
                    <Globe size={14} />
                    Change Timezone
                  </button>
                  {tzPickerOpen && (
                    <div className={styles.tzList}>
                      {TIMEZONES.map((tz) => (
                        <button
                          key={tz.value}
                          className={`${styles.tzOption} ${currentTz === tz.value ? styles.tzOptionActive : ""}`}
                          onClick={() => {
                            setTimezone(tz.value);
                            setCurrentTz(tz.value);
                            setSettingsOpen(false);
                            setTzPickerOpen(false);
                          }}
                          style={currentTz === tz.value ? { color: COLORS.primary } : { color: COLORS.gray[600] }}
                        >
                          {tz.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={currentSummary && !isLoading ? styles.gridWithToc : styles.grid}>
          {/* Table of Contents — left column, only when newsletter is shown */}
          {currentSummary && !isLoading && (
            <div className={`${styles.tocColumn} ${isTransitioningOut ? styles.tocColumnOut : ""}`}>
              <TableOfContents newsletter={currentSummary} />
            </div>
          )}

          {/* Main content — center */}
          <div className={styles.content}>
            <SearchBar onSearch={handleSearch} />

            {isLoading && (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner} style={{ borderColor: COLORS.gray[200], borderTopColor: COLORS.primary }} />
                <p className={styles.loadingText} style={{ color: COLORS.gray[500] }}>
                  Analyzing sources and generating intelligence...
                </p>
              </div>
            )}

            {!isLoading && !currentSummary && (
              <div className={styles.welcome}>
                <Sparkles size={64} className={styles.welcomeIcon} style={{ color: COLORS.primary }} />
                <h2 style={{ color: COLORS.black }}>Welcome to {APP_NAME}</h2>
                <p className={styles.welcomeDescription} style={{ color: COLORS.gray[500] }}>
                  Enter any topic above to generate AI-powered intelligence summaries tailored for
                  venture capital decision-making. Our system analyzes thousands of sources to provide
                  executive summaries, market insights, and investment perspectives.
                </p>
                <div className={styles.welcomeGrid}>
                  <div className={styles.welcomeCard} style={{ backgroundColor: COLORS.primaryLight }}>
                    <h4 style={{ color: COLORS.black }}>Try searching for:</h4>
                    <ul style={{ color: COLORS.gray[500] }}>
                      {SUGGESTED_TOPICS.map((t) => (
                        <li key={t}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.welcomeCard} style={{ backgroundColor: COLORS.primaryLight }}>
                    <h4 style={{ color: COLORS.black }}>Features:</h4>
                    <ul style={{ color: COLORS.gray[500] }}>
                      <li>• 5-point executive summaries</li>
                      <li>• VC-focused investment insights</li>
                      <li>• Competitor & emerging company analysis</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && currentSummary && (
              <div className={isTransitioningOut ? styles.fadeOut : styles.fadeIn}>
                <SummaryView
                  summary={currentSummary}
                  onFrequencyChange={handleFrequencyChange}
                  savedNotes={savedNotes}
                  onDeleteNote={handleDeleteNote}
                />
              </div>
            )}
          </div>

          {/* Sidebar — right column */}
          <div className={styles.sidebar}>
            <SearchHistory
              history={searchHistory}
              selectedId={selectedHistoryId}
              onSelect={handleHistorySelect}
              onDelete={handleHistoryDelete}
              onRefresh={handleHistoryRefresh}
            />
            <ChatBot
              topic={currentSummary?.topic || null}
              newsletter={currentSummary}
              onSaveQA={handleSaveQA}
              onUnsaveQA={handleUnsaveQA}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
