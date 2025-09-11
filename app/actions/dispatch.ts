"use server";

import { GuardType, PrismaClient, TaskType } from "@prisma/client";
import { addDays, isBefore } from "date-fns";

const prisma = new PrismaClient();

interface GeneratedSchedule {
  assignments: {
    date: Date;
    task: TaskType;
    userId: number;
  }[];
  guards: {
    date: Date;
    guard: GuardType;
    userId: number;
  }[];
}

export async function generate(data: { startDate: Date; endDate: Date }) {
  console.log(data);

  const users = await prisma.user.findMany({
    where: {
      OR: [{ endDate: null }, { endDate: { gte: data.startDate } }],
    },
    // orderBy: { id: "asc" },
  });

  if (users.length === 0) throw new Error("No users available");

  await prisma.assignment.deleteMany({
    where: {
      date: { gte: data.startDate, lte: data.endDate },
    },
  });
  await prisma.guard.deleteMany({
    where: {
      date: { gte: data.startDate, lte: data.endDate },
    },
  });

  const assignments: GeneratedSchedule["assignments"] = [];
  const guards: GeneratedSchedule["guards"] = [];

  let day = new Date(data.startDate);
  let userIndex = 0;

  while (
    isBefore(day, data.endDate) ||
    day.getTime() === data.endDate.getTime()
  ) {
    // skip weekends (Sat=6, Sun=0)
    if (day.getDay() !== 0 && day.getDay() !== 6) {
      const user = users[userIndex % users.length];

      // Assign a task
      const taskTypes = Object.values(TaskType);
      const task =
        taskTypes[(assignments.length + userIndex) % taskTypes.length];
      assignments.push({
        date: new Date(day),
        task,
        userId: user.id,
      });

      // Assign a guard
      const guardTypes = [
        GuardType.GARDE_MATIN,
        GuardType.GARDE_SOIR,
        GuardType.GARDE_IRM_MATIN,
        GuardType.GARDE_IRM_SOIR,
      ];
      let guard: GuardType;

      // Check if yesterday evening guard prevents this morning
      const yesterday = addDays(day, -1);
      const hadEveningGuardYesterday = guards.some(
        (g) =>
          g.date.toDateString() === yesterday.toDateString() &&
          g.userId === user.id &&
          (g.guard === GuardType.GARDE_SOIR ||
            g.guard === GuardType.GARDE_IRM_SOIR)
      );

      if (hadEveningGuardYesterday) {
        guard = GuardType.GARDE_SOIR; // only evening allowed today
      } else {
        guard = guardTypes[(guards.length + userIndex) % guardTypes.length];
      }

      guards.push({
        date: new Date(day),
        guard,
        userId: user.id,
      });

      userIndex++;
    }
    day = addDays(day, 1);
  }

  // await prisma.assignment.createMany({ data: assignments });
  // await prisma.guard.createMany({ data: guards });

  console.log({ assignments: assignments.length, guards: guards.length });
  // console.log({ assignments, guards });

  return { assignments, guards };
}
