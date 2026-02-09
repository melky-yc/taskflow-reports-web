"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, LayoutDashboard, Menu, Settings, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/tickets", label: "Tickets", icon: Ticket, key: "tickets" },
  { href: "/reports", label: "Relatï¿½rios", icon: BarChart3, key: "reports" },
  { href: "/config", label: "Configuraï¿½ï¿½o", icon: Settings, key: "config" },
] as const;

type MobileNavProps = {
  active: string;
};

export default function MobileNav({ active }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <Button
        variant="ghost"
        className="h-10 w-10 p-0 lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-overlay" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-() bg-() p-5 shadow-()">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-()">
                Menu
              </div>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="mt-6 flex flex-col gap-2 text-sm">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 font-medium transition ${
                      isActive
                        ? "bg-() text-()"
                        : "text-() hover:bg-()"
                    }`}
                  >
                    <span
                      className={`h-4 w-1 rounded-full ${
                        isActive
                          ? "bg-()"
                          : "bg-transparent"
                      }`}
                    />
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

