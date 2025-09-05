import React from "react";
import { mapToDaysArray } from "../helpers/Assignements";
import { EditableBadge } from "./EditableBadge";
import { UserAssignments } from "../types";
import { $Enums } from "@prisma/client";

interface IProps extends UserAssignments {
  year: number;
  onAssignmentChange: (
    date: Date,
    userId: UserAssignments["user"]["id"],
    taskType: $Enums.TaskType | null
  ) => void;
}

export function UserTasks({
  user,
  assignments,
  year,
  onAssignmentChange,
}: IProps) {
  // Map assignments by date on array index with 0 being January 1st
  const assignmentsByDate = mapToDaysArray(assignments, year);

  return (
    <tr key={user.name} className="odd:bg-white even:bg-gray-50">
      <th className="sticky left-0 z-10 bg-inherit border-b border-gray-200 text-right px-3 py-2 text-sm font-medium w-48">
        {user.name}
      </th>

      {assignmentsByDate.map((assignment, dateIndex) => (
        <td key={dateIndex} className="border-b border-gray-200 px-1 py-0.5">
          <EditableBadge
            assignmentId={assignment?.id ?? null}
            task={assignment?.task ?? null}
            onChange={(selectedTaskType) =>
              onAssignmentChange(
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
}
