import { DatabaseService } from './database.service';

async function runSeed() {
  console.log('--- Starting FinTechathon 2026 Seed Script ---');
  const db = new DatabaseService();
  await db.onModuleInit();
  console.log('Seed executed successfully: Fake student and 4 mock remittance routes are ready.');
  await db.onModuleDestroy();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
