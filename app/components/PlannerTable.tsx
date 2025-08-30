"use client";

import React, { useRef, useMemo, useTransition } from "react";
import { formatDayHeader, isWeekend } from "../helpers/Date";
import type { UserAssignments } from "../types";
import { mapToDaysArray } from "../helpers/Assignements";
import { EditableBadge } from "./EditableBadge";
import { $Enums, User } from "@prisma/client";
import { setAssignment } from "../actions/assignments";
import { useRouter } from "next/navigation";

interface IProps {
  year: number;
  assignmentsByUsers: UserAssignments[];
  days: Date[];
}

export function PlannerTable({
  year,
  assignmentsByUsers,
  days,
}: // dailyGuards,
// onGuardChange,
IProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

  return (
    <div ref={containerRef} className="overflow-auto max-h-[72vh] min-h-[72vh]">
      <table className="min-w-full border-separate border-spacing-0">
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
            <th className="sticky left-0 z-30 bg-white border-b border-gray-200 text-left px-3 py-2">
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
          {assignmentsByUsers.map((assignmentsByUser) => {
            const { user, assignments } = assignmentsByUser;

            // Map assignments by date on array index with 0 being January 1st
            const assignmentsByDate = mapToDaysArray(assignments, year);

            return (
              <tr key={user.name} className="odd:bg-white even:bg-gray-50">
                <th className="sticky left-0 z-10 bg-inherit border-b border-gray-200 text-left px-3 py-2 text-sm font-medium w-48">
                  {user.name}
                </th>

                {assignmentsByDate.map((assignment, dateIndex) => (
                  <td
                    key={dateIndex}
                    className="border-b border-gray-200 px-1 py-0.5"
                  >
                    <EditableBadge
                      assignmentId={assignment?.id ?? null}
                      task={assignment?.task ?? null}
                      onChange={(selectedTaskType) =>
                        handleAssignmentChange(
                          new Date(year, 0, dateIndex + 1),
                          user.id,
                          selectedTaskType
                        )
                      }
                    />

                    {/* <div className="h-7 w-28 min-w-[7rem] rounded-md bg-gray-100" /> */}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
