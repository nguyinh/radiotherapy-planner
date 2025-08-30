import { daysOfYear } from "./helpers/Date";
import { PlannerTable } from "./components/PlannerTable";
import { PrismaClient } from "@prisma/client";
import {
  formatUserAssignments,
  // groupAssignementsByUsers,
  // sortByDate,
} from "./helpers/Assignements";

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

  const formattedUserAssignments = formatUserAssignments(userAssignments);

  return (
    <div className="font-sans text-gray-500">
      <section className="border rounded-2xl overflow-hidden shadow-sm">
        <PlannerTable
          year={2025}
          assignmentsByUsers={formattedUserAssignments}
          days={yearDays}
          // assignments={assignments}
          // dailyGuards={dailyGuards}
          // onAssign={(updatedAssignment) => console.log({ updatedAssignment })}
          // onGuardChange={handleGuardChange}
        />
      </section>
    </div>
  );
}
