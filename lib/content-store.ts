import { prisma } from "@/lib/prisma";

export type EditableService = { id?:string; slug:string; name:string; summary:string; description:string; icon:"code"|"rocket"|"sparkles"|"image"; image?:string|null; deliverables:string[]; process:string[]; bestFor:string[] };
export type EditableStartupTool = { id?:string; slug:string; name:string; summary:string; description:string; price:number; priceLabel:string; category:string; thumbnail:string|null; screenshots:string[]; benefits:string[]; includedFiles:string[]; bestFor:string[]; instructions:string|null; faqs:unknown };
export type AboutOffering = { icon:"printer"|"megaphone"|"layers"|"rocket"; title:string; text:string };
export type AboutValue = { title:string; text:string };
export type EditableAboutPage = {
  id?:string;
  badge:string;
  heroTitle:string;
  heroDescription:string;
  stats:{label:string;value:string}[];
  whatWeDoTitle:string;
  whatWeDoText:string;
  offerings:AboutOffering[];
  howWeThinkTitle:string;
  howWeThinkText:string;
  values:AboutValue[];
  workflowTitle:string;
  workflow:string[];
  servicesTitle:string;
  ctaTitle:string;
  ctaText:string;
};

export type HomeWhyItem = { title:string; text:string };
export type EditableHomePage = {
  id?:string;
  badge:string;
  heroTitle:string;
  heroHighlight:string;
  heroDescription:string;
  primaryCtaLabel:string;
  primaryCtaHref:string;
  secondaryCtaLabel:string;
  secondaryCtaHref:string;
  servicesTitle:string;
  servicesDescription:string;
  toolsTitle:string;
  toolsDescription:string;
  portfolioTitle:string;
  portfolioDescription:string;
  whyTitle:string;
  whyDescription:string;
  whyItems:HomeWhyItem[];
  finalCtaTitle:string;
  finalCtaDescription:string;
  finalCtaLabel:string;
  finalCtaHref:string;
};

export type EditableTestimonial = {
  id?:string;
  name:string;
  role:string;
  company:string;
  avatarUrl:string;
  content:string;
  rating:number;
  isPublished:boolean;
  createdAt?:string;
  updatedAt?:string;
};

export const DEFAULT_ABOUT_PAGE: EditableAboutPage = {
  badge: "About Space Zone Media",
  heroTitle: "A creative media team for brands that need to look ready everywhere.",
  heroDescription: "Space Zone Media brings printing, design, marketing, and digital execution together so businesses can launch with a consistent presence across storefronts, social platforms, websites, and campaigns.",
  stats: [
    { label: "Focus", value: "Print + Digital" },
    { label: "Approach", value: "Design-led" },
    { label: "Output", value: "Launch-ready" },
  ],
  whatWeDoTitle: "What we do",
  whatWeDoText: "We help businesses show up professionally in the places customers actually see them: printed materials, store campaigns, social media, search results, and web experiences.",
  offerings: [
    { icon: "printer", title: "Printing materials", text: "Posters, cards, flyers, menus, and production-ready campaign assets." },
    { icon: "megaphone", title: "Marketing content", text: "Social visuals, campaign graphics, launch messaging, and content systems." },
    { icon: "layers", title: "Brand design", text: "Identity systems, store banners, layout direction, and consistent brand assets." },
    { icon: "rocket", title: "Digital growth", text: "Web pages, SEO, startup tools, and conversion-focused digital experiences." },
  ],
  howWeThinkTitle: "How we think",
  howWeThinkText: "Space Zone Media is built for practical creativity: the kind of work that looks polished, communicates fast, and can move from concept to real business use.",
  values: [
    { title: "Clarity before creativity", text: "Every design, banner, campaign, or website starts with the offer, audience, and business goal. Good visuals should make the message easier to understand." },
    { title: "Launch-ready delivery", text: "We package work so it can actually be used: print-ready files, platform-ready graphics, responsive pages, and practical handoff notes." },
    { title: "One brand, every channel", text: "Your print materials, Instagram posts, store banners, website, and marketing campaigns should feel like they belong to the same business." },
  ],
  workflowTitle: "Our workflow",
  workflow: [
    "Understand the goal, audience, offer, and channels.",
    "Create a focused visual and messaging direction.",
    "Design, build, and prepare the assets for real use.",
    "Review, refine, and hand off the final launch-ready files.",
  ],
  servicesTitle: "Services at a glance",
  ctaTitle: "Ready to make your brand feel complete?",
  ctaText: "Bring the idea, product, campaign, or store goal. We'll help shape the visuals, message, and launch assets around it.",
};

