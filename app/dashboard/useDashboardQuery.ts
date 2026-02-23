"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardMetrics } from "@/app/dashboard/types";

/* ────────────────────────────────────────────────────────────── */
/*  Return type                                                   */
/* ────────────────────────────────────────────────────────────── */

export type DashboardQueryState = {
    period: number;
    setPeriod: (p: number) => void;
    includeInternal: boolean;
    setIncludeInternal: (v: boolean | ((prev: boolean) => boolean)) => void;
    metrics: DashboardMetrics | null;
    loading: boolean;
    error: string | null;
    reload: (targetPeriod?: number) => void;
};

/* ────────────────────────────────────────────────────────────── */
/*  Hook                                                          */
/* ────────────────────────────────────────────────────────────── */

export function useDashboardQuery(): DashboardQueryState {
    const [period, setPeriodState] = useState(30);
    const [includeInternal, setIncludeInternal] = useState(false);
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Request ID to prevent race conditions when switching periods fast
    const latestRequestId = useRef(0);

    const loadMetrics = useCallback(async (targetPeriod: number) => {
        const requestId = ++latestRequestId.current;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `/api/dashboard/metrics?period=${targetPeriod}`,
                { cache: "no-store" },
            );
            if (!res.ok) throw new Error("fetch_failed");
            const data: DashboardMetrics = await res.json();
            // Only apply if this is still the latest request
            if (requestId === latestRequestId.current) {
                setMetrics(data);
            }
        } catch (err) {
            if (requestId === latestRequestId.current) {
                console.error(err);
                setError("Não foi possível carregar o dashboard.");
            }
        } finally {
            if (requestId === latestRequestId.current) {
                setLoading(false);
            }
        }
    }, []);

    // Load on mount
    useEffect(() => {
        loadMetrics(period);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setPeriod = useCallback(
        (p: number) => {
            setPeriodState(p);
            loadMetrics(p);
        },
        [loadMetrics],
    );

    const reload = useCallback(
        (targetPeriod?: number) => {
            loadMetrics(targetPeriod ?? period);
        },
        [loadMetrics, period],
    );

    return {
        period,
        setPeriod,
        includeInternal,
        setIncludeInternal,
        metrics,
        loading,
        error,
        reload,
    };
}
