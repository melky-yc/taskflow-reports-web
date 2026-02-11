"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AppButton } from "@/app/ui";
import { SidebarDrawer, type SidebarItem } from "@/components/ui/sidebar";

type MobileNavProps = {
  active: string;
  items: SidebarItem[];
};

export default function MobileNav({ active, items }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppButton
        variant="ghost"
        size="sm"
        className="h-10 w-10 p-0 lg:hidden"
        onPress={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </AppButton>

      <SidebarDrawer
        isOpen={open}
        onOpenChange={setOpen}
        items={items}
        activeKey={active}
      />
    </>
  );
}
