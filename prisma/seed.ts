import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { services } from '../lib/services';
import { startupTools } from '../lib/startup-tools';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Services...');
  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name,
        description: service.summary,
        workflow: service.process.join('\n'),
        examples: service.deliverables.join('\n'),
      },
      create: {
        name: service.name,
        slug: service.slug,
        description: service.summary,
        workflow: service.process.join('\n'),
        examples: service.deliverables.join('\n'),
      },
    });
  }

  console.log('Seeding Tool Categories...');
  const categories = new Map<string, string>();

  for (const tool of startupTools) {
    const slug = tool.category.toLowerCase().replace(/\s+/g, '-');
    const category = await prisma.toolCategory.upsert({
      where: { slug },
      update: { name: tool.category },
      create: {
        name: tool.category,
        slug,
      },
    });

    categories.set(tool.category, category.id);
  }

  console.log('Seeding Startup Tools...');
  for (const tool of startupTools) {
    await prisma.startupTool.upsert({
      where: { slug: tool.slug },
      update: {
        name: tool.name,
        thumbnail: tool.thumbnail,
        screenshots: [tool.thumbnail],
        summary: tool.summary,
        description: tool.description,
        benefits: tool.benefits,
        includedFiles: tool.includedFiles,
        price: tool.price,
        categoryId: categories.get(tool.category)!,
      },
      create: {
        name: tool.name,
        slug: tool.slug,
        thumbnail: tool.thumbnail,
        screenshots: [tool.thumbnail],
        summary: tool.summary,
        description: tool.description,
        benefits: tool.benefits,
        includedFiles: tool.includedFiles,
        price: tool.price,
        categoryId: categories.get(tool.category)!,
      },
    });
  }

  console.log('Seeding Admin...');
  await prisma.admin.upsert({
    where: { email: 'admin@spacezonemedia.com' },
    update: {},
    create: {
      email: 'admin@spacezonemedia.com',
      password: 'hashed_password_placeholder',
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
