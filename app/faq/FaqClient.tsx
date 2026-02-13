"use client";

import { useMemo, useState } from "react";
import {
  AppAccordion,
  AppAccordionItem,
  AppBadge,
  AppCard,
  AppCardBody,
  AppInput,
  PageHeader,
} from "@/app/ui";
import { FAQ_ITEMS, FAQ_SECTIONS } from "@/app/faq/constants";

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function FaqClient() {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeForSearch(query.trim());
    if (!normalizedQuery) return FAQ_ITEMS;

    return FAQ_ITEMS.filter((item) => {
      const searchable = [item.question, item.section, ...item.answer].join(" ");
      return normalizeForSearch(searchable).includes(normalizedQuery);
    });
  }, [query]);

  const grouped = useMemo(() => {
    return FAQ_SECTIONS.map((section) => ({
      section,
      items: filteredItems.filter((item) => item.section === section),
    })).filter((group) => group.items.length > 0);
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perguntas Frequentes"
        subtitle="Guia operacional rápido para cadastro correto de chamados no Taskflow Reports."
      />

      <AppCard>
        <AppCardBody className="space-y-4 p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-[2fr,1fr] md:items-end">
            <AppInput
              label="Buscar dúvida"
              placeholder="Ex.: secretaria, unidade afetada, retroativo"
              value={query}
              onValueChange={setQuery}
            />
            <div className="flex flex-wrap items-center gap-2">
              <AppBadge tone="default" variant="soft" size="sm">
                {filteredItems.length} itens encontrados
              </AppBadge>
            </div>
          </div>

          {grouped.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-4 py-6 text-sm text-[var(--color-muted-strong)]">
              Nenhuma pergunta encontrada para esse termo.
            </div>
          ) : (
            <div className="space-y-4">
              {grouped.map((group) => (
                <section key={group.section} className="space-y-2">
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">
                    {group.section}
                  </h2>
                  <AppAccordion
                    variant="splitted"
                    selectionMode="multiple"
                  >
                    {group.items.map((item) => (
                      <AppAccordionItem key={item.id} aria-label={item.question} title={item.question}>
                        <div className="space-y-2">
                          {item.answer.map((paragraph, index) => (
                            <p key={`${item.id}-${index}`}>{paragraph}</p>
                          ))}
                        </div>
                      </AppAccordionItem>
                    ))}
                  </AppAccordion>
                </section>
              ))}
            </div>
          )}
        </AppCardBody>
      </AppCard>
    </div>
  );
}
