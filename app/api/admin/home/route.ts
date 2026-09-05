import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { DEFAULT_HOME_PAGE, getEditableHomePage, type EditableHomePage } from "@/lib/content-store";
import { prisma } from "@/lib/prisma";

const LIMIT = { short: 300, text: 3000, title: 500, href: 500, whyTitle: 200, whyText: 1200 } as const;
function bounded(value: unknown, max: number, fallback: string) { const text = String(value ?? "").trim(); return text && text.length <= max ? text : fallback; }
function href(value: unknown, fallback: string) { const text = bounded(value, LIMIT.href, fallback); return text.startsWith("/") ? text : fallback; }
function cleanWhy(value: unknown) { const source = Array.isArray(value) ? value : DEFAULT_HOME_PAGE.whyItems; return source.slice(0, 3).map((item: any, index) => ({ title: bounded(item?.title, LIMIT.whyTitle, DEFAULT_HOME_PAGE.whyItems[index]?.title ?? ""), text: bounded(item?.text, LIMIT.whyText, DEFAULT_HOME_PAGE.whyItems[index]?.text ?? "") })); }
function normalize(body: any): EditableHomePage {
  return {
    badge: bounded(body?.badge, LIMIT.short, DEFAULT_HOME_PAGE.badge),
    heroTitle: bounded(body?.heroTitle, LIMIT.title, DEFAULT_HOME_PAGE.heroTitle),
    heroHighlight: bounded(body?.heroHighlight, LIMIT.title, DEFAULT_HOME_PAGE.heroHighlight),
    heroDescription: bounded(body?.heroDescription, LIMIT.text, DEFAULT_HOME_PAGE.heroDescription),
    primaryCtaLabel: bounded(body?.primaryCtaLabel, LIMIT.short, DEFAULT_HOME_PAGE.primaryCtaLabel),
    primaryCtaHref: href(body?.primaryCtaHref, DEFAULT_HOME_PAGE.primaryCtaHref),
    secondaryCtaLabel: bounded(body?.secondaryCtaLabel, LIMIT.short, DEFAULT_HOME_PAGE.secondaryCtaLabel),
    secondaryCtaHref: href(body?.secondaryCtaHref, DEFAULT_HOME_PAGE.secondaryCtaHref),
    servicesTitle: bounded(body?.servicesTitle, LIMIT.title, DEFAULT_HOME_PAGE.servicesTitle),
    servicesDescription: bounded(body?.servicesDescription, LIMIT.text, DEFAULT_HOME_PAGE.servicesDescription),
    toolsTitle: bounded(body?.toolsTitle, LIMIT.title, DEFAULT_HOME_PAGE.toolsTitle),
    toolsDescription: bounded(body?.toolsDescription, LIMIT.text, DEFAULT_HOME_PAGE.toolsDescription),
    portfolioTitle: bounded(body?.portfolioTitle, LIMIT.title, DEFAULT_HOME_PAGE.portfolioTitle),
    portfolioDescription: bounded(body?.portfolioDescription, LIMIT.text, DEFAULT_HOME_PAGE.portfolioDescription),
    whyTitle: bounded(body?.whyTitle, LIMIT.title, DEFAULT_HOME_PAGE.whyTitle),
    whyDescription: bounded(body?.whyDescription, LIMIT.text, DEFAULT_HOME_PAGE.whyDescription),
    whyItems: cleanWhy(body?.whyItems),
    finalCtaTitle: bounded(body?.finalCtaTitle, LIMIT.title, DEFAULT_HOME_PAGE.finalCtaTitle),
    finalCtaDescription: bounded(body?.finalCtaDescription, LIMIT.text, DEFAULT_HOME_PAGE.finalCtaDescription),
    finalCtaLabel: bounded(body?.finalCtaLabel, LIMIT.short, DEFAULT_HOME_PAGE.finalCtaLabel),
    finalCtaHref: href(body?.finalCtaHref, DEFAULT_HOME_PAGE.finalCtaHref),
  };
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request); if (!admin.ok) return admin.response;
  try { return NextResponse.json(await getEditableHomePage()); }
  catch (error) { console.error("Unable to load homepage:", error); return NextResponse.json({ error: "Unable to load homepage." }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request); if (!admin.ok) return admin.response;
  try {
    const data = normalize(await request.json());
    await prisma.$executeRaw`
      INSERT INTO "HomePageContent" ("id","badge","heroTitle","heroHighlight","heroDescription","primaryCtaLabel","primaryCtaHref","secondaryCtaLabel","secondaryCtaHref","servicesTitle","servicesDescription","toolsTitle","toolsDescription","portfolioTitle","portfolioDescription","whyTitle","whyDescription","whyItems","finalCtaTitle","finalCtaDescription","finalCtaLabel","finalCtaHref","createdAt","updatedAt")
      VALUES ('default',${data.badge},${data.heroTitle},${data.heroHighlight},${data.heroDescription},${data.primaryCtaLabel},${data.primaryCtaHref},${data.secondaryCtaLabel},${data.secondaryCtaHref},${data.servicesTitle},${data.servicesDescription},${data.toolsTitle},${data.toolsDescription},${data.portfolioTitle},${data.portfolioDescription},${data.whyTitle},${data.whyDescription},${JSON.stringify(data.whyItems)}::jsonb,${data.finalCtaTitle},${data.finalCtaDescription},${data.finalCtaLabel},${data.finalCtaHref},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO UPDATE SET "badge"=EXCLUDED."badge","heroTitle"=EXCLUDED."heroTitle","heroHighlight"=EXCLUDED."heroHighlight","heroDescription"=EXCLUDED."heroDescription","primaryCtaLabel"=EXCLUDED."primaryCtaLabel","primaryCtaHref"=EXCLUDED."primaryCtaHref","secondaryCtaLabel"=EXCLUDED."secondaryCtaLabel","secondaryCtaHref"=EXCLUDED."secondaryCtaHref","servicesTitle"=EXCLUDED."servicesTitle","servicesDescription"=EXCLUDED."servicesDescription","toolsTitle"=EXCLUDED."toolsTitle","toolsDescription"=EXCLUDED."toolsDescription","portfolioTitle"=EXCLUDED."portfolioTitle","portfolioDescription"=EXCLUDED."portfolioDescription","whyTitle"=EXCLUDED."whyTitle","whyDescription"=EXCLUDED."whyDescription","whyItems"=EXCLUDED."whyItems","finalCtaTitle"=EXCLUDED."finalCtaTitle","finalCtaDescription"=EXCLUDED."finalCtaDescription","finalCtaLabel"=EXCLUDED."finalCtaLabel","finalCtaHref"=EXCLUDED."finalCtaHref","updatedAt"=CURRENT_TIMESTAMP
    `;
    revalidatePath("/");
    return NextResponse.json(await getEditableHomePage());
  } catch (error) { console.error("Unable to save homepage:", error); return NextResponse.json({ error: "Unable to save homepage." }, { status: 500 }); }
}
