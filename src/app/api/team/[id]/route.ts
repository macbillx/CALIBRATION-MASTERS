import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/authz";
import { assertDatabaseConfigured, prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentUser();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (actor.role !== "ADMIN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const input = z.object({ role: z.enum(["ADMIN", "TECHNICIAN", "APPROVER"]) }).safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "Choose a valid role." }, { status: 400 });
  const { id } = await context.params;
  try {
    assertDatabaseConfigured();
    const result = await prisma.$transaction(async (transaction) => {
      const currentActor = await transaction.user.findUnique({ where: { id: actor.id }, select: { role: true } });
      if (currentActor?.role !== "ADMIN") return { error: "Admin access required.", status: 403 as const };
      const current = await transaction.user.findUnique({ where: { id }, select: { id: true, role: true } });
      if (!current) return { error: "Team member not found.", status: 404 as const };
      if (current.role === "ADMIN" && input.data.role !== "ADMIN") {
        const adminCount = await transaction.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) return { error: "The last admin cannot be demoted.", status: 409 as const };
      }
      const user = await transaction.user.update({ where: { id }, data: { role: input.data.role }, select: { id: true, name: true, email: true, role: true } });
      return { user };
    }, { isolationLevel: "Serializable" });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error("Role update failed", error);
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "The team changed while the role was being updated. Try again." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not update the team member role." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentUser();
  if (!actor) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (actor.role !== "ADMIN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const { id } = await context.params;
  if (id === actor.id) return NextResponse.json({ error: "You cannot delete your own account." }, { status: 409 });

  try {
    assertDatabaseConfigured();
    const result = await prisma.$transaction(async (transaction) => {
      const currentActor = await transaction.user.findUnique({ where: { id: actor.id }, select: { role: true } });
      if (currentActor?.role !== "ADMIN") return { error: "Admin access required.", status: 403 as const };
      const target = await transaction.user.findUnique({ where: { id }, select: { id: true, role: true } });
      if (!target) return { error: "Team member not found.", status: 404 as const };
      if (target.role === "ADMIN") {
        const adminCount = await transaction.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) return { error: "The last admin cannot be deleted.", status: 409 as const };
      }
      await transaction.user.delete({ where: { id } });
      return { deleted: true as const };
    }, { isolationLevel: "Serializable" });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Team member deletion failed", error);
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "The team changed while the account was being deleted. Try again." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not delete the team member." }, { status: 500 });
  }
}

