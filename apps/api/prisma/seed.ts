import { PrismaClient, Role, PageCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CESIZen database...');

  // ── Emotions Niveau 1
  const emotionData = [
    { label: 'Joie', color: '#52B788', children: ['Bonheur', 'Enthousiasme', 'Fierté', 'Gratitude'] },
    { label: 'Tristesse', color: '#9B59B6', children: ['Mélancolie', 'Déception', 'Chagrin', 'Nostalgie'] },
    { label: 'Anxiété', color: '#E05252', children: ['Peur', 'Inquiétude', 'Nervosité', 'Stress'] },
    { label: 'Sérénité', color: '#4A90D9', children: ['Calme', 'Paix intérieure', 'Satisfaction', 'Bien-être'] },
    { label: 'Frustration', color: '#F4A261', children: ['Colère', 'Irritation', 'Impatience', 'Agacement'] },
  ];

  for (const e of emotionData) {
    const parent = await prisma.emotion.upsert({
      where: { label: e.label },
      update: {},
      create: { label: e.label, level: 1, color: e.color },
    });
    for (const child of e.children) {
      await prisma.emotion.upsert({
        where: { label: child },
        update: {},
        create: { label: child, level: 2, color: e.color, parentId: parent.id },
      });
    }
  }
  console.log('✅ Emotions créées');

  // ── Admin user
  const adminHash = await bcrypt.hash('password', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cesizen.fr' },
    update: {},
    create: {
      email: 'admin@cesizen.fr',
      passwordHash: adminHash,
      role: Role.ADMIN,
      userInfo: {
        create: { firstName: 'Admin', lastName: 'CESIZen', city: 'Paris' },
      },
    },
  });

  // ── Demo user
  const userHash = await bcrypt.hash('password', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'user@cesizen.fr' },
    update: {},
    create: {
      email: 'user@cesizen.fr',
      passwordHash: userHash,
      role: Role.USER,
      userInfo: {
        create: { firstName: 'Corentin', lastName: 'D.', city: 'Paris' },
      },
    },
  });
  console.log('✅ Utilisateurs créés');

  // ── Pages
  const pages = [
    { title: 'Comprendre le stress', category: PageCategory.PREVENTION, content: 'Le stress est une réaction naturelle de l\'organisme face à une situation perçue comme menaçante ou exigeante. Il peut être aigu (court terme) ou chronique. Comprendre ses mécanismes est la première étape pour mieux le gérer au quotidien.' },
    { title: 'Techniques de respiration', category: PageCategory.EXERCISE, content: 'La respiration consciente est un outil puissant pour gérer le stress et l\'anxiété. La cohérence cardiaque (5 secondes inspiration, 5 secondes expiration, 6 fois par minute) est particulièrement efficace. Pratiquez 3 fois par jour.' },
    { title: 'Importance de la santé mentale', category: PageCategory.PREVENTION, content: 'La santé mentale est aussi importante que la santé physique. Elle influence notre façon de penser, de ressentir et d\'agir au quotidien. Prendre soin de sa santé mentale est un investissement pour l\'ensemble de sa vie.' },
    { title: 'Activités de détente', category: PageCategory.EXERCISE, content: 'Intégrer des activités relaxantes dans votre routine quotidienne peut considérablement améliorer votre bien-être. La marche en nature, la lecture, le yoga ou même un bain chaud sont autant de moyens de réduire votre niveau de stress.' },
  ];

  for (const p of pages) {
    await prisma.pageInfo.create({
      data: { ...p, isPublished: true, authorId: admin.id },
    });
  }
  console.log('✅ Pages créées');

  // ── Demo entries
  const joie = await prisma.emotion.findFirst({ where: { label: 'Joie' } });
  const serenite = await prisma.emotion.findFirst({ where: { label: 'Sérénité' } });
  const frustration = await prisma.emotion.findFirst({ where: { label: 'Frustration' } });

  if (joie && serenite && frustration) {
    await prisma.trackerEntry.createMany({
      data: [
        { userId: demoUser.id, emotionId: joie.id, intensity: 2, comment: 'Bonne journée au travail', loggedAt: new Date() },
        { userId: demoUser.id, emotionId: frustration.id, intensity: 3, loggedAt: new Date(Date.now() - 86400000) },
        { userId: demoUser.id, emotionId: serenite.id, intensity: 4, comment: 'Méditation du matin', loggedAt: new Date(Date.now() - 86400000) },
      ],
    });
  }
  console.log('✅ Entrées tracker créées');
  console.log('🎉 Seed terminé !');
}

main().catch(console.error).finally(() => prisma.$disconnect());
