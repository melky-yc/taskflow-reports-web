import { heroui } from "@heroui/react";

const baseLayout = {
  fontSize: {
    tiny: "0.75rem",
    small: "0.875rem",
    medium: "1rem",
    large: "1.25rem",
    DEFAULT: "1rem",
  },
  lineHeight: {
    tiny: "1rem",
    small: "1.25rem",
    medium: "1.5rem",
    large: "1.75rem",
    DEFAULT: "1.5rem",
  },
  radius: {
    small: "10px",
    medium: "14px",
    large: "18px",
  },
  borderWidth: {
    small: "1px",
    medium: "1px",
    large: "2px",
  },
  dividerWeight: "1px",
  disabledOpacity: 0.55,
  hoverOpacity: 0.92,
  boxShadow: {
    small: "0 12px 24px rgba(15, 23, 42, 0.08)",
    medium: "0 12px 24px rgba(15, 23, 42, 0.08)",
    large: "0 20px 36px rgba(15, 23, 42, 0.16)",
  },
};

const lightColors = {
  background: "#f5f7fb",
  foreground: "#0f172a",
  content1: "#ffffff",
  content2: "#edf1f7",
  content3: "#e7edf7",
  content4: "#dbe3ef",
  divider: "#dbe3ef",
  overlay: "rgba(15, 23, 42, 0.45)",
  focus: "#1f3b6f",
  default: "#edf1f7",
  primary: "#1f3b6f",
  secondary: "#294a88",
  success: "#0f766e",
  warning: "#b45309",
  danger: "#b42318",
};

const darkColors = {
  background: "#0b1120",
  foreground: "#e5e7eb",
  content1: "#0f172a",
  content2: "#141d2f",
  content3: "#1a2336",
  content4: "#223049",
  divider: "#1f2a3a",
  overlay: "rgba(3, 7, 18, 0.7)",
  focus: "#7a97ff",
  default: "#141d2f",
  primary: "#7a97ff",
  secondary: "#92abff",
  success: "#2dd4bf",
  warning: "#fbbf24",
  danger: "#f87171",
};

export default heroui({
  defaultTheme: "light",
  defaultExtendTheme: "light",
  themes: {
    light: {
      colors: lightColors,
      layout: baseLayout,
    },
    dark: {
      colors: darkColors,
      layout: {
        ...baseLayout,
        boxShadow: {
          small: "0 16px 32px rgba(0, 0, 0, 0.35)",
          medium: "0 16px 32px rgba(0, 0, 0, 0.35)",
          large: "0 24px 48px rgba(0, 0, 0, 0.45)",
        },
      },
    },
  },
});
