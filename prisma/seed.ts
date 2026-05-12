import { PrismaClient, Role, LinkType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const RAW_USER_LIST =
  '강소라close강정화close고영주close고영진close고하은closeverified_user구군회close구지모closeverified_user구해모close김강돈close김경곤closeverified_user김경환close김금희close김도한close김미자close김민경close김병수close김선태close김송자close김순옥close김승단close김승욱close김영화close김옥자closeverified_user김용천close김원각close김유경close김윤성close김종숙closeverified_user김주형close김주희closeverified_user김철현close김향란close김현정closeverified_user김홍운close나성윤close나성운close문경숙close문안순closeverified_user박영환close박재은closeverified_user박정훈close박현승closeverified_user배성민closeverified_user범영근close석정숙close손경운close손경혜close손세현close손일태close송보라close송자연close신성희close신재일close염영숙close염영옥close오기쁨close원세미close유병숙close유순금close유예원close유정숙close윤정순close윤혜리close이기성closeverified_user이기화closeverified_user이범준close이비선close이선자close이영희close이은송close이정숙close이정희close이중민close이중휘close이창희close임지영close임혜자close장용호closeverified_user전동혁close전수지close정경선close정명진closeverified_user정민우close정아현close정완자close정음표close정재원close정찬민close조건화close조만제close조민석close조세희close조우빈close조정두closeverified_user조정화close조하빈close조현숙closeverified_user차태훈close채민석close채원숙close최금숙close최수현close최예은closeverified_user최지연close추영례close칸리나close함빈closeverified_user허상철closeverified_user홍준호close황금자close황수천close황인혜close';

function parseUsernamesFromRaw(raw: string) {
  const compact = raw.replace(/\s+/g, '');
  const tokens = compact
    .split('close')
    .map((token) => token.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const usernames: string[] = [];

  for (const token of tokens) {
    const username = token.replace(/^verified_user/, '').trim();
    if (!username || seen.has(username)) continue;
    seen.add(username);
    usernames.push(username);
  }

  return usernames;
}

async function main() {
  const hash = await bcrypt.hash('191435', 12);
  const usernames = parseUsernamesFromRaw(RAW_USER_LIST);

  for (const username of usernames) {
    await prisma.user.upsert({
      where: { username },
      update: {
        password: hash,
        role: Role.USER,
      },
      create: {
        username,
        password: hash,
        role: Role.USER,
      },
    });
  }

  await prisma.user.upsert({
    where: { username: '김주형관리자' },
    update: { password: hash, role: Role.ADMIN },
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
