import { Guard, GuardType } from "@prisma/client";
import { dateToIndex } from "./Date";
import { UserGuard } from "../types";

export function mapGuardsToDays(
  dailyGuards: UserGuard[]
): Record<GuardType, UserGuard | null>[] {
  const daysInYear = new Date(2025, 11, 31).getDate() === 31 ? 365 : 366;

  const daysArray: Record<GuardType, UserGuard | null>[] = Array.from(
    { length: daysInYear },
    (_) => {
      return {
        GARDE_IRM_MATIN: null,
        GARDE_IRM_SOIR: null,
        GARDE_MATIN: null,
        GARDE_SOIR: null,
      };
    }
  );

  // Fill daysArray with daily guards
  dailyGuards.forEach((guard) => {
    const dayIndex = dateToIndex(guard.date);
    const guardDay = daysArray[dayIndex];
    guardDay[guard.guard] = guard;
  });

  return daysArray;
}

export const GUARD_LABELS: Record<Guard["guard"], string> = {
  GARDE_IRM_MATIN: "Matin IRM",
  GARDE_IRM_SOIR: "Soir IRM",
  GARDE_MATIN: "Matin",
  GARDE_SOIR: "Soir",
};
