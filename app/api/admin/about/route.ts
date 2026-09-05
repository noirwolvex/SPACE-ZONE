import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { DEFAULT_ABOUT_PAGE, getEditableAboutPage, type EditableAboutPage } from "@/lib/content-store";
import { prisma } from "@/lib/prisma";

const LIMITS = {
  short: 300,
  paragraph: 3000,
  title: 500,
  cardTitle: 200,
  cardText: 1000,
  workflowItem: 500,
} as const;

function boundedText(value: unknown, max: number, fallback = "") {
  const text = String(value ?? "").trim();
  return text && text.length <= max ? text : fallback;
}

function cleanStats(value: unknown) {
  const source = Array.isArray(value) ? value : [];
  return source.slice(0, 3).map((item: any, index) => ({
    label: boundedText(item?.label, LIMITS.short, DEFAULT_ABOUT_PAGE.stats[index]?.label ?? ""),
    value: boundedText(item?.value, LIMITS.short, DEFAULT_ABOUT_PAGE.stats[index]?.value ?? ""),
  }));
}

function cleanOfferings(value: unknown) {
  const source = Array.isArray(value) ? value : [];
  const allowed = new Set(["printer", "megaphone", "layers", "rocket"]);
  return source.slice(0, 4).map((item: any, index) => ({
    icon: allowed.has(item?.icon) ? item.icon : DEFAULT_ABOUT_PAGE.offerings[index]?.icon ?? "printer",
    title: boundedText(item?.title, LIMITS.cardTitle, DEFAULT_ABOUT_PAGE.offerings[index]?.title ?? ""),
    text: boundedText(item?.text, LIMITS.cardText, DEFAULT_ABOUT_PAGE.offerings[index]?.text ?? ""),
  }));
}

function cleanValues(value: unknown) {
  const source = Array.isArray(value) ? value : [];
  return source.slice(0, 3).map((item: any, index) => ({
    title: boundedText(item?.title, LIMITS.cardTitle, DEFAULT_ABOUT_PAGE.values[index]?.title ?? ""),
    text: boundedText(item?.text, LIMITS.cardText, DEFAULT_ABOUT_PAGE.values[index]?.text ?? ""),
  }));
}

function cleanWorkflow(value: unknown) {
  const source = Array.isArray(value) ? value : [];
  return source.slice(0, 4).map((item: unknown, index) => boundedText(item, LIMITS.workflowItem, DEFAULT_ABOUT_PAGE.workflow[index] ?? ""));
}

function normalize(body: any): EditableAboutPage {
  return {
    badge: boundedText(body?.badge, LIMITS.short, DEFAULT_ABOUT_PAGE.badge),
    heroTitle: boundedText(body?.heroTitle, LIMITS.title, DEFAULT_ABOUT_PAGE.heroTitle),
    heroDescription: boundedText(body?.heroDescription, LIMITS.paragraph, DEFAULT_ABOUT_PAGE.heroDescription),
    stats: cleanStats(body?.stats),
    whatWeDoTitle: boundedText(body?.whatWeDoTitle, LIMITS.title, DEFAULT_ABOUT_PAGE.whatWeDoTitle),
    whatWeDoText: boundedText(body?.whatWeDoText, LIMITS.paragraph, DEFAULT_ABOUT_PAGE.whatWeDoText),
    offerings: cleanOfferings(body?.offerings),
    howWeThinkTitle: boundedText(body?.howWeThinkTitle, LIMITS.title, DEFAULT_ABOUT_PAGE.howWeThinkTitle),
    howWeThinkText: boundedText(body?.howWeThinkText, LIMITS.paragraph, DEFAULT_ABOUT_PAGE.howWeThinkText),
    values: cleanValues(body?.values),
    workflowTitle: boundedText(body?.workflowTitle, LIMITS.title, DEFAULT_ABOUT_PAGE.workflowTitle),
    workflow: cleanWorkflow(body?.workflow),
    servicesTitle: boundedText(body?.servicesTitle, LIMITS.title, DEFAULT_ABOUT_PAGE.servicesTitle),
    ctaTitle: boundedText(body?.ctaTitle, LIMITS.title, DEFAULT_ABOUT_PAGE.ctaTitle),
    ctaText: boundedText(body?.ctaText, LIMITS.paragraph, DEFAULT_ABOUT_PAGE.ctaText),
  };
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    return NextResponse.json(await getEditableAboutPage());
  } catch (error) {
    console.error("Unable to load About page:", error);
    return NextResponse.json({ error: "Unable to load About page." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin.ok) return admin.response;

  try {
    const body = await request.json();
    const data = normalize(body);

    await prisma.$executeRaw`
      INSERT INTO "AboutPageContent" (
        "id", "badge", "heroTitle", "heroDescription",
        "focusLabel", "focusValue", "approachLabel", "approachValue", "outputLabel", "outputValue",
        "whatWeDoTitle", "whatWeDoText", "offerings", "howWeThinkTitle", "howWeThinkText",
        "values", "workflowTitle", "workflow", "servicesTitle", "ctaTitle", "ctaText", "createdAt", "updatedAt"
      ) VALUES (
        'default', ${data.badge}, ${data.heroTitle}, ${data.heroDescription},
        ${data.stats[0]?.label ?? "Focus"}, ${data.stats[0]?.value ?? "Print + Digital"},
        ${data.stats[1]?.label ?? "Approach"}, ${data.stats[1]?.value ?? "Design-led"},
        ${data.stats[2]?.label ?? "Output"}, ${data.stats[2]?.value ?? "Launch-ready"},
        ${data.whatWeDoTitle}, ${data.whatWeDoText}, ${JSON.stringify(data.offerings)}::jsonb,
        ${data.howWeThinkTitle}, ${data.howWeThinkText}, ${JSON.stringify(data.values)}::jsonb,
        ${data.workflowTitle}, ${JSON.stringify(data.workflow)}::jsonb, ${data.servicesTitle},
        ${data.ctaTitle}, ${data.ctaText}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT ("id") DO UPDATE SET
        "badge" = EXCLUDED."badge",
        "heroTitle" = EXCLUDED."heroTitle",
        "heroDescription" = EXCLUDED."heroDescription",
        "focusLabel" = EXCLUDED."focusLabel",
        "focusValue" = EXCLUDED."focusValue",
        "approachLabel" = EXCLUDED."approachLabel",
        "approachValue" = EXCLUDED."approachValue",
        "outputLabel" = EXCLUDED."outputLabel",
        "outputValue" = EXCLUDED."outputValue",
        "whatWeDoTitle" = EXCLUDED."whatWeDoTitle",
        "whatWeDoText" = EXCLUDED."whatWeDoText",
        "offerings" = EXCLUDED."offerings",
        "howWeThinkTitle" = EXCLUDED."howWeThinkTitle",
        "howWeThinkText" = EXCLUDED."howWeThinkText",
        "values" = EXCLUDED."values",
        "workflowTitle" = EXCLUDED."workflowTitle",
        "workflow" = EXCLUDED."workflow",
        "servicesTitle" = EXCLUDED."servicesTitle",
        "ctaTitle" = EXCLUDED."ctaTitle",
        "ctaText" = EXCLUDED."ctaText",
        "updatedAt" = CURRENT_TIMESTAMP
    `;

    revalidatePath("/about");
    revalidatePath("/");
    return NextResponse.json(await getEditableAboutPage());
  } catch (error) {
    console.error("Unable to save About page:", error);
    return NextResponse.json({ error: "Unable to save About page." }, { status: 500 });
  }
}
