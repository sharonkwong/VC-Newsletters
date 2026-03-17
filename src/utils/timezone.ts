const STORAGE_KEY = "newsIntel-timezone";

const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific (PST/PDT)" },
  { value: "America/Denver", label: "Mountain (MST/MDT)" },
  { value: "America/Chicago", label: "Central (CST/CDT)" },
  { value: "America/New_York", label: "Eastern (EST/EDT)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Central Europe (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
] as const;

function getTimezone(): string {
  return localStorage.getItem(STORAGE_KEY) || "America/Los_Angeles";
}

function setTimezone(tz: string): void {
  localStorage.setItem(STORAGE_KEY, tz);
}

function formatDateInTimezone(dateStr: string): string {
  const tz = getTimezone();

  // Try parsing as ISO date first, then as a human-readable date
  let date: Date;
  const isoMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    date = new Date(dateStr);
  } else {
    // Parse "March 16, 2026 at 08:00 PM UTC" style
    const cleaned = dateStr.replace(" at ", " ").replace(" UTC", " UTC");
    date = new Date(cleaned);
  }

  if (isNaN(date.getTime())) {
    return dateStr; // Return original if parsing fails
  }

  return date.toLocaleString("en-US", {
    timeZone: tz,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

export { TIMEZONES, getTimezone, setTimezone, formatDateInTimezone };
