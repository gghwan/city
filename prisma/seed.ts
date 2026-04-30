import { PrismaClient, Role, LinkType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('191435', 12);

  await prisma.user.upsert({
    where: { username: '김주형' },
    update: {},
    create: { username: '김주형', password: hash, role: Role.USER },
  });

  await prisma.user.upsert({
    where: { username: '김주형관리자' },
    update: {},
    create: { username: '김주형관리자', password: hash, role: Role.ADMIN },
  });

  await prisma.link.upsert({
    where: { type: LinkType.MAP },
    update: {},
    create: {
      type: LinkType.MAP,
      url: 'https://www.google.com/maps/d/edit?mid=1a44AvRB9e_7iE70S1bIvuWseT9yNI8M',
    },
  });

  await prisma.link.upsert({
    where: { type: LinkType.CARD },
    update: {},
    create: {
      type: LinkType.CARD,
      url: 'https://spn.jwcard.co.kr/',
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
