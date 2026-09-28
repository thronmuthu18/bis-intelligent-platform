import { PrismaClient } from '@prisma/client';
import { VERIFIED_SEED_STANDARDS } from '../src/data/seedStandards.js';
import { persistStandardRecord } from '../src/services/ingestion/deduplication.js';
import { validateStandardItem } from '../src/services/ingestion/validator.js';
import { syncStandardEmbeddings } from '../src/services/rag/embedding.service.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BIS Knowledge Layer & Embeddings verified seed...');

  let createdCount = 0;
  let updatedCount = 0;
  let embeddedCount = 0;

  for (const item of VERIFIED_SEED_STANDARDS) {
    const validation = validateStandardItem(item);
    if (!validation.isValid) {
      console.warn(`⚠️ Validation failed for ${item.isNumber}:`, validation.errors);
      continue;
    }

    const res = await persistStandardRecord(item);
    if (res.action === 'CREATED') {
      createdCount++;
    } else {
      updatedCount++;
    }

    // Generate & persist chunk embeddings for hybrid search
    const embedRes = await syncStandardEmbeddings(res.standardId);
    embeddedCount += embedRes.newEmbedded;
  }

  console.log(`✅ Seed completed: ${createdCount} standards created, ${updatedCount} updated, ${embeddedCount} chunks embedded.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
