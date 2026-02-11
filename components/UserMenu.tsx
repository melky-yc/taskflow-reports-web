"use client";

import { LogOut, User } from "lucide-react";
import { signOutAction } from "@/app/actions";
import {
  AppButton,
  AppDropdown,
  AppDropdownItem,
  AppDropdownMenu,
  AppDropdownSection,
  AppDropdownTrigger,
} from "@/app/ui";

type UserMenuProps = {
  email?: string | null;
};

export default function UserMenu({ email }: UserMenuProps) {
  const displayEmail = email ?? "Usuário";

  return (
    <>
      <form id="signout-form" action={signOutAction} className="hidden" />
      <AppDropdown>
        <AppDropdownTrigger>
          <AppButton
            variant="ghost"
            size="sm"
            className="h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm text-[var(--color-text)] shadow-sm hover:bg-[var(--color-muted-soft)] sm:px-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-muted-soft)] text-[var(--color-muted-strong)]">
              <User className="h-4 w-4" />
            </span>
            <span className="hidden max-w-[220px] truncate text-sm font-medium text-[var(--color-text)] md:inline">
              {displayEmail}
            </span>
          </AppButton>
        </AppDropdownTrigger>
        <AppDropdownMenu aria-label="Conta">
          <AppDropdownSection title="Conta" showDivider>
            <AppDropdownItem
              key="email"
              className="cursor-default"
              textValue={displayEmail}
            >
              <div className="text-xs text-[var(--color-muted)]">{displayEmail}</div>
            </AppDropdownItem>
          </AppDropdownSection>
          <AppDropdownItem
            key="logout"
            as="button"
            startContent={<LogOut className="h-4 w-4" />}
            onPress={() => {
              const form = document.getElementById("signout-form") as
                | HTMLFormElement
                | null;
              form?.requestSubmit();
            }}
          >
            Sair
          </AppDropdownItem>
        </AppDropdownMenu>
      </AppDropdown>
    </>
  );
}


