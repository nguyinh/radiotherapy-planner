"use client";

import React, { useRef, useMemo, useTransition } from "react";
import { formatDayHeader, indexToDate, isWeekend } from "../helpers/Date";
import type { UserAssignments, UserGuard } from "../types";
import { $Enums, User } from "@prisma/client";
import { setAssignment } from "../actions/assignments";
import { useRouter } from "next/navigation";
import { UserTasks } from "./UserTasks";
import { mapGuardsToDays } from "../helpers/GuardHelper";
import { GuardsRow } from "./GuardsRow";
import { setGuard } from "../actions/guards";

interface IProps {
  year: number;
  assignmentsByUsers: UserAssignments[];
  days: Date[];
  groupedDailyGuards: ReturnType<typeof mapGuardsToDays>;
  userList: Pick<User, "id" | "name">[];
}

export function PlannerTable({
  year,
  assignmentsByUsers,
  days,
  groupedDailyGuards,
  userList,
}: IProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  console.log({ isPending });

  const containerRef = useRef<HTMLDivElement | null>(null);

  const months = useMemo(() => {
    // Découpage par mois pour intercalage d'en-têtes
    const groups: { month: number; days: Date[] }[] = [];
    for (const d of days) {
      const m = d.getMonth();
      const g = groups.find((x) => x.month === m);
      if (g) g.days.push(d);
      else groups.push({ month: m, days: [d] });
    }
    return groups;
  }, [days]);

  const handleAssignmentChange = (
    date: Date,
    userId: User["id"],
    taskType: $Enums.TaskType | null
  ) => {
    console.log({ date, userId, taskType });

    startTransition(() => {
      setAssignment({ date, userId, taskType });
      router.refresh();
    });
  };

  const handleGuardChange = (
    date: Date,
    userId: User["id"] | null,
    guardType: $Enums.GuardType
  ) => {
    console.log({ date, userId, guardType });

    startTransition(() => {
      setGuard({ date, userId, guardType });
      router.refresh();
    });
  };

  const morningGuards = groupedDailyGuards.map<
    Partial<UserGuard> & Pick<UserGuard, "date">
  >((guard, guardIndex) => {
    return guard.GARDE_MATIN
      ? guard.GARDE_MATIN
      : {
          date: indexToDate(guardIndex, year),
        };
  });
  const eveningGuards = groupedDailyGuards.map<
    Partial<UserGuard> & Pick<UserGuard, "date">
  >((guard, guardIndex) => {
    return guard.GARDE_SOIR
      ? guard.GARDE_SOIR
      : {
          date: indexToDate(guardIndex, year),
        };
  });
  const morningMriGuards = groupedDailyGuards.map<
    Partial<UserGuard> & Pick<UserGuard, "date">
  >((guard, guardIndex) => {
    return guard.GARDE_IRM_MATIN
      ? guard.GARDE_IRM_MATIN
      : {
          date: indexToDate(guardIndex, year),
        };
  });
  const eveningMriGuards = groupedDailyGuards.map<
    Partial<UserGuard> & Pick<UserGuard, "date">
  >((guard, guardIndex) => {
    return guard.GARDE_IRM_SOIR
      ? guard.GARDE_IRM_SOIR
      : {
          date: indexToDate(guardIndex, year),
        };
  });

  return (
    <div ref={containerRef} className="overflow-auto max-h-[72vh] min-h-dvh">
      <table className="min-w-full border-separate border-spacing-0 text-xs">
        <thead className="sticky top-0 z-20">
          {/* Ligne mois */}
          <tr>
            {/* <th className="sticky left-0 z-30 bg-white border-b border-gray-200 text-left px-3 py-2 w-48">
              Personne
            </th> */}
            {months.map((m) => (
              <th
                key={m.month}
                colSpan={m.days.length}
                className="bg-white border-b border-gray-200 px-1 py-2 text-sm font-semibold text-gray-700"
              >
                {new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
                  new Date(year, m.month, 1)
                )}
              </th>
            ))}
          </tr>
          {/* Ligne jours */}
          <tr>
            <th className="sticky left-0 z-30 min-w-32 bg-white border-b border-gray-200 text-left px-3 py-2">
              &nbsp;
            </th>
            {days.map((d, idx) => {
              const weekend = isWeekend(d);
              const isMon = d.getDay() === 1;
              return (
                <th
                  key={idx}
                  className={
                    `text-[11px] font-medium border-b border-gray-200 text-gray-400 px-1 py-1 ${
                      weekend ? "bg-gray-100 text-gray-500" : "bg-white"
                    } ` + (isMon ? "border-l-2 border-l-gray-300" : "")
                  }
                >
                  {formatDayHeader(d)}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          <GuardsRow
            guardType={$Enums.GuardType.GARDE_MATIN}
            guards={morningGuards}
            userList={userList}
            onChange={(date, userId, guardType) => {
              handleGuardChange(date, userId, guardType);
            }}
          />
          <GuardsRow
            guardType={$Enums.GuardType.GARDE_SOIR}
            guards={eveningGuards}
            userList={userList}
            onChange={(date, userId, guardType) => {
              handleGuardChange(date, userId, guardType);
            }}
          />
          <GuardsRow
            guardType={$Enums.GuardType.GARDE_IRM_MATIN}
            guards={morningMriGuards}
            userList={userList}
            onChange={(date, userId, guardType) => {
              handleGuardChange(date, userId, guardType);
            }}
          />
          <GuardsRow
            guardType={$Enums.GuardType.GARDE_IRM_SOIR}
            guards={eveningMriGuards}
            userList={userList}
            onChange={(date, userId, guardType) => {
              handleGuardChange(date, userId, guardType);
            }}
          />

          {/* TODO: add divider */}

          {assignmentsByUsers.map((assignmentsByUser) => (
            <UserTasks
              key={assignmentsByUser.user.id}
              year={year}
              onAssignmentChange={handleAssignmentChange}
              user={assignmentsByUser.user}
              assignments={assignmentsByUser.assignments}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
