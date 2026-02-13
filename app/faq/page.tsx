import AppShell from "@/components/AppShell";
import FaqClient from "@/app/faq/FaqClient";

export default function FaqPage() {
  return (
    <AppShell active="faq" breadcrumb="Perguntas Frequentes">
      <FaqClient />
    </AppShell>
  );
}
