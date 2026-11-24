import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/authz";
import { assertDatabaseConfigured, prisma } from "@/lib/db";
import { serializeCertificate, toDate } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const readingInput = z.object({ point: z.string().optional(), appliedValue: z.string().optional(), indicatedValue: z.string().optional(), error: z.string().optional(), tolerance: z.string().optional() });
const certificateInput = z.object({
  certificateNo: z.string().nullable().optional(), documentNo: z.string().nullable().optional(), projectTitle: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(), clientAddress: z.string().nullable().optional(), clientPhone: z.string().nullable().optional(), clientEmail: z.string().nullable().optional(),
  instrumentDesc: z.string().nullable().optional(), manufacturer: z.string().nullable().optional(), model: z.string().nullable().optional(), serialNo: z.string().nullable().optional(),
  location: z.string().nullable().optional(), procedure: z.string().nullable().optional(), tagNo: z.string().nullable().optional(), condition: z.string().nullable().optional(),
  calibrationDate: z.string().nullable().optional(), dueDate: z.string().nullable().optional(), nextCalibrationDate: z.string().nullable().optional(), calibratedBy: z.string().nullable().optional(), certificateDate: z.string().nullable().optional(),
  approvedBy: z.string().nullable().optional(), approvalSignature: z.string().nullable().optional(), approvalDate: z.string().nullable().optional(), approverName: z.string().nullable().optional(), approverTitle: z.string().nullable().optional(),
  asReceived: z.string().nullable().optional(), asLeft: z.string().nullable().optional(), resultsSummary: z.string().nullable().optional(), notes: z.string().nullable().optional(), comments: z.string().nullable().optional(),
  sourceRow: z.number().int().positive().nullable().optional(), readings: z.array(readingInput).optional(),
});

function nullableText(value: string | null | undefined) { return value?.trim() || null; }
function writeData(data: z.infer<typeof certificateInput>) {
  return {
    certificateNo: nullableText(data.certificateNo), documentNo: nullableText(data.documentNo), projectTitle: nullableText(data.projectTitle),
    clientName: nullableText(data.clientName), clientAddress: nullableText(data.clientAddress), clientPhone: nullableText(data.clientPhone), clientEmail: nullableText(data.clientEmail),
    instrumentDesc: nullableText(data.instrumentDesc), manufacturer: nullableText(data.manufacturer), model: nullableText(data.model), serialNo: nullableText(data.serialNo),
    location: nullableText(data.location), procedure: nullableText(data.procedure), tagNo: nullableText(data.tagNo), condition: nullableText(data.condition),
    calibrationDate: toDate(data.calibrationDate), dueDate: toDate(data.dueDate), nextCalibrationDate: toDate(data.nextCalibrationDate),
    calibratedBy: nullableText(data.calibratedBy), certificateDate: toDate(data.certificateDate), approvedBy: nullableText(data.approvedBy),
    approvalSignature: nullableText(data.approvalSignature), approvalDate: toDate(data.approvalDate), approverName: nullableText(data.approverName), approverTitle: nullableText(data.approverTitle),
    asReceived: nullableText(data.asReceived), asLeft: nullableText(data.asLeft), resultsSummary: nullableText(data.resultsSummary), notes: nullableText(data.notes), comments: nullableText(data.comments),
    sourceRow: data.sourceRow ?? null,
  };
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    assertDatabaseConfigured();
    const records = await prisma.certificate.findMany({ include: { readings: { orderBy: { sortOrder: "asc" } } }, orderBy: [{ certificateNo: "desc" }, { createdAt: "desc" }] });
    return NextResponse.json({ records: records.map(serializeCertificate) });
  } catch (error) {
    console.error("Certificate list failed", error);
    return NextResponse.json({ error: "Certificate records are unavailable. Check the database connection." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(["ADMIN", "TECHNICIAN"] as string[]).includes(user.role)) return NextResponse.json({ error: "Your role cannot create certificates." }, { status: 403 });
  const parsed = certificateInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Certificate data is invalid.", details: parsed.error.flatten() }, { status: 400 });
  try {
    assertDatabaseConfigured();
    const { readings = [], ...data } = parsed.data;
    const record = await prisma.certificate.create({
      data: { ...writeData(data), creatorId: user.id, readings: { create: readings.map((reading, sortOrder) => ({ point: nullableText(reading.point), appliedValue: nullableText(reading.appliedValue), indicatedValue: nullableText(reading.indicatedValue), error: nullableText(reading.error), tolerance: nullableText(reading.tolerance), sortOrder })) } },
      include: { readings: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json({ record: serializeCertificate(record) }, { status: 201 });
  } catch (error) {
    console.error("Certificate create failed", error);
    return NextResponse.json({ error: "Could not save the certificate. Check for a duplicate certificate number." }, { status: 409 });
  }
}

