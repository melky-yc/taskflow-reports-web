"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type AlertTone = "success" | "info" | "warning" | "danger";

type AlertInput = {
  title: string;
  description?: string;
  tone?: AlertTone;
  durationMs?: number;
};

type AlertMessage = AlertInput & {
  id: string;
};

type AlertsContextValue = {
  notify: (input: AlertInput) => void;
  dismiss: (id: string) => void;
};

const AlertsContext = createContext<AlertsContextValue | null>(null);

const TONE_STYLES: Record<AlertTone, string> = {
  success: "border-[var(--color-success)] bg-[var(--color-success-soft)]",
  info: "border-[var(--color-primary)] bg-[var(--color-primary-soft)]",
  warning: "border-[var(--color-warning)] bg-[var(--color-warning-soft)]",
  danger: "border-[var(--color-danger)] bg-[var(--color-danger-soft)]",
};

const TONE_TITLE: Record<AlertTone, string> = {
  success: "text-[var(--color-success)]",
  info: "text-[var(--color-primary)]",
  warning: "text-[var(--color-warning)]",
  danger: "text-[var(--color-danger)]",
};

const TONE_DESC: Record<AlertTone, string> = {
  success: "text-[var(--color-success)]",
  info: "text-[var(--color-primary)]",
  warning: "text-[var(--color-warning)]",
  danger: "text-[var(--color-danger)]",
};

function buildId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((item) => item.id !== id));
    const timer = timersRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timersRef.current[id];
    }
  }, []);

  const notify = useCallback(
    ({ title, description, tone = "info", durationMs = 3000 }: AlertInput) => {
      const id = buildId();
      setAlerts((prev) => [
        ...prev,
        { id, title, description, tone, durationMs },
      ]);

      if (durationMs > 0) {
        timersRef.current[id] = window.setTimeout(() => {
          dismiss(id);
        }, durationMs);
      }
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <AlertsContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {alerts.map((alert) => {
          const tone = alert.tone ?? "info";
          return (
            <div key={alert.id} className="pointer-events-auto">
              <Alert className={cn("relative", TONE_STYLES[tone])}>
                <button
                  type="button"
                  onClick={() => dismiss(alert.id)}
                  className="absolute right-3 top-3 rounded-full p-1 text-[var(--color-muted)] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  aria-label="Fechar alerta"
                >
                  <X className="h-4 w-4" />
                </button>
                <AlertTitle className={cn("pr-6", TONE_TITLE[tone])}>
                  {alert.title}
                </AlertTitle>
                {alert.description ? (
                  <AlertDescription className={cn(TONE_DESC[tone])}>
                    {alert.description}
                  </AlertDescription>
                ) : null}
              </Alert>
            </div>
          );
        })}
      </div>
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error("useAlerts must be used within AlertsProvider");
  }
  return context;
}
