# App UI (HeroUI wrappers)

Esta pasta concentra a camada de Design System do app. As paginas devem consumir apenas os wrappers do app (nao use `@heroui/react` direto fora de `app/ui`).

## Uso rapido

```tsx
import {
  AppButton,
  AppInput,
  AppSelect,
  AppCard,
  AppCardHeader,
  AppCardBody,
  AppCardTitle,
  AppModal,
  StatusBadge,
} from "@/app/ui";

<AppButton variant="solid">Salvar</AppButton>
<AppInput label="Email" placeholder="nome@empresa.com" />
<AppSelect
  label="Prioridade"
  name="prioridade"
  options={[
    { value: "Baixa", label: "Baixa" },
    { value: "Media", label: "Media" },
    { value: "Alta", label: "Alta" },
  ]}
  onValueChange={(value) => console.log(value)}
/>

<AppCard>
  <AppCardHeader>
    <AppCardTitle>Resumo</AppCardTitle>
  </AppCardHeader>
  <AppCardBody>Conteudo</AppCardBody>
</AppCard>

<StatusBadge status="Alta" />
```

## Criar um novo componente padrao

1. Crie o wrapper em `app/ui` usando componentes do HeroUI.
2. Aplique tokens do app (cores, radius, sombras) via classes.
3. Exporte no `app/ui/index.ts`.
4. Atualize exemplos/README se necessario.

## Regra de governanca

- **Nao** importar `@heroui/react` diretamente em paginas/rotas.
- Use apenas wrappers do app em `app/ui`.
- Existe regra de lint para bloquear imports diretos.

## Onde ajustar tokens

- Tokens de design: `app/ui/tokens.ts`
- Variaveis CSS globais: `app/globals.css`
- Tema do HeroUI (cores/layout): `hero.mjs`
