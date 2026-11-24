import type { Certificate, TestReading, UserRole } from "@/generated/prisma/client";

export const requiredFields = [
  ["certificateNo", "Certificate No."], ["documentNo", "Document No."], ["projectTitle", "Project Title"],
  ["clientName", "Client Name"], ["instrumentDesc", "Instrument Desc."], ["manufacturer", "Manufacturer"],
  ["model", "Model"], ["serialNo", "Serial No."], ["location", "Location"], ["procedure", "Procedure"],
  ["tagNo", "Tag No."], ["condition", "Condition"], ["calibrationDate", "Cal. Date"], ["dueDate", "Due Date"],
  ["calibratedBy", "Calibrated By"], ["certificateDate", "Cert. Date"],
] as const;

export function missingRequired(record: Record<string, unknown>) {
  return requiredFields.filter(([key]) => !String(record[key] ?? "").trim()).map(([, label]) => label);
}

export function toDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(+date) ? null : date;
}

export function dateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function serializeCertificate<T extends Certificate & { readings: TestReading[] }>(record: T) {
  return {
    ...record,
    calibrationDate: dateInput(record.calibrationDate), dueDate: dateInput(record.dueDate),
    nextCalibrationDate: dateInput(record.nextCalibrationDate), certificateDate: dateInput(record.certificateDate),
    approvalDate: dateInput(record.approvalDate),
    readings: record.readings.map(({ id, point, appliedValue, indicatedValue, error, tolerance }) => ({ id, point, appliedValue, indicatedValue, error, tolerance })),
  };
}

export function canEdit(role: UserRole) {
  return role === "ADMIN" || role === "TECHNICIAN";
}

