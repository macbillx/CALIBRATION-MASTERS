import { NextResponse } from "next/server";
import { currentUser } from "@/lib/authz";
import { assertDatabaseConfigured, prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  try {
    assertDatabaseConfigured();
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Team list failed", error);
    return NextResponse.json({ error: "Team members are unavailable." }, { status: 503 });
  }
}

