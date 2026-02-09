import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taskflow Reports",
  description: "Painel interno de suporte TI",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logotsf.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/logotsf-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/logotsf-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/logotsf-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/logotsf-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("taskflow-theme");
    const theme = stored === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
