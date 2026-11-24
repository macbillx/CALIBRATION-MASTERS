import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/client";

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function hasRole(roles: UserRole[]) {
  const user = await currentUser();
  return user && roles.includes(user.role) ? user : null;
}

export function canEditRecords(role: UserRole) {
  return role === "ADMIN" || role === "TECHNICIAN";
}

