import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/authz";
import { assertDatabaseConfigured, prisma } from "@/lib/db";
import { missingRequired, serializeCertificate, toDate } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const input = z.object({
  certificateNo: z.string().nullable().optional(), documentNo: z.string().nullable().optional(), projectTitle: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(), clientAddress: z.string().nullable().optional(), clientPhone: z.string().nullable().optional(), clientEmail: z.string().nullable().optional(),
  instrumentDesc: z.string().nullable().optional(), manufacturer: z.string().nullable().optional(), model: z.string().nullable().optional(), serialNo: z.string().nullable().optional(),
  location: z.string().nullable().optional(), procedure: z.string().nullable().optional(), tagNo: z.string().nullable().optional(), condition: z.string().nullable().optional(),
  calibrationDate: z.string().nullable().optional(), dueDate: z.string().nullable().optional(), nextCalibrationDate: z.string().nullable().optional(), calibratedBy: z.string().nullable().optional(), certificateDate: z.string().nullable().optional(),
  approvedBy: z.string().nullable().optional(), approvalSignature: z.string().nullable().optional(), approvalDate: z.string().nullable().optional(), approverName: z.string().nullable().optional(), approverTitle: z.string().nullable().optional(),
  asReceived: z.string().nullable().optional(), asLeft: z.string().nullable().optional(), resultsSummary: z.string().nullable().optional(), notes: z.string().nullable().optional(), comments: z.string().nullable().optional(),
  sourceRow: z.number().int().positive().nullable().optional(), status: z.enum(["DRAFT", "APPROVED"]).optional(),
  readings: z.array(z.object({ point: z.string().optional(), appliedValue: z.string().optional(), indicatedValue: z.string().optional(), error: z.string().optional(), tolerance: z.string().optional() })).optional(),
});

function text(value: string | null | undefined) { return value?.trim() || null; }

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Certificate data is invalid.", details: parsed.error.flatten() }, { status: 400 });
  const { id } = await context.params;
  try {
    assertDatabaseConfigured();
    const exists = await prisma.certificate.findUnique({ where: { id } });
    if (!exists) return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    const data = parsed.data;
    if (user.role === "APPROVER") {
      if (data.status !== "APPROVED") return NextResponse.json({ error: "Approvers can submit an approval only." }, { status: 403 });
      const missing = missingRequired(exists as unknown as Record<string, unknown>);
      if (missing.length) return NextResponse.json({ error: `Complete required fields before approval: ${missing.join(", ")}.` }, { status: 409 });
      if (exists.status === "APPROVED") return NextResponse.json({ error: "This certificate is already approved." }, { status: 409 });
      const record = await prisma.certificate.update({ where: { id }, data: {
        status: "APPROVED", approverId: user.id,
        approvedBy: text(data.approvedBy) ?? user.name ?? user.email ?? "Approver",
        approvalSignature: text(data.approvalSignature), approvalDate: toDate(data.approvalDate) ?? new Date(),
        approverName: text(data.approverName) ?? user.name, approverTitle: text(data.approverTitle) ?? "Approver",
      }, include: { readings: { orderBy: { sortOrder: "asc" } } } });
      return NextResponse.json({ record: serializeCertificate(record) });
    }
    if (user.role !== "ADMIN" && user.role !== "TECHNICIAN") return NextResponse.json({ error: "Your role cannot edit certificates." }, { status: 403 });
    if (exists.status === "APPROVED" && user.role !== "ADMIN") return NextResponse.json({ error: "Approved certificates can only be changed by an admin." }, { status: 403 });
    const base = {
      certificateNo: text(data.certificateNo), documentNo: text(data.documentNo), projectTitle: text(data.projectTitle),
      clientName: text(data.clientName), clientAddress: text(data.clientAddress), clientPhone: text(data.clientPhone), clientEmail: text(data.clientEmail),
      instrumentDesc: text(data.instrumentDesc), manufacturer: text(data.manufacturer), model: text(data.model), serialNo: text(data.serialNo),
      location: text(data.location), procedure: text(data.procedure), tagNo: text(data.tagNo), condition: text(data.condition),
      calibrationDate: toDate(data.calibrationDate), dueDate: toDate(data.dueDate), nextCalibrationDate: toDate(data.nextCalibrationDate),
      calibratedBy: text(data.calibratedBy), certificateDate: toDate(data.certificateDate), asReceived: text(data.asReceived), asLeft: text(data.asLeft),
      resultsSummary: text(data.resultsSummary), notes: text(data.notes), comments: text(data.comments), sourceRow: data.sourceRow ?? null,
    };
    const record = await prisma.certificate.update({ where: { id }, data: {
      ...base,
      ...(user.role === "ADMIN" ? { approvedBy: text(data.approvedBy), approvalSignature: text(data.approvalSignature), approvalDate: toDate(data.approvalDate), approverName: text(data.approverName), approverTitle: text(data.approverTitle), status: data.status } : {}),
      ...(data.readings ? { readings: { deleteMany: {}, create: data.readings.map((reading, sortOrder) => ({ point: text(reading.point), appliedValue: text(reading.appliedValue), indicatedValue: text(reading.indicatedValue), error: text(reading.error), tolerance: text(reading.tolerance), sortOrder })) } } : {}),
    }, include: { readings: { orderBy: { sortOrder: "asc" } } } });
    return NextResponse.json({ record: serializeCertificate(record) });
  } catch (error) {
    console.error("Certificate update failed", error);
    return NextResponse.json({ error: "Could not update the certificate. Check the certificate number is unique." }, { status: 409 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Only admins can delete certificates." }, { status: 403 });
  const { id } = await context.params;
  try {
    assertDatabaseConfigured();
    await prisma.certificate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Certificate delete failed", error);
    return NextResponse.json({ error: "Could not delete the certificate." }, { status: 404 });
  }
}

