"use client";

import { LogOut, User } from "lucide-react";
import { signOutAction } from "@/app/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  email?: string | null;
};

export default function UserMenu({ email }: UserMenuProps) {
  const displayEmail = email ?? "Usuário";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <User className="h-4 w-4" />
        </span>
        <span className="hidden text-sm font-medium text-slate-700 sm:inline">
          {displayEmail}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Conta</DropdownMenuLabel>
        <div className="px-3 py-2 text-xs text-slate-500">{displayEmail}</div>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem type="submit">
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
