"use client";

export const tokens = {
  radii: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
  },
  shadows: {
    card: "var(--shadow-card)",
    popover: "var(--shadow-popover)",
  },
  spacing: {
    1: "var(--space-1)",
    2: "var(--space-2)",
    3: "var(--space-3)",
    4: "var(--space-4)",
  },
  typography: {
    xs: "var(--font-xs)",
    sm: "var(--font-sm)",
    md: "var(--font-md)",
    lg: "var(--font-lg)",
    xl: "var(--font-xl)",
    "2xl": "var(--font-2xl)",
  },
  colors: {
    primary: "var(--color-primary)",
    primarySoft: "var(--color-primary-soft)",
    text: "var(--color-text)",
    muted: "var(--color-muted)",
    mutedStrong: "var(--color-muted-strong)",
    mutedSoft: "var(--color-muted-soft)",
    surface: "var(--color-surface)",
    border: "var(--color-border)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
    critical: "var(--color-critical)",
    criticalSoft: "var(--color-critical-soft)",
  },
} as const;

export const ui = {
  radius: {
    sm: "rounded-[var(--radius-sm)]",
    md: "rounded-[var(--radius-md)]",
    lg: "rounded-[var(--radius-lg)]",
  },
  shadow: {
    card: "shadow-[var(--shadow-card)]",
    popover: "shadow-[var(--shadow-popover)]",
  },
  surface: "bg-[var(--color-surface)] text-[var(--color-text)]",
  surfaceBorder: "border border-[var(--color-border)]",
  mutedText: "text-[var(--color-muted)]",
  mutedStrong: "text-[var(--color-muted-strong)]",
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
} as const;

