"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DropdownContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

function DropdownMenu({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className={cn("relative inline-flex", className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

type DropdownMenuTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ className, onClick, ...props }, ref) => {
  const context = React.useContext(DropdownContext);
  if (!context) return null;
  return (
    <button
      ref={ref}
      type="button"
      onClick={(event) => {
        onClick?.(event);
        context.setOpen(!context.open);
      }}
      className={cn(className)}
      {...props}
    />
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

type DropdownMenuContentProps = React.HTMLAttributes<HTMLDivElement>;

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, ...props }, ref) => {
  const context = React.useContext(DropdownContext);
  if (!context?.open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 top-12 z-50 min-w-[220px] rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 shadow-[var(--color-shadow)]",
        className
      )}
      {...props}
    />
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

type DropdownMenuItemProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ className, onClick, ...props }, ref) => {
  const context = React.useContext(DropdownContext);
  if (!context) return null;
  return (
    <button
      ref={ref}
      type="button"
      onClick={(event) => {
        onClick?.(event);
        context.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[color:var(--color-text)] hover:bg-[color:var(--color-muted-soft)]",
        className
      )}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-3 py-1 text-xs font-semibold uppercase text-[color:var(--color-muted)]",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("my-2 h-px bg-[color:var(--color-border)]", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
