import { $Enums, User } from "@prisma/client";
import { GUARD_LABELS } from "../helpers/GuardHelper";
import { UserGuard } from "../types";
import React from "react";
import { GuardSelector } from "./GuardSelector";

interface IProps {
  guardType: $Enums.GuardType;
  guards: (Partial<UserGuard> & Pick<UserGuard, "date">)[];
  userList: Pick<User, "id" | "name">[];
  onChange: (
    date: Date,
    userId: User["id"] | null,
    guardType: $Enums.GuardType
  ) => void;
}

export function GuardsRow({ guardType, guards, userList, onChange }: IProps) {
  return (
    <tr className="odd:bg-white even:bg-gray-50">
      <th className="sticky left-0 z-10 bg-inherit border-b border-gray-200 text-right px-3 py-2 text-sm font-medium w-48">
        {GUARD_LABELS[guardType]}
      </th>
      {guards.map((guard, guardIndex) => (
        <td key={guardIndex} className="border-b border-gray-200 px-1 py-0.5">
          <GuardSelector
            guardId={guard?.id ?? null}
            onChange={(userId, guardType) => {
              onChange(guard.date, userId, guardType);
            }}
            guardType={guardType}
            selectedUser={guard?.user?.name ?? null}
            users={userList}
          />
        </td>
      ))}
    </tr>
  );
}