export const DEFAULT_HOME_PAGE: EditableHomePage = {
  badge: "SpaceZone Agency",
  heroTitle: "Launch Your Digital Journey to the Next Orbit",
  heroHighlight: "to the Next Orbit",
  heroDescription: "SpaceZone is a premium digital agency helping brands, startups, and creators build powerful online experiences.",
  primaryCtaLabel: "Enter SpaceZone",
  primaryCtaHref: "/portfolio",
  secondaryCtaLabel: "Explore Services",
  secondaryCtaHref: "/services",
  servicesTitle: "Our Core Services",
  servicesDescription: "Comprehensive digital solutions designed to help your business scale efficiently and securely.",
  toolsTitle: "Startup Tools Marketplace",
  toolsDescription: "Premium digital tools and resources engineered to give your team a competitive edge.",
  portfolioTitle: "Featured Work",
  portfolioDescription: "A selection of recent projects built to turn ideas into launch-ready experiences.",
  whyTitle: "Why SpaceZone",
  whyDescription: "One connected creative partner for strategy, design, development, and practical digital delivery.",
  whyItems: [
    { title: "Strategy-first", text: "Every project starts with the audience, offer, and outcome so the work has a clear job to do." },
    { title: "Built for real use", text: "Designs and digital experiences are prepared for the actual channels, screens, and workflows your business uses." },
    { title: "One connected ecosystem", text: "Services, websites, startup tools, and creative assets work together instead of feeling like separate pieces." },
  ],
  finalCtaTitle: "Ready to build your next move?",
  finalCtaDescription: "Tell us what you are launching, improving, or selling. We will help shape the next step around it.",
  finalCtaLabel: "Start a Project",
  finalCtaHref: "/contact",
};

