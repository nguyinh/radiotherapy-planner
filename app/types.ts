import { Assignment, Guard, GuardType, User } from "@prisma/client";

export type UserAssignments = {
  assignments: Pick<Assignment, "id" | "date" | "task">[];
  user: Pick<User, "id" | "name" | "email">;
};

export type AssignmentsByUser = {
  [key: User["name"]]: UserAssignments;
};

export type UserGuard = {
  id: Guard["id"];
  guard: GuardType;
  date: Date;
  user: {
    name: string;
    id: number;
  };
};
