import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type PdfRecord = {
  certificateNo: string | null; documentNo: string | null; projectTitle: string | null; clientName: string | null;
  clientEmail: string | null; clientAddress: string | null; clientPhone: string | null; instrumentDesc: string | null;
  location: string | null; manufacturer: string | null; procedure: string | null; model: string | null; tagNo: string | null;
  serialNo: string | null; condition: string | null; calibratedBy: string | null; certificateDate: Date | null;
  calibrationDate: Date | null; nextCalibrationDate: Date | null; dueDate: Date | null; approvedBy: string | null;
  approvalSignature: string | null; approvalDate: Date | null; approverName: string | null; approverTitle: string | null;
  asReceived: string | null; asLeft: string | null; notes: string | null; comments: string | null; resultsSummary: string | null;
  readings: { point: string | null; appliedValue: string | null; indicatedValue: string | null; error: string | null; tolerance: string | null }[];
};

const navy = "#073b70";
const styles = StyleSheet.create({
  page: { paddingTop: 38, paddingBottom: 43, paddingHorizontal: 48, fontFamily: "Helvetica", fontSize: 9, color: "#171b22" },
  brand: { textAlign: "center", color: navy, fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { textAlign: "center", fontSize: 8, fontStyle: "italic", marginBottom: 20, color: "#444" },
  title: { fontSize: 15, color: "#0870ca", fontFamily: "Helvetica-Bold", marginBottom: 13 },
  idRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  project: { backgroundColor: "#eaf0f6", padding: 4, marginBottom: 15 },
  section: { marginBottom: 12 },
  sectionTitle: { backgroundColor: navy, color: "#fff", paddingVertical: 5, paddingHorizontal: 6, fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 2 },
  field: { width: "50%", minHeight: 17, paddingRight: 8, flexDirection: "row", fontSize: 8.5 },
  label: { fontFamily: "Helvetica-Bold", marginRight: 4 },
  approval: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 2 },
  approvalItem: { width: "50%", height: 21, fontSize: 8.5 },
  line: { borderBottomWidth: 0.6, borderBottomColor: "#333", minWidth: 92, paddingBottom: 2 },
  comment: { borderWidth: 0.6, borderColor: "#333", minHeight: 26, padding: 5, fontSize: 8.5 },
  table: { borderWidth: 0.6, borderColor: "#222" },
  tableRow: { flexDirection: "row" },
  tableHead: { backgroundColor: navy, color: "#fff", fontFamily: "Helvetica-Bold" },
  cell: { borderRightWidth: 0.6, borderBottomWidth: 0.6, borderColor: "#222", width: "20%", padding: 4, fontSize: 8 },
  note: { fontSize: 9, marginTop: 13, lineHeight: 1.45 },
  rule: { borderBottomWidth: 0.6, borderColor: "#555", marginVertical: 12 },
  footer: { position: "absolute", bottom: 18, left: 48, right: 48, textAlign: "center", fontSize: 6.5, color: "#333" },
});

function displayDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(value) : "________________";
}
function value(text: string | null) { return text?.trim() || "—"; }
function Field({ label, children }: { label: string; children: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}:</Text><Text>{children}</Text></View>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

export function CertificatePdf({ record }: { record: PdfRecord }) {
  return <Document title={`Calibration Certificate ${value(record.certificateNo)}`} author="Calibration Masters">
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.brand}>CALIBRATION MASTERS</Text>
      <Text style={styles.subtitle}>Accredited Calibration Laboratory</Text>
      <Text style={styles.title}>CALIBRATION CERTIFICATE</Text>
      <View style={styles.idRow}><Text><Text style={styles.label}>Certificate No.:</Text> {value(record.certificateNo)}</Text><Text><Text style={styles.label}>Document No.:</Text> {value(record.documentNo)}</Text></View>
      <View style={styles.project}><Text><Text style={styles.label}>Project Title:</Text> {value(record.projectTitle)}</Text></View>
      <Section title="CLIENT DETAILS"><View style={styles.grid}><Field label="Client Name">{value(record.clientName)}</Field><Field label="Email">{value(record.clientEmail)}</Field><Field label="Client Address">{value(record.clientAddress)}</Field><Field label="Phone">{value(record.clientPhone)}</Field></View></Section>
      <Section title="INSTRUMENT DATA"><View style={styles.grid}><Field label="Description">{value(record.instrumentDesc)}</Field><Field label="Location">{value(record.location)}</Field><Field label="Manufacturer">{value(record.manufacturer)}</Field><Field label="Procedure">{value(record.procedure)}</Field><Field label="Model">{value(record.model)}</Field><Field label="Tag No.">{value(record.tagNo)}</Field><Field label="Serial No.">{value(record.serialNo)}</Field><Field label="Condition">{value(record.condition)}</Field></View></Section>
      <Section title="TRACEABILITY INFORMATION"><View style={styles.grid}><Field label="Instrument">{value(record.instrumentDesc)}</Field><Field label="Calibrated By">{value(record.calibratedBy)}</Field><Field label="Serial No.">{value(record.serialNo)}</Field><Field label="Certificate Date">{displayDate(record.certificateDate)}</Field><Field label="Calibration Date">{displayDate(record.calibrationDate)}</Field><Field label="Next Calibration">{displayDate(record.nextCalibrationDate ?? record.dueDate)}</Field><Field label="Due Date">{displayDate(record.dueDate)}</Field><Field label="Approved By">{value(record.approvedBy || "QA Manager")}</Field></View></Section>
      <Section title="APPROVED SIGNATURE"><View style={styles.approval}><View style={styles.approvalItem}><Text>Signature: <Text style={styles.line}>{record.approvalSignature || " "}</Text></Text></View><View style={styles.approvalItem}><Text>Date: <Text style={styles.line}>{record.approvalDate ? displayDate(record.approvalDate) : " "}</Text></Text></View><View style={styles.approvalItem}><Text>Name: <Text style={styles.line}>{record.approverName || " "}</Text></Text></View><View style={styles.approvalItem}><Text>Title: <Text style={styles.line}>{record.approverTitle || "Quality Manager"}</Text></Text></View></View></Section>
      <Section title="AS RECEIVED COMMENT"><View style={styles.comment}><Text>{value(record.asReceived)}</Text></View></Section>
      <Section title="AS LEFT COMMENT"><View style={styles.comment}><Text>{value(record.asLeft)}</Text></View></Section>
      <Text style={styles.footer}>{value(record.certificateNo)} · {value(record.clientName)}     Page 1 of 2</Text>
    </Page>
    <Page size="LETTER" style={styles.page}>
      <Section title="TEST RESULTS"><View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHead]}>{["Test Point", "Applied Value", "Indicated Value", "Error", "Tolerance"].map((heading) => <Text key={heading} style={styles.cell}>{heading}</Text>)}</View>
        {record.readings.length ? record.readings.map((reading, index) => <View style={styles.tableRow} key={index}>{[reading.point, reading.appliedValue, reading.indicatedValue, reading.error, reading.tolerance].map((cell, column) => <Text style={styles.cell} key={column}>{value(cell)}</Text>)}</View>) : <View style={styles.tableRow}><Text style={[styles.cell, { width: "100%" }]}>No test readings have been entered for this record.</Text></View>}
      </View></Section>
      <Text style={styles.note}><Text style={styles.label}>NB:</Text> {value(record.notes)}</Text>
      <View style={styles.rule} />
      <Section title="COMMENTS"><Text style={styles.note}>{value(record.comments)}</Text><Text style={styles.note}>Calibration performed in accordance with ISO/IEC 17025:2017</Text><Text style={styles.note}>All standards used are traceable to international standards</Text>{record.resultsSummary && <Text style={styles.note}>{record.resultsSummary}</Text>}</Section>
      <Text style={styles.footer}>This certificate is issued by Calibration Masters. Unauthorized reproduction is prohibited.     Page 2 of 2</Text>
    </Page>
  </Document>;
}