export function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}
function linesToList(value:string|null|undefined){return(value??"").split("\n").map(x=>x.trim()).filter(Boolean)}
function iconForService(slug:string,name:string):EditableService["icon"]{const key=`${slug} ${name}`.toLowerCase();if(key.includes("web")||key.includes("app"))return"code";if(key.includes("seo")||key.includes("marketing"))return"rocket";if(key.includes("banner")||key.includes("store"))return"image";return"sparkles"}
function formatPrice(price:number){return Number.isInteger(price)?`$${price}`:`$${price.toFixed(3).replace(/0+$/,'').replace(/\.$/,'')}`}
function mapServiceRecord(record:any):EditableService{return{id:record.id,slug:record.slug,name:record.name,summary:record.summary,description:record.description,icon:iconForService(record.slug,record.name),image:record.imageUrl??null,deliverables:linesToList(record.examples),process:linesToList(record.workflow),bestFor:linesToList(record.bestFor)}}
function mapToolRecord(record:any):EditableStartupTool{const price=Number(record.price);return{id:record.id,slug:record.slug,name:record.name,summary:record.summary,description:record.description,price,priceLabel:formatPrice(price),category:record.category.name,thumbnail:record.thumbnail,screenshots:record.screenshots??[],benefits:record.benefits??[],includedFiles:record.includedFiles??[],bestFor:record.bestFor??[],instructions:record.instructions??null,faqs:record.faqs??null}}
function isRecord(value:unknown):value is Record<string,unknown>{return typeof value === "object" && value !== null}
function sanitizeAbout(row:any):EditableAboutPage{
  const stats = Array.isArray(row.stats) ? row.stats : DEFAULT_ABOUT_PAGE.stats;
  const offerings = Array.isArray(row.offerings) ? row.offerings : DEFAULT_ABOUT_PAGE.offerings;
  const values = Array.isArray(row.values) ? row.values : DEFAULT_ABOUT_PAGE.values;
  const workflow = Array.isArray(row.workflow) ? row.workflow.filter((item:unknown)=>typeof item === "string") : DEFAULT_ABOUT_PAGE.workflow;
  return {
    id: row.id,
    badge: String(row.badge ?? DEFAULT_ABOUT_PAGE.badge),
    heroTitle: String(row.heroTitle ?? DEFAULT_ABOUT_PAGE.heroTitle),
    heroDescription: String(row.heroDescription ?? DEFAULT_ABOUT_PAGE.heroDescription),
    stats: stats.filter(isRecord).map((item)=>({label:String(item.label??""),value:String(item.value??"")})),
    whatWeDoTitle: String(row.whatWeDoTitle ?? DEFAULT_ABOUT_PAGE.whatWeDoTitle),
    whatWeDoText: String(row.whatWeDoText ?? DEFAULT_ABOUT_PAGE.whatWeDoText),
    offerings: offerings.filter(isRecord).map((item)=>({icon:(item.icon === "megaphone" || item.icon === "layers" || item.icon === "rocket" ? item.icon : "printer") as AboutOffering["icon"],title:String(item.title??""),text:String(item.text??"")})),
    howWeThinkTitle: String(row.howWeThinkTitle ?? DEFAULT_ABOUT_PAGE.howWeThinkTitle),
    howWeThinkText: String(row.howWeThinkText ?? DEFAULT_ABOUT_PAGE.howWeThinkText),
    values: values.filter(isRecord).map((item)=>({title:String(item.title??""),text:String(item.text??"")})),
    workflowTitle: String(row.workflowTitle ?? DEFAULT_ABOUT_PAGE.workflowTitle),
    workflow,
    servicesTitle: String(row.servicesTitle ?? DEFAULT_ABOUT_PAGE.servicesTitle),
    ctaTitle: String(row.ctaTitle ?? DEFAULT_ABOUT_PAGE.ctaTitle),
    ctaText: String(row.ctaText ?? DEFAULT_ABOUT_PAGE.ctaText),
  };
}

function sanitizeHome(row:any):EditableHomePage{
  const whyItems = Array.isArray(row.whyItems) ? row.whyItems : DEFAULT_HOME_PAGE.whyItems;
  return {
    id: row.id,
    badge:String(row.badge ?? DEFAULT_HOME_PAGE.badge),
    heroTitle:String(row.heroTitle ?? DEFAULT_HOME_PAGE.heroTitle),
    heroHighlight:String(row.heroHighlight ?? DEFAULT_HOME_PAGE.heroHighlight),
    heroDescription:String(row.heroDescription ?? DEFAULT_HOME_PAGE.heroDescription),
    primaryCtaLabel:String(row.primaryCtaLabel ?? DEFAULT_HOME_PAGE.primaryCtaLabel),
    primaryCtaHref:String(row.primaryCtaHref ?? DEFAULT_HOME_PAGE.primaryCtaHref),
    secondaryCtaLabel:String(row.secondaryCtaLabel ?? DEFAULT_HOME_PAGE.secondaryCtaLabel),
    secondaryCtaHref:String(row.secondaryCtaHref ?? DEFAULT_HOME_PAGE.secondaryCtaHref),
    servicesTitle:String(row.servicesTitle ?? DEFAULT_HOME_PAGE.servicesTitle),
    servicesDescription:String(row.servicesDescription ?? DEFAULT_HOME_PAGE.servicesDescription),
    toolsTitle:String(row.toolsTitle ?? DEFAULT_HOME_PAGE.toolsTitle),
    toolsDescription:String(row.toolsDescription ?? DEFAULT_HOME_PAGE.toolsDescription),
    portfolioTitle:String(row.portfolioTitle ?? DEFAULT_HOME_PAGE.portfolioTitle),
    portfolioDescription:String(row.portfolioDescription ?? DEFAULT_HOME_PAGE.portfolioDescription),
    whyTitle:String(row.whyTitle ?? DEFAULT_HOME_PAGE.whyTitle),
    whyDescription:String(row.whyDescription ?? DEFAULT_HOME_PAGE.whyDescription),
    whyItems:whyItems.filter(isRecord).map((item)=>({title:String(item.title??""),text:String(item.text??"")})),
    finalCtaTitle:String(row.finalCtaTitle ?? DEFAULT_HOME_PAGE.finalCtaTitle),
    finalCtaDescription:String(row.finalCtaDescription ?? DEFAULT_HOME_PAGE.finalCtaDescription),
    finalCtaLabel:String(row.finalCtaLabel ?? DEFAULT_HOME_PAGE.finalCtaLabel),
    finalCtaHref:String(row.finalCtaHref ?? DEFAULT_HOME_PAGE.finalCtaHref),
  };
}

