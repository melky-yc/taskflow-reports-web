"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type PeriodOption = "7" | "30" | "90" | "365" | "custom";
type PeriodOptionItem = { value: PeriodOption; label: string };

type FiltersState = {
  period: PeriodOption;
  motivo: string;
  prioridade: string;
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
      <div className="min-w-[160px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-muted-strong)]">
          Período
        </label>
        <Select
          value={filters.period}
          onChange={(event) =>
            onFilterChange({ period: event.target.value as PeriodOption })
          }
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {filters.period === "custom" ? (
        <div className="min-w-[260px] flex-1 space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-muted-strong)]">
            Intervalo
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={filters.startDate}
              onChange={(event) =>
                onFilterChange({
                  startDate: maskDateInput(event.target.value),
                })
              }
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
            />
            <Input
              value={filters.endDate}
              onChange={(event) =>
                onFilterChange({
                  endDate: maskDateInput(event.target.value),
                })
              }
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
            />
          </div>
        </div>
      ) : null}

      <div className="min-w-[180px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-muted-strong)]">
          Motivo
        </label>
        <Select
          value={filters.motivo}
          onChange={(event) => onFilterChange({ motivo: event.target.value })}
        >
          <option value="">Todos</option>
          {motivos.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      <div className="min-w-[160px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-muted-strong)]">
          Prioridade
        </label>
        <Select
          value={filters.prioridade}
          onChange={(event) => onFilterChange({ prioridade: event.target.value })}
        >
          <option value="">Todos</option>
          {prioridades.map((item) => (
            <option key={item} value={item}>
              {item === "Media" ? "Média" : item}
            </option>
          ))}
        </Select>
      </div>

      <div className="min-w-[170px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-muted-strong)]">
          Uso da plataforma
        </label>
        <Select
          value={filters.uso}
          onChange={(event) => onFilterChange({ uso: event.target.value })}
        >
          <option value="">Todos</option>
          {usoPlataforma.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      <div className="min-w-[110px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-muted-strong)]">
          UF
        </label>
        <Select
          value={filters.uf}
          onChange={(event) =>
            onFilterChange({ uf: event.target.value, cidade: "" })
          }
        >
          <option value="">Todos</option>
          {ufOptions.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </Select>
      </div>

      <div className="min-w-[180px] flex-1 space-y-1.5">
        <label className="text-xs font-medium text-[var(--color-muted-strong)]">
          Cidade
        </label>
        <Input
          value={filters.cidade}
          onChange={(event) => onFilterChange({ cidade: event.target.value })}
          list={cidadesListId}
          placeholder="Todas"
        />
      </div>
    </div>
  );
}