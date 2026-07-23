import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('LHX2008...', 10);

  const admin = await prisma.user.upsert({
    where: { account: '2942146423' },
    update: {
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      account: '2942146423',
      passwordHash,
      nickname: '管理员',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`Admin user seeded: ${admin.account} (${admin.nickname})`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