export async function getEditableServices(){const records=await prisma.service.findMany({orderBy:{createdAt:"asc"}});if(!records.length)return[];const media=await prisma.serviceMedia.findMany({where:{serviceId:{in:records.map(r=>r.id)}},select:{serviceId:true,imageUrl:true}});const map=new Map(media.map(r=>[r.serviceId,r.imageUrl]));return records.map(r=>mapServiceRecord({...r,imageUrl:map.get(r.id)??null}))}
export async function getEditableService(slug:string){const record=await prisma.service.findUnique({where:{slug}});if(!record)return undefined;const media=await prisma.serviceMedia.findUnique({where:{serviceId:record.id},select:{imageUrl:true}});return mapServiceRecord({...record,imageUrl:media?.imageUrl??null})}
export async function getEditableStartupTools(){const records=await prisma.startupTool.findMany({include:{category:true},orderBy:{createdAt:"asc"}});return records.map(mapToolRecord)}
export async function getEditableStartupTool(slug:string){const record=await prisma.startupTool.findUnique({where:{slug},include:{category:true}});return record?mapToolRecord(record):undefined}
export async function getEditableAboutPage(){
  try {
    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM "AboutPageContent" WHERE "id" = 'default' LIMIT 1`;
    if (!rows.length) return DEFAULT_ABOUT_PAGE;
    const row = rows[0];
    return sanitizeAbout({ ...row, stats:[
      {label:row.focusLabel,value:row.focusValue},
      {label:row.approachLabel,value:row.approachValue},
      {label:row.outputLabel,value:row.outputValue},
    ]});
  } catch (error) {
    console.error("Unable to load About page content:", error);
    return DEFAULT_ABOUT_PAGE;
  }
}
export async function getEditableHomePage(){
  try {
    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM "HomePageContent" WHERE "id" = 'default' LIMIT 1`;
    if (!rows.length) return DEFAULT_HOME_PAGE;
    return sanitizeHome(rows[0]);
  } catch (error) {
    console.error("Unable to load Home page content:", error);
    return DEFAULT_HOME_PAGE;
  }
}

function mapTestimonial(row:any):EditableTestimonial{return{id:String(row.id),name:String(row.name??""),role:String(row.role??""),company:String(row.company??""),avatarUrl:String(row.avatarUrl??""),content:String(row.content??""),rating:Math.min(5,Math.max(1,Number(row.rating??5))),isPublished:Boolean(row.isPublished),createdAt:row.createdAt?.toISOString?.()??String(row.createdAt??""),updatedAt:row.updatedAt?.toISOString?.()??String(row.updatedAt??"")}}
export async function getTestimonials(options:{publishedOnly?:boolean;limit?:number}={}){
  const limit=Math.min(12,Math.max(1,options.limit??6));
  const published=options.publishedOnly===true;
  const rows=await prisma.$queryRaw<any[]>`
    SELECT * FROM "Testimonial"
    ${published ? prisma.$queryRawUnsafe('WHERE "isPublished" = true') : prisma.$queryRawUnsafe('')}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;
  return rows.map(mapTestimonial);
}
export async function getTestimonial(id:string){
  const rows=await prisma.$queryRaw<any[]>`SELECT * FROM "Testimonial" WHERE "id" = ${id} LIMIT 1`;
  return rows.length?mapTestimonial(rows[0]):undefined;
}
