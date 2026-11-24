import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/authz";
import { assertDatabaseConfigured, prisma } from "@/lib/db";
import { toDate } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backupInput = z.object({ records: z.array(z.record(z.string(), z.unknown())).min(1).max(1000) });
const stringValue = (row:Record<string,unknown>, modern:string, legacy:string) => {
  const value=row[modern]??row[legacy];return typeof value==="string"?value.trim()||null:null;
};
const stringDate=(row:Record<string,unknown>,modern:string,legacy:string)=>toDate(row[modern]??row[legacy]);

export async function POST(request: Request) {
  const user=await currentUser();
  if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
  if(user.role!=="ADMIN"&&user.role!=="TECHNICIAN")return NextResponse.json({error:"Your role cannot import records."},{status:403});
  const parsed=backupInput.safeParse(await request.json());
  if(!parsed.success)return NextResponse.json({error:"Backup file is not valid."},{status:400});
  try {
    assertDatabaseConfigured();
    let imported=0;
    await prisma.$transaction(async tx=>{
      for(const row of parsed.data.records){
        const certificateNo=stringValue(row,"certificateNo","Certificate No.");
        const values={
          certificateNo,documentNo:stringValue(row,"documentNo","Document No."),projectTitle:stringValue(row,"projectTitle","Project Title"),
          clientName:stringValue(row,"clientName","Client Name"),clientAddress:stringValue(row,"clientAddress","Client Address"),clientPhone:stringValue(row,"clientPhone","Client Phone"),clientEmail:stringValue(row,"clientEmail","Client Email"),
          instrumentDesc:stringValue(row,"instrumentDesc","Instrument Desc."),manufacturer:stringValue(row,"manufacturer","Manufacturer"),model:stringValue(row,"model","Model"),serialNo:stringValue(row,"serialNo","Serial No."),
          location:stringValue(row,"location","Location"),procedure:stringValue(row,"procedure","Procedure"),tagNo:stringValue(row,"tagNo","Tag No."),condition:stringValue(row,"condition","Condition"),
          calibrationDate:stringDate(row,"calibrationDate","Cal. Date"),dueDate:stringDate(row,"dueDate","Due Date"),nextCalibrationDate:stringDate(row,"nextCalibrationDate","Next Cal."),calibratedBy:stringValue(row,"calibratedBy","Calibrated By"),certificateDate:stringDate(row,"certificateDate","Cert. Date"),
          approvedBy:stringValue(row,"approvedBy","Approved By"),approvalSignature:stringValue(row,"approvalSignature","Approval Signature"),approvalDate:stringDate(row,"approvalDate","Approval Date"),approverName:stringValue(row,"approverName","Approver Name"),approverTitle:stringValue(row,"approverTitle","Approver Title"),
          asReceived:stringValue(row,"asReceived","As Received"),asLeft:stringValue(row,"asLeft","As Left"),resultsSummary:stringValue(row,"resultsSummary","Results Table"),notes:stringValue(row,"notes","Notes"),comments:stringValue(row,"comments","Comments"),
          sourceRow:typeof row.sourceRow==="number"?row.sourceRow:null,
        };
        const readings=Array.isArray(row.readings)?row.readings as Record<string,unknown>[]:[];
        const existing=certificateNo?await tx.certificate.findUnique({where:{certificateNo},select:{id:true}}):null;
        const readingData=readings.map((reading,sortOrder)=>({point:typeof reading.point==="string"?reading.point:null,appliedValue:typeof reading.appliedValue==="string"?reading.appliedValue:typeof reading.applied==="string"?reading.applied:null,indicatedValue:typeof reading.indicatedValue==="string"?reading.indicatedValue:typeof reading.indicated==="string"?reading.indicated:null,error:typeof reading.error==="string"?reading.error:null,tolerance:typeof reading.tolerance==="string"?reading.tolerance:null,sortOrder}));
        if(existing){
          await tx.certificate.update({where:{id:existing.id},data:{...values,readings:{deleteMany:{},create:readingData}}});
        }else{
          await tx.certificate.create({data:{...values,creatorId:user.id,readings:{create:readingData}}});
        }
        imported++;
      }
    });
    return NextResponse.json({imported,mode:"merge"});
  }catch(error){
    console.error("Certificate import failed",error);
    return NextResponse.json({error:"Import failed. Check for duplicate certificate numbers and valid dates."},{status:400});
  }
}

