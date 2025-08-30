import { Assignment } from "@prisma/client";

export const TASK_COLORS: Record<Assignment["task"], string> = {
  VERIFICATION_DE_DOSSIERS_1: "bg-blue-100 text-blue-900 border-blue-200",
  VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ_1:
    "bg-emerald-100 text-emerald-900 border-emerald-200",
  VERIFICATION_DE_DOSSIERS_2: "bg-blue-100 text-blue-900 border-blue-200",
  VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ_2:
    "bg-emerald-100 text-emerald-900 border-emerald-200",
  GARDE_APPAREIL: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200",
  CURIETHERAPIE: "bg-amber-100 text-amber-900 border-amber-200",
  GESTION_CQ_APPAREIL: "bg-sky-100 text-sky-900 border-sky-200",
  SUPPORT_DOSIMETRIE: "bg-rose-100 text-rose-900 border-rose-200",
};

export const TASK_LABELS: Record<Assignment["task"], string> = {
  VERIFICATION_DE_DOSSIERS_1: "Vérification de dossiers 1",
  VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ_1:
    "Validations de dossiers et préparation CQ 1",
  VERIFICATION_DE_DOSSIERS_2: "Vérification de dossiers 2",
  VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ_2:
    "Validations de dossiers et préparation CQ 2",
  GARDE_APPAREIL: "Garde appareil",
  CURIETHERAPIE: "Curithérapie",
  GESTION_CQ_APPAREIL: "Gestion CQ appareil",
  SUPPORT_DOSIMETRIE: "Support dosimétrie",
};
