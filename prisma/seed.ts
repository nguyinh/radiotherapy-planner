// import { PrismaClient, Prisma } from "@prisma/client";

import { isWeekend } from "@/app/helpers/Date";
import { Guard, PrismaClient, User } from "@prisma/client";
// import { Prisma, PrismaClient } from "@prisma/client";
// import { PrismaClient } from "@prisma/client/edge";
// import { withAccelerate } from "@prisma/extension-accelerate";

// const prisma = new PrismaClient().$extends(withAccelerate());
const prisma = new PrismaClient();

const TASKS = [
  "VERIFICATION_DE_DOSSIERS_1",
  "VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ_1",
  "VERIFICATION_DE_DOSSIERS_2",
  "VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ_2",
  "GARDE_APPAREIL",
  "CURIETHERAPIE",
  "GESTION_CQ_APPAREIL",
  "SUPPORT_DOSIMETRIE",
] as const;

const GUARDS = [
  "GARDE_MATIN",
  "GARDE_SOIR",
  "GARDE_IRM_MATIN",
  "GARDE_IRM_SOIR",
] as const;

const USERS = [
  { name: "Roxane", email: "roxane.lahady@curie.fr" },
  { name: "Rezart", email: "rezart.belchi@curie.fr" },
  { name: "Claire", email: "claire.dupont@curie.fr" },
  { name: "Julien", email: "julien.martin@curie.fr" },
  { name: "Sophie", email: "sophie.morel@curie.fr" },
  { name: "Antoine", email: "antoine.lefevre@curie.fr" },
  { name: "Isabelle", email: "isabelle.leroy@curie.fr" },
  { name: "Thomas", email: "thomas.benoit@curie.fr" },
];

function generateWeeklyAssignments(year: number, userIndex: number) {
  const assignments = [];
  let taskIndex = userIndex % TASKS.length; // each user starts at a different task

  for (let week = 0; week < 52; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(year, 0, 1 + week * 7 + day); // Monday of each week
      if (date.getDay() === 0) {
        taskIndex = (taskIndex + 1) % TASKS.length;
      } // roll to next task

      if (isWeekend(date)) continue; // skip weekends
      assignments.push({
        date,
        task: TASKS[taskIndex],
      });
    }
  }

  return assignments;
}

function generateYearlyGuards(users: User[], year: number) {
  const guards: Pick<Guard, "date" | "guard" | "userId">[] = [];

  const start = new Date(year, 0, 1);

  // aller semaine par semaine
  for (let week = 0; week < 52; week++) {
    const monday = new Date(start);
    monday.setDate(start.getDate() + week * 7);

    // Les 5 jours ouvrés de la semaine
    const weekdays: Date[] = [];
    for (let offset = 0; offset < 7; offset++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + offset);
      if (!isWeekend(d)) weekdays.push(d);
      if (weekdays.length === 5) break;
    }

    // Distribution : chaque user = 1 matin + 1 soir
    users.forEach((user, i) => {
      const matinDay = weekdays[i % 5]; // tourne sur les 5 jours
      const soirDay = weekdays[(i + 2) % 5]; // un autre jour de la semaine

      // matin
      guards.push({
        date: matinDay,
        guard: i % 2 === 0 ? "GARDE_MATIN" : "GARDE_IRM_MATIN",
        userId: user.id,
      });

      // soir
      guards.push({
        date: soirDay,
        guard: i % 2 === 0 ? "GARDE_SOIR" : "GARDE_IRM_SOIR",
        userId: user.id,
      });
    });
  }

  return guards;
}

export async function main() {
  await prisma.user.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.guard.deleteMany();

  const year = 2025;
  // const assignmentsPerUser = 365;

  for (const [index, user] of USERS.entries()) {
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        assignments: {
          create: generateWeeklyAssignments(year, index),
        },
      },
    });
  }

  const users = await prisma.user.findMany();

  const guards = generateYearlyGuards(users, year);
  await prisma.guard.createMany({
    data: guards.map((guard) => ({
      date: guard.date,
      guard: guard.guard,
      userId: guard.userId,
    })),
  });
}

main();
