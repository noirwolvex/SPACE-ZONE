import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing old data...');
  // Clear existing data conceptually or just relying on unique constraints/upsert
  // Since we shouldn't delete everything in production, we will use upsert.

  console.log('Seeding Services...');
  await prisma.service.upsert({
    where: { slug: 'web-app-development' },
    update: {},
    create: {
      name: 'Web & App Development',
      slug: 'web-app-development',
      description: 'Custom, scalable applications built with modern frameworks to power your digital presence.',
    },
  });

  await prisma.service.upsert({
    where: { slug: 'seo-digital-marketing' },
    update: {},
    create: {
      name: 'SEO & Digital Marketing',
      slug: 'seo-digital-marketing',
      description: 'Data-driven strategies to increase your visibility and drive high-quality traffic to your platform.',
    },
  });

  console.log('Seeding Tool Categories...');
  const saasCategory = await prisma.toolCategory.upsert({
    where: { slug: 'saas' },
    update: {},
    create: {
      name: 'SaaS',
      slug: 'saas',
    },
  });

  const bundleCategory = await prisma.toolCategory.upsert({
    where: { slug: 'bundle' },
    update: {},
    create: {
      name: 'Bundle',
      slug: 'bundle',
    },
  });

  console.log('Seeding Startup Tools...');
  await prisma.startupTool.upsert({
    where: { slug: 'startup-launch-kit' },
    update: {},
    create: {
      name: 'Startup Launch Kit',
      slug: 'startup-launch-kit',
      summary: 'A complete bundle of templates, legal docs, and financial models for early-stage startups.',
      description: 'Detailed description of the startup launch kit.',
      price: 49.0,
      categoryId: bundleCategory.id,
    },
  });

  await prisma.startupTool.upsert({
    where: { slug: 'seo-audit-pro' },
    update: {},
    create: {
      name: 'SEO Audit Pro',
      slug: 'seo-audit-pro',
      summary: 'Automated technical and content SEO auditing tool designed for modern Next.js/React apps.',
      description: 'Detailed description of SEO Audit Pro.',
      price: 29.0,
      categoryId: saasCategory.id,
    },
  });

  console.log('Seeding Admin...');
  await prisma.admin.upsert({
    where: { email: 'admin@spacezonemedia.com' },
    update: {},
    create: {
      email: 'admin@spacezonemedia.com',
      password: 'hashed_password_placeholder', // Should be properly hashed conceptually
      name: 'Super Admin',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
