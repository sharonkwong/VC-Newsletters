export const COLORS = {
  primary: "#e41d26",
  primaryHover: "#c8101a",
  primaryLight: "#fff5f5",
  secondary: "#fdfaf2",
  white: "#ffffff",
  black: "#1a1a1a",
  gray: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#6b6b6b",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },
  status: {
    success: "#16a34a",
    successBg: "#f0fdf4",
    warning: "#d97706",
    warningBg: "#fffbeb",
    info: "#2563eb",
    infoBg: "#eff6ff",
    trending: "#7c3aed",
    trendingBg: "#f5f3ff",
  },
} as const;

export const FONTS = {
  heading: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  body: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'SF Mono', 'Fira Code', 'Consolas', monospace",
} as const;

export const FONT_SIZES = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
} as const;

export const SPACING = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
} as const;

export const BORDER_RADIUS = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
} as const;

export const APP_NAME = "News Intelligence";
export const APP_ORG = "Emerson Collective";

export const FREQUENCY_OPTIONS = [
  { value: "once", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const SUGGESTED_TOPICS = [
  "AI in Education",
  "Climate Tech",
  "Healthcare Innovation",
  "Human Robotics",
  "Whale Migration",
] as const;
