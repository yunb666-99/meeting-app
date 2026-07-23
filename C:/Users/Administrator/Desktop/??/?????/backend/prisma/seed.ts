import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('正在创建初始管理员账号...');

  const passwordHash = await bcrypt.hash('LHX2008...', 10);

  const admin = await prisma.user.upsert({
    where: { account: '2942146423' },
    update: {
      role: 'ADMIN',
      nickname: '管理员',
    },
    create: {
      account: '2942146423',
      passwordHash: passwordHash,
      nickname: '管理员',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`初始管理员账号已创建: ${admin.account}`);
  console.log('请登录后立即修改密码！');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('种子数据创建失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
