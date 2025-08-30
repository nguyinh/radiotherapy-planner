"use server";

import { $Enums, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function setAssignment(data: {
  userId: number;
  taskType: $Enums.TaskType | null;
  date: Date;
}) {
  if (!data.taskType) {
    return prisma.assignment.delete({
      where: {
        date_userId: {
          date: data.date,
          userId: data.userId,
        },
      },
    });
  }

  return prisma.assignment.upsert({
    where: {
      date_userId: {
        date: data.date,
        userId: data.userId,
      },
    },
    update: {
      task: data.taskType,
      date: data.date,
    },
    create: {
      task: data.taskType,
      date: data.date,
      userId: data.userId,
    },
  });
}
