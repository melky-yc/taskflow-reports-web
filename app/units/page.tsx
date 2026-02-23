import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import UnitsClient from "@/app/units/UnitsClient";
import type { Unit } from "@/app/units/types";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  status?: string;
  error?: string;
}>;

export default async function UnitsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : undefined;
  const status = params?.status ?? "";
  const error = params?.error ?? "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("units")
    .select("id, unit_name, name_status, name_note, created_at, updated_at")
    .order("id", { ascending: false })
    .limit(500);

  const units: Unit[] =
    (data ?? []).map((item) => ({
      id: item.id as number,
      unit_name: (item.unit_name as string | null) ?? null,
      name_status: item.name_status as Unit["name_status"],
      name_note: (item.name_note as string | null) ?? null,
      created_at: (item.created_at as string | null) ?? null,
      updated_at: (item.updated_at as string | null) ?? null,
    })) ?? [];

  return (
    <AppShell active="units" breadcrumb="Unidades">
      <UnitsClient units={units} status={status} error={error} />
    </AppShell>
  );
}

