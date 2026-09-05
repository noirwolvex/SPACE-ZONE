import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { getTestimonials } from "@/lib/content-store";

const MAX={name:120,role:120,company:120,avatarUrl:1000,content:2000};
function text(value:unknown,max:number){const v=String(value??"").trim();return v.length<=max?v:v.slice(0,max)}
function normalize(body:any){return{name:text(body?.name,MAX.name),role:text(body?.role,MAX.role),company:text(body?.company,MAX.company),avatarUrl:text(body?.avatarUrl,MAX.avatarUrl),content:text(body?.content,MAX.content),rating:Math.min(5,Math.max(1,Number.isFinite(Number(body?.rating))?Math.round(Number(body.rating)):5)),isPublished:Boolean(body?.isPublished)}}
function valid(data:any){return data.name.length>=1&&data.content.length>=3&&data.avatarUrl.length<=MAX.avatarUrl}

export async function GET(request:NextRequest){const admin=await requireAdmin(request);if(!admin.ok)return admin.response;try{return NextResponse.json(await getTestimonials({limit:12}))}catch(error){console.error("Unable to load testimonials:",error);return NextResponse.json({error:"Unable to load testimonials."},{status:500})}}
export async function POST(request:NextRequest){const admin=await requireAdmin(request);if(!admin.ok)return admin.response;try{const data=normalize(await request.json());if(!valid(data))return NextResponse.json({error:"Name and testimonial text are required."},{status:400});const rows=await prisma.$queryRaw<any[]>`INSERT INTO "Testimonial" ("name","role","company","avatarUrl","content","rating","isPublished") VALUES (${data.name},${data.role||null},${data.company||null},${data.avatarUrl||null},${data.content},${data.rating},${data.isPublished}) RETURNING *`;revalidatePath("/");return NextResponse.json(rows[0],{status:201})}catch(error){console.error("Unable to create testimonial:",error);return NextResponse.json({error:"Unable to create testimonial."},{status:500})}}
