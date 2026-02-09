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
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-() bg-() px-3 py-1.5 text-sm text-() shadow-sm hover:bg-()">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-() text-()">
          <User className="h-4 w-4" />
        </span>
        <span className="hidden text-sm font-medium text-() sm:inline">
          {displayEmail}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Conta</DropdownMenuLabel>
        <div className="px-3 py-2 text-xs text-()">
          {displayEmail}
        </div>
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

