"use client";

import { useMemo, useState } from "react";
import { AREA_ATUACAO_OPTIONS } from "@/app/tickets/constants";
import {
    formatDateBrFromDate,
    formatMonthYear,
    maskDateInput,
    maskMonthInput,
} from "@/app/reports/helpers";
import {
    AppBadge,
    AppButton,
    AppInput,
    AppSelect,
    FormCard,
    PageHeader,
    Section,
} from "@/app/ui";

export type Period = "daily" | "weekly" | "monthly" | "yearly";
export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: "daily", label: "Diário" },
    { value: "weekly", label: "Semanal (últimos 7 dias)" },
    { value: "monthly", label: "Mensal" },
    { value: "yearly", label: "Anual" },
];
export const ALL_SEGMENT_OPTION = "all";

type ProfessionalOption = {
    id: string;
    name: string;
};

export type ReportsFilterFormProps = {
    professionals: ProfessionalOption[];
    isLoadingProfessionals: boolean;
    loading: boolean;
    onGenerate: (opts: {
        period: Period;
        baseDate: string;
        monthValue: string;
        yearValue: string;
        profissionalId: string;
        areaAtuacao: string;
    }) => void;
};

export function ReportsFilterForm({
    professionals,
    isLoadingProfessionals,
    loading,
    onGenerate,
}: ReportsFilterFormProps) {
    const today = useMemo(() => new Date(), []);
    const [period, setPeriod] = useState<Period>("daily");
    const [baseDate, setBaseDate] = useState(formatDateBrFromDate(today));
    const [monthValue, setMonthValue] = useState(formatMonthYear(today));
    const [yearValue, setYearValue] = useState(String(today.getFullYear()));
    const [selectedProfissionalId, setSelectedProfissionalId] = useState(ALL_SEGMENT_OPTION);
    const [selectedAreaAtuacao, setSelectedAreaAtuacao] = useState(ALL_SEGMENT_OPTION);

    const professionalSelectOptions = useMemo(
        () => [
            { value: ALL_SEGMENT_OPTION, label: "Todos" },
            ...professionals.map((p) => ({ value: p.id, label: p.name })),
        ],
        [professionals],
    );

    const areaSelectOptions = useMemo(
        () => [
            { value: ALL_SEGMENT_OPTION, label: "Todas" },
            ...AREA_ATUACAO_OPTIONS.map((a) => ({ value: a, label: a })),
        ],
        [],
    );

    const selectedProfessionalName = useMemo(
        () => professionals.find((p) => p.id === selectedProfissionalId)?.name ?? "",
        [professionals, selectedProfissionalId],
    );

    const hasActiveSegmentationFilters =
        selectedProfissionalId !== ALL_SEGMENT_OPTION ||
        selectedAreaAtuacao !== ALL_SEGMENT_OPTION;

    const clearSegmentationFilters = () => {
        setSelectedProfissionalId(ALL_SEGMENT_OPTION);
        setSelectedAreaAtuacao(ALL_SEGMENT_OPTION);
    };

    const handleGenerate = () => {
        onGenerate({
            period,
            baseDate,
            monthValue,
            yearValue,
            profissionalId: selectedProfissionalId,
            areaAtuacao: selectedAreaAtuacao,
        });
    };

    return (
        <>
            <PageHeader
                title="Relatórios"
                subtitle="Gere relatórios por período e acompanhe as principais métricas."
            />

            <FormCard
                title="Gerador de relatórios"
                description="Selecione o período e aplique filtros para segmentar os dados."
            >
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
                        <div className="flex flex-1 flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:gap-6">
                            <div className="min-w-[200px] flex-1">
                                <AppSelect
                                    label="Período"
                                    value={period}
                                    onValueChange={(value) => setPeriod(value as Period)}
                                    options={PERIOD_OPTIONS.map((o) => ({
                                        value: o.value,
                                        label: o.label,
                                    }))}
                                />
                            </div>

                            {(period === "daily" || period === "weekly") && (
                                <div className="min-w-[200px] flex-1">
                                    <AppInput
                                        label="Data base"
                                        value={baseDate}
                                        onValueChange={(value) => setBaseDate(maskDateInput(value))}
                                        placeholder="DD/MM/AAAA"
                                        inputMode="numeric"
                                    />
                                </div>
                            )}

                            {period === "monthly" && (
                                <div className="min-w-[200px] flex-1">
                                    <AppInput
                                        label="Mês/Ano"
                                        value={monthValue}
                                        onValueChange={(value) => setMonthValue(maskMonthInput(value))}
                                        placeholder="MM/AAAA"
                                        inputMode="numeric"
                                    />
                                </div>
                            )}

                            {period === "yearly" && (
                                <div className="min-w-[160px] flex-1">
                                    <AppInput
                                        label="Ano"
                                        value={yearValue}
                                        onValueChange={(value) =>
                                            setYearValue(value.replace(/\D/g, "").slice(0, 4))
                                        }
                                        placeholder="AAAA"
                                        inputMode="numeric"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex md:justify-end">
                            <AppButton
                                type="button"
                                onPress={handleGenerate}
                                isLoading={loading}
                                isDisabled={loading}
                                className="w-full md:w-auto"
                            >
                                {loading ? "Gerando..." : "Gerar relatório"}
                            </AppButton>
                        </div>
                    </div>

                    <Section
                        title="Segmentação"
                        description="Filtre por profissional e área de atuação. Esses filtros são aplicados junto com o período."
                        showDivider={false}
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <AppSelect
                                label="Profissional"
                                placeholder="Todos"
                                value={selectedProfissionalId}
                                onValueChange={setSelectedProfissionalId}
                                options={professionalSelectOptions}
                                helperText={
                                    isLoadingProfessionals
                                        ? "Carregando profissionais..."
                                        : "Com o menu aberto, digite para navegação rápida (typeahead)."
                                }
                                isDisabled={isLoadingProfessionals}
                            />
                            <AppSelect
                                label="Área de atuação"
                                placeholder="Todas"
                                value={selectedAreaAtuacao}
                                onValueChange={setSelectedAreaAtuacao}
                                options={areaSelectOptions}
                            />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {hasActiveSegmentationFilters ? (
                                <>
                                    {selectedProfissionalId !== ALL_SEGMENT_OPTION ? (
                                        <AppBadge tone="primary" variant="soft" size="sm">
                                            Profissional: {selectedProfessionalName || selectedProfissionalId}
                                        </AppBadge>
                                    ) : null}
                                    {selectedAreaAtuacao !== ALL_SEGMENT_OPTION ? (
                                        <AppBadge tone="warning" variant="soft" size="sm">
                                            Área: {selectedAreaAtuacao}
                                        </AppBadge>
                                    ) : null}
                                    <AppButton
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onPress={clearSegmentationFilters}
                                    >
                                        Limpar filtros
                                    </AppButton>
                                </>
                            ) : (
                                <AppBadge tone="default" variant="soft" size="sm">
                                    Sem segmentação ativa
                                </AppBadge>
                            )}
                        </div>
                    </Section>
                </div>
            </FormCard>
        </>
    );
}
