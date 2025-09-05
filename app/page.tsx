import { daysOfYear } from "./helpers/Date";
import { PlannerTable } from "./components/PlannerTable";
import { PrismaClient } from "@prisma/client";
import {
  formatUserAssignments,
  // groupAssignementsByUsers,
  // sortByDate,
} from "./helpers/Assignements";
import { mapGuardsToDays } from "./helpers/GuardHelper";

export const yearDays = daysOfYear(2025);

const prisma = new PrismaClient();

export default async function Home() {
  const userAssignments = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      assignments: {
        select: {
          id: true,
          date: true,
          task: true,
        },
        // where: {
        // filter by date
        // }
      },
    },
  });

  const userList = userAssignments.map((user) => ({
    id: user.id,
    name: user.name,
  }));

  const dailyGuards = await prisma.guard.findMany({
    where: {
      date: {
        gte: new Date(2025, 0, 1),
        lte: new Date(2025, 11, 31),
      },
    },
    select: {
      id: true,
      guard: true,
      date: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const groupedDailyGuards = mapGuardsToDays(dailyGuards);

  const formattedUserAssignments = formatUserAssignments(userAssignments);

  return (
    <div className="font-sans text-gray-500">
      <section className="border rounded-2xl overflow-hidden shadow-sm">
        <PlannerTable
          year={2025}
          assignmentsByUsers={formattedUserAssignments}
          days={yearDays}
          groupedDailyGuards={groupedDailyGuards}
          userList={userList}
        />
      </section>
    </div>
  );
}
