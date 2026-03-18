import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import { FONTS } from "../../constants/constants";
import styles from "./DatePicker.module.css";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  placeholder?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseDate(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(str: string): string {
  const date = parseDate(str);
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DatePicker({ value, onChange, minDate, placeholder = "Select date" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = parseDate(value);
  const min = parseDate(minDate || "") || new Date();
  const today = new Date();

  const initialMonth = selected || today;
  const [viewYear, setViewYear] = useState(initialMonth.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialMonth.getMonth());

  useEffect(() => {
    const d = parseDate(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelect = (date: Date) => {
    onChange(formatDate(date));
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  // Build the day grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const startDay = firstDayOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { date: Date; outside: boolean }[] = [];

  // Previous month trailing days
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
    cells.push({ date: d, outside: true });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(viewYear, viewMonth, i), outside: false });
  }

  // Next month leading days to fill grid
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ date: new Date(viewYear, viewMonth + 1, i), outside: true });
    }
  }

  const isDisabled = (date: Date) => {
    const minStart = new Date(min.getFullYear(), min.getMonth(), min.getDate());
    return date < minStart;
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef} style={{ fontFamily: FONTS.body }}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerActive : ""}`}
        onClick={() => setOpen(!open)}
        style={{ fontFamily: FONTS.body }}
      >
        <Repeat size={13} />
        {value ? (
          <span>{formatDisplay(value)}</span>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
      </button>

      {open && (
        <div className={styles.calendar}>
          <div className={styles.calendarHeader}>
            <button type="button" className={styles.navBtn} onClick={goToPrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span className={styles.monthYear} style={{ fontFamily: FONTS.heading }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" className={styles.navBtn} onClick={goToNextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className={styles.weekdays}>
            {WEEKDAYS.map((d) => (
              <span key={d} className={styles.weekday}>{d}</span>
            ))}
          </div>

          <div className={styles.days}>
            {cells.map(({ date, outside }, i) => {
              const disabled = isDisabled(date);
              const isSelected = selected && isSameDay(date, selected);
              const isToday = isSameDay(date, today);

              let cls = styles.day;
              if (outside) cls += ` ${styles.dayOutside}`;
              if (disabled) cls += ` ${styles.dayDisabled}`;
              if (isSelected) cls += ` ${styles.daySelected}`;
              else if (isToday && !outside) cls += ` ${styles.dayToday}`;

              return (
                <button
                  key={i}
                  type="button"
                  className={cls}
                  disabled={disabled || outside}
                  onClick={() => !disabled && !outside && handleSelect(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {value && (
            <div className={styles.calendarFooter}>
              <button type="button" className={styles.clearBtn} onClick={handleClear}>
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
