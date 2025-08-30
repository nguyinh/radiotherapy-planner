import { Assignment, User } from "@prisma/client";

type AssignmentWithUser = Pick<
  Assignment,
  "id" | "date" | "task" | "userId"
> & {
  user: Pick<User, "name">;
};

// export type AssignmentsByUser = { [key: User["name"]]: AssignmentWithUser[] };

export type UserAssignments = {
  assignments: Pick<Assignment, "id" | "date" | "task">[];
  user: Pick<User, "id" | "name" | "email">;
};

export type AssignmentsByUser = {
  [key: User["name"]]: UserAssignments;
};
