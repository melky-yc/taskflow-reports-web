import type { NameStatus } from "./constants";

export type Unit = {
  id: number;
  unit_name: string | null;
  name_status: NameStatus;
  name_note: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

