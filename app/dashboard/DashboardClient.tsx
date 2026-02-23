"use client";

import { PageHeader, AppCard, AppCardBody } from "@/app/ui";
import { useDashboardQuery } from "@/app/dashboard/useDashboardQuery";
import { useDashboardDerived } from "@/app/dashboard/useDashboardDerived";
import { DashboardControls } from "@/app/dashboard/components/DashboardControls";
import { DashboardKpiRow } from "@/app/dashboard/components/DashboardKpiRow";
import { Top3MotivosCard } from "@/app/dashboard/components/Top3MotivosCard";
import { TrendLineChart } from "@/app/dashboard/components/TrendLineChart";
import { UsagePieChart } from "@/app/dashboard/components/UsagePieChart";
import { UnidadeBarChart } from "@/app/dashboard/components/UnidadeBarChart";
import { TopClientesCard } from "@/app/dashboard/components/TopClientesCard";
import { ExecutiveSummaryCard } from "@/app/dashboard/components/ExecutiveSummaryCard";
import { RecentMotivosTable } from "@/app/dashboard/components/RecentMotivosTable";
import { DashboardSkeleton } from "@/app/dashboard/components/DashboardSkeleton";

/* ────────────────────────────────────────────────────────────── */
/*  Dashboard orchestrator                                        */
/* ────────────────────────────────────────────────────────────── */

export default function DashboardClient() {
  const query = useDashboardQuery();
  const derived = useDashboardDerived(
    query.metrics,
    query.period,
    query.includeInternal,
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header + controls */}
      <PageHeader
        title="Dashboard"
        subtitle="Painel analítico baseado em motivos (ticket_motivos)."
      />

      <DashboardControls
        period={query.period}
        setPeriod={query.setPeriod}
        includeInternal={query.includeInternal}
        setIncludeInternal={query.setIncludeInternal}
        onReload={query.reload}
        loading={query.loading}
        internalHiddenCount={derived.internalHiddenCount}
        sticky
      />

      {/* Error state */}
      {query.error ? (
        <AppCard className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
          <AppCardBody className="text-[var(--color-danger)]">{query.error}</AppCardBody>
        </AppCard>
      ) : null}

      {/* Loading skeleton */}
      {query.loading && !query.metrics ? <DashboardSkeleton /> : null}

      {/* Main content */}
      {query.metrics ? (
        <>
          <DashboardKpiRow
            currentTotals={derived.currentTotals}
            topMotivo={derived.topMotivo}
            concentration={derived.concentration}
            publicPct={derived.publicPct}
            internalPct={derived.internalPct}
            periodLabel={derived.periodLabel}
            growthTone={derived.growthTone}
          />

          <Top3MotivosCard items={derived.top3Motivos} />

          {/* Primary charts row */}
          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            <TrendLineChart data={derived.lineData} />
            <UsagePieChart data={derived.selectedByUso ?? []} />
          </div>

          {/* Secondary charts row */}
          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            <UnidadeBarChart data={derived.selectedByUnidade ?? []} />
            <TopClientesCard clients={derived.selectedTopClientes ?? []} />
          </div>

          {/* Summary + Recent */}
          <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
            <ExecutiveSummaryCard summary={derived.summary ?? []} />
            <RecentMotivosTable
              recent={derived.recentMotivos}
              loading={query.loading}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
