"use client";

import { formatPrioridadeLabel } from "@/app/tickets/constants";
import { AppInput, AppSelect } from "@/app/ui";

type PeriodOption = "7" | "30" | "90" | "365" | "custom";
type PeriodOptionItem = { value: PeriodOption; label: string };

type FiltersState = {
  period: PeriodOption;
  motivo: string;
  prioridade: string;
  unidade: string;
  uso: string;
  uf: string;
  cidade: string;
  startDate: string;
  endDate: string;
};

type DashboardFiltersFormProps = {
  filters: FiltersState;
  periodOptions: readonly PeriodOptionItem[];
  motivos: readonly string[];
  prioridades: readonly string[];
  usoPlataforma: readonly string[];
  ufOptions: readonly string[];
  cidadesListId: string;
  onFilterChange: (patch: Partial<FiltersState>) => void;
  maskDateInput: (value: string) => string;
};

export default function DashboardFiltersForm({
  filters,
  periodOptions,
  motivos,
  prioridades,
  usoPlataforma,
  ufOptions,
  cidadesListId,
  onFilterChange,
  maskDateInput,
}: DashboardFiltersFormProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
      <div className="min-w-[160px] flex-1">
        <AppSelect
          label="Período"
          value={filters.period}
          onValueChange={(value) =>
            onFilterChange({ period: value as PeriodOption })
          }
          options={periodOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </div>

      {filters.period === "custom" ? (
        <div className="min-w-[260px] flex-1">
          <div className="grid gap-2 sm:grid-cols-2">
            <AppInput
              label="De"
              value={filters.startDate}
              onValueChange={(value) =>
                onFilterChange({
                  startDate: maskDateInput(value),
                })
              }
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
            />
            <AppInput
              label="Até"
              value={filters.endDate}
              onValueChange={(value) =>
                onFilterChange({
                  endDate: maskDateInput(value),
                })
              }
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
            />
          </div>
        </div>
      ) : null}

      <div className="min-w-[180px] flex-1">
        <AppSelect
          label="Motivo"
          placeholder="Todos"
          value={filters.motivo}
          onValueChange={(value) => onFilterChange({ motivo: value })}
          options={motivos.map((item) => ({ value: item, label: item }))}
        />
      </div>

      <div className="min-w-[160px] flex-1">
        <AppSelect
          label="Prioridade"
          placeholder="Todos"
          value={filters.prioridade}
          onValueChange={(value) => onFilterChange({ prioridade: value })}
          options={prioridades.map((item) => ({
            value: item,
            label: formatPrioridadeLabel(item),
          }))}
        />
      </div>

      <div className="min-w-[220px] flex-1">
        <AppInput
          label="Unidade"
          value={filters.unidade}
          onValueChange={(value) => onFilterChange({ unidade: value })}
          placeholder="Ex.: UBS Centro"
        />
      </div>

      <div className="min-w-[170px] flex-1">
        <AppSelect
          label="Uso da plataforma"
          placeholder="Todos"
          value={filters.uso}
          onValueChange={(value) => onFilterChange({ uso: value })}
          options={usoPlataforma.map((item) => ({ value: item, label: item }))}
        />
      </div>

      <div className="min-w-[110px] flex-1">
        <AppSelect
          label="UF"
          placeholder="Todos"
          value={filters.uf}
          onValueChange={(value) => onFilterChange({ uf: value, cidade: "" })}
          options={ufOptions.map((item) => ({ value: item, label: item }))}
        />
      </div>

      <div className="min-w-[180px] flex-1">
        <AppInput
          label="Cidade"
          value={filters.cidade}
          onValueChange={(value) => onFilterChange({ cidade: value })}
          list={cidadesListId}
          placeholder="Todas"
        />
      </div>
    </div>
  );
}
