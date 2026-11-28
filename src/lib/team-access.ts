export type AccountRole = "ADMIN" | "TECHNICIAN" | "APPROVER";

export function wouldRemoveLastAdmin(currentRole: AccountRole, nextRole: AccountRole, adminCount: number) {
  return currentRole === "ADMIN" && nextRole !== "ADMIN" && adminCount <= 1;
}
