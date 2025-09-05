"use server";

import { $Enums, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function setGuard(data: {
  userId: number | null;
  guardType: $Enums.GuardType;
  date: Date;
}) {
  if (!data.userId) {
    return prisma.guard.delete({
      where: {
        date_guard: {
          date: data.date,
          guard: data.guardType,
        },
      },
    });
  }

  return prisma.guard.upsert({
    where: {
      date_guard: {
        date: data.date,
        guard: data.guardType,
      },
    },
    update: {
      userId: data.userId,
      date: data.date,
    },
    create: {
      guard: data.guardType,
      date: data.date,
      userId: data.userId,
    },
  });
}
