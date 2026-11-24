import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { assertDatabaseConfigured, prisma } from "@/lib/db";
import { CertificatePdf } from "@/lib/certificate-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  try {
    assertDatabaseConfigured();
    const record = await prisma.certificate.findUnique({ where: { id }, include: { readings: { orderBy: { sortOrder: "asc" } } } });
    if (!record) return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    const pdf = await renderToBuffer(<CertificatePdf record={record} />);
    const fileName = `${(record.certificateNo || "certificate").replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`;
    return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${fileName}"`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("PDF generation failed", error);
    return NextResponse.json({ error: "Could not generate the certificate PDF." }, { status: 500 });
  }
}

