// import { PrismaClient, Prisma } from "@prisma/client";

import { isWeekend } from "@/app/helpers/Date";
import { PrismaClient } from "@prisma/client";
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

// TODO: Fix guard generation
function generateDailyGuards(year: number, userIndex: number) {
  const guards = [];
  let guardIndex = userIndex % GUARDS.length; // each user starts at a different guard

  for (let week = 0; week < 52; week++) {
    for (let day = 0; day < 7; day++) {
      // For each guard type
      for (const guard of GUARDS) {
        const date = new Date(year, 0, 1 + week * 7 + day); // Monday of each week
        if (isWeekend(date)) continue; // skip weekends
        guards.push({
          date,
          guard,
        });
      }
      guardIndex = (guardIndex + 1) % GUARDS.length; // roll to next guard
    }
  }

  console.log(guards);

  return guards;
}

export async function main() {
  await prisma.user.deleteMany();
  await prisma.assignment.deleteMany();

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
        // guards: {
        //   create: generateDailyGuards(year, index),
        // },
      },
    });
  }

  // for (const user of USERS) {
  //   await prisma.user.create({
  //     data: {
  //       name: user.name,
  //       email: user.email,
  //       assignments: {
  //         create: generateWeeklyAssignments(year, assignmentsPerUser),
  //       },
  //     },
  //   });
  // }

  // await prisma.user.create({
  //   data: {
  //     name: "Roxane",
  //     email: "roxane.lahady@curie.fr",
  //     assignments: {
  //       create: [
  //         {
  //           date: new Date("2025-01-01"),
  //           task: "VERIFICATION_DE_DOSSIERS_1",
  //         },
  //         {
  //           date: new Date("2025-01-02"),
  //           task: "VALIDATIONS_DE_DOSSIERS_ET_PREPARATION_CQ_1",
  //         },
  //       ],
  //     },
  //   },
  // });

  // await prisma.user.create({
  //   data: {
  //     name: "Rezart",
  //     email: "rezart.belchi@curie.fr",
  //     assignments: {
  //       create: [
  //         {
  //           date: new Date("2025-01-01"),
  //           task: "CURIETHERAPIE",
  //         },
  //         {
  //           date: new Date("2025-01-02"),
  //           task: "GESTION_CQ_APPAREIL",
  //         },
  //       ],
  //     },
  //   },
  // });
}

main();
