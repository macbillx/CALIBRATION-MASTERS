import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ensureBootstrapAdmin } from "./bootstrap";

const connectionString=process.env.DIRECT_URL??process.env.DATABASE_URL??process.env.CALI_DATABASE_URL??process.env.CALI_DATABASE_URL_POOLED;
if(!connectionString)throw new Error("Set a PostgreSQL connection URL before importing the existing certificate records.");
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString})});

function loadWindowData(path:string){
  const window:Record<string,unknown>={};
  runInNewContext(readFileSync(path,"utf8"),{window});
  return window;
}
function date(value:unknown){
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  return new Date(`${value}T00:00:00.000Z`);
}
function get(row:Record<string,unknown>,field:string,legacy:string){const value=row[field]??row[legacy];return typeof value==="string"?value.trim()||null:null;}

async function main(){
  await ensureBootstrapAdmin(prisma);
  const data=loadWindowData("seed.js");
  const reviews=loadWindowData("quality-seed.js");
  const rows=[...(data.CM_SEED as Record<string,unknown>[]||[]),...(reviews.CM_REVIEW_SEED as Record<string,unknown>[]||[])];
  let count=0;
  for(const row of rows){
    const certificateNo=get(row,"certificateNo","Certificate No.");
    const readings=Array.isArray(row.readings)?row.readings as Record<string,unknown>[]:[];
    const fields={
      certificateNo,documentNo:get(row,"documentNo","Document No."),projectTitle:get(row,"projectTitle","Project Title"),
      clientName:get(row,"clientName","Client Name"),clientAddress:get(row,"clientAddress","Client Address"),clientPhone:get(row,"clientPhone","Client Phone"),clientEmail:get(row,"clientEmail","Client Email"),
      instrumentDesc:get(row,"instrumentDesc","Instrument Desc."),manufacturer:get(row,"manufacturer","Manufacturer"),model:get(row,"model","Model"),serialNo:get(row,"serialNo","Serial No."),location:get(row,"location","Location"),
      procedure:get(row,"procedure","Procedure"),tagNo:get(row,"tagNo","Tag No."),condition:get(row,"condition","Condition"),calibrationDate:date(row.calibrationDate??row["Cal. Date"]),dueDate:date(row.dueDate??row["Due Date"]),
      nextCalibrationDate:date(row.nextCalibrationDate??row["Next Cal."]),calibratedBy:get(row,"calibratedBy","Calibrated By"),certificateDate:date(row.certificateDate??row["Cert. Date"]),
      asReceived:get(row,"asReceived","As Received"),asLeft:get(row,"asLeft","As Left"),resultsSummary:get(row,"resultsSummary","Results Table"),notes:get(row,"notes","Notes"),comments:get(row,"comments","Comments"),
      sourceRow:typeof row.sourceRow==="number"?row.sourceRow:null,
    };
    const readingData=readings.map((reading,index)=>({point:typeof reading.point==="string"?reading.point:null,appliedValue:typeof reading.appliedValue==="string"?reading.appliedValue:typeof reading.applied==="string"?reading.applied:null,indicatedValue:typeof reading.indicatedValue==="string"?reading.indicatedValue:typeof reading.indicated==="string"?reading.indicated:null,error:typeof reading.error==="string"?reading.error:null,tolerance:typeof reading.tolerance==="string"?reading.tolerance:null,sortOrder:index}));
    const existing=certificateNo?await prisma.certificate.findUnique({where:{certificateNo},select:{id:true}}):null;
    if(existing)await prisma.certificate.update({where:{id:existing.id},data:{...fields,readings:{deleteMany:{},create:readingData}}});
    else await prisma.certificate.create({data:{...fields,readings:{create:readingData}}});
    count++;
  }
  console.log(`Imported or updated ${count} records from the existing seed files.`);
}

main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>prisma.$disconnect());

