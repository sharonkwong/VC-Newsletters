import React, { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { COLORS, FONTS, FREQUENCY_OPTIONS, SUGGESTED_TOPICS } from "../../constants/constants";
import DatePicker from "../DatePicker/DatePicker";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  onSearch: (query: string, frequency: string, nextScheduledDate?: string) => void;
}

const SCHEDULABLE_FREQUENCIES = ["weekly", "monthly", "yearly"];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const [frequency, setFrequency] = useState<string>(FREQUENCY_OPTIONS[0].value);
  const [nextScheduledDate, setNextScheduledDate] = useState<string>("");

  const showDatePicker = SCHEDULABLE_FREQUENCIES.includes(frequency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), frequency, showDatePicker && nextScheduledDate ? nextScheduledDate : undefined);
    }
  };

  const handleFrequencyChange = (value: string) => {
    setFrequency(value);
    if (!SCHEDULABLE_FREQUENCIES.includes(value)) {
      setNextScheduledDate("");
    }
  };

  const handleChipClick = (topic: string) => {
    setQuery(topic);
  };

  return (
    <div className={styles.wrapper} style={{ fontFamily: FONTS.body }}>
      <div className={styles.header}>
        <Sparkles size={20} style={{ color: COLORS.primary }} />
        <h2 className={styles.title} style={{ color: COLORS.black, fontFamily: FONTS.heading }}>
          Generate Intelligence Report
        </h2>
      </div>
      <p className={styles.hint} style={{ color: COLORS.gray[500] }}>
        Enter a broad topic for comprehensive market intelligence (e.g., "Climate Tech" not "Climate tech funding sentiment this month vs. last quarter")
      </p>

      <form onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <span className={styles.searchIcon} style={{ color: COLORS.gray[400] }}>
            <Search size={18} />
          </span>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g., AI in Education, Climate Tech, Healthcare Innovation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ fontFamily: FONTS.body }}
          />
        </div>

        <div className={styles.suggestedSection}>
          <p className={styles.suggestedLabel} style={{ color: COLORS.gray[500] }}>
            Suggested topics:
          </p>
          <div className={styles.chips}>
            {SUGGESTED_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                className={styles.chip}
                onClick={() => handleChipClick(topic)}
                style={{ fontFamily: FONTS.body, color: COLORS.gray[700] }}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.frequencySection}>
          <p className={styles.frequencyLabel} style={{ color: COLORS.black }}>Update Frequency</p>
          <div className={styles.frequencyButtons}>
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.freqBtn} ${frequency === opt.value ? styles.freqBtnActive : ""}`}
                onClick={() => handleFrequencyChange(opt.value)}
                style={
                  frequency === opt.value
                    ? { backgroundColor: COLORS.primary, color: COLORS.white, borderColor: COLORS.primary }
                    : { color: COLORS.black, borderColor: COLORS.gray[200] }
                }
              >
                {opt.label}
              </button>
            ))}
            {showDatePicker && (
              <DatePicker
                value={nextScheduledDate}
                onChange={setNextScheduledDate}
                minDate={new Date().toISOString().split("T")[0]}
                placeholder="Next scheduled date (optional)"
              />
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!query.trim()}
          className={styles.searchButton}
          style={{
            backgroundColor: COLORS.primary,
            color: COLORS.white,
            fontFamily: FONTS.body,
          }}
        >
          Generate Intelligence Report
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
