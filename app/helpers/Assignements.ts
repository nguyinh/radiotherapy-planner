import { $Enums } from "@prisma/client";
import { AssignmentsByUser, UserAssignments } from "../types";

export function formatUserAssignments(
  userWithAssignments: {
    id: number;
    name: string;
    email: string;
    assignments: {
      id: number;
      date: Date;
      task: $Enums.TaskType;
    }[];
  }[]
): UserAssignments[] {
  return userWithAssignments.map(({ assignments, ...user }) => ({
    user,
    assignments: assignments.map(({ id, date, task }) => ({
      id,
      date,
      task,
    })),
  }));
}

// export function groupAssignementsByUsers(
//   assignments: {
//     id: number;
//     date: Date;
//     task: $Enums.TaskType;
//     user: {
//       name: string;
//     };
//     userId: number;
//   }[]
// ): AssignmentsByUser {
//   return assignments.reduce<AssignmentsByUser>((acc, assignement) => {
//     const userName = assignement.user.name;
//     if (!acc[userName]) {
//       acc[userName] = [];
//     }
//     acc[userName].push(assignement);
//     return acc;
//   }, {});
// }

// export function sortByDate(
//   assignmentsByUser: AssignmentsByUser
// ): AssignmentsByUser {
//   return Object.entries(assignmentsByUser).reduce<AssignmentsByUser>(
//     (acc, [userName, assignments]) => {
//       acc[userName] = assignments.sort(
//         (a, b) => a.date.getTime() - b.date.getTime()
//       );
//       return acc;
//     },
//     {}
//   );
// }

export function mapToDaysArray<T extends { date: Date }>(
  items: T[],
  year: number
): (T | null)[] {
  // 1. Create an array of 365 (or 366 for leap year) days
  const daysInYear = new Date(year, 11, 31).getDate() === 31 ? 365 : 366;

  const daysArray: (T | null)[] = Array.from({ length: daysInYear }, (_) => {
    return null;
  });

  // 2. Map items into the correct day slot
  for (const item of items) {
    if (item.date.getFullYear() !== year) {
      continue;
    }

    const dayOfYear = Math.floor(
      (item.date.getTime() - new Date(year, 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    ); // 1..365

    const index = dayOfYear - 1;
    daysArray[index] = item;
  }

  return daysArray;
}
