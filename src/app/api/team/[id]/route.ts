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
    const current = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!current) return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    if (current.role === "ADMIN" && input.data.role !== "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) return NextResponse.json({ error: "The last admin cannot be demoted." }, { status: 409 });
    }
    const updated = await prisma.user.update({ where: { id }, data: { role: input.data.role }, select: { id: true, name: true, email: true, role: true } });
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Role update failed", error);
    return NextResponse.json({ error: "Could not update the team member role." }, { status: 500 });
  }
}

