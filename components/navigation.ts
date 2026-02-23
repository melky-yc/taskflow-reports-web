import type { SidebarItemType } from "@/components/layout/SidebarNav";

// Re-export the old type name for backward compatibility
export type { SidebarItemType as SidebarItem } from "@/components/layout/SidebarNav";

export const NAV_ITEMS: SidebarItemType[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", key: "dashboard" },
  { href: "/tickets", label: "Tickets", icon: "tickets", key: "tickets" },
  { href: "/units", label: "Unidades", icon: "building", key: "units" },
  { href: "/reports", label: "Relatórios", icon: "reports", key: "reports" },
  { href: "/faq", label: "FAQ", icon: "help", key: "faq" },
  { href: "/config", label: "Configuração", icon: "config", key: "config" },
];
