import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with AI tutor content...');

  // Create tracks
  const tracks = await Promise.all([
    prisma.track.create({
      data: {
        title: 'Inspection & NDT',
        description: 'AI Tutor for Non-Destructive Testing and Inspection',
        color: 'blue',
        order: 1,
        lessons: {
          create: [
            {
              title: 'AI Tutor: Visual Inspection Fundamentals',
              content: '# AI Tutor: Visual Inspection Fundamentals\n\nWelcome to your NDT AI Tutor. This lesson covers visual inspection principles, equipment requirements, and systematic inspection procedures.',
              order: 1,
            }
          ]
        }
      }
    }),
    prisma.track.create({
      data: {
        title: 'Diver Medic Technician',
        description: 'AI Tutor for Diver Medic Technician',
        color: 'red',
        order: 2,
        lessons: {
          create: [
            {
              title: 'AI Tutor: Scene Assessment and Safety',
              content: '# AI Tutor: Scene Assessment and Safety\n\nWelcome to your DMT AI Tutor. This lesson covers DR ABCDE assessment protocol and emergency response procedures.',
              order: 1,
            }
          ]
        }
      }
    }),
    prisma.track.create({
      data: {
        title: 'Commercial Dive Supervisor',
        description: 'AI Tutor for Commercial Dive Supervisor',
        color: 'green',
        order: 3,
        lessons: {
          create: [
            {
              title: 'AI Tutor: Dive Planning Fundamentals',
              content: '# AI Tutor: Dive Planning Fundamentals\n\nWelcome to your Dive Supervisor AI Tutor. This lesson covers comprehensive dive planning and risk management.',
              order: 1,
            }
          ]
        }
      }
    }),
    prisma.track.create({
      data: {
        title: 'Air Diver',
        description: 'AI Tutor for Air Diving',
        color: 'yellow',
        order: 4,
        lessons: {
          create: [
            {
              title: 'AI Tutor: Diving Physics Review',
              content: '# AI Tutor: Diving Physics Review\n\nWelcome to your Air Diving AI Tutor. This lesson covers gas laws, pressure relationships, and gas management.',
              order: 1,
            }
          ]
        }
      }
    }),
    prisma.track.create({
      data: {
        title: 'Saturation Diver',
        description: 'AI Tutor for Saturation Diving',
        color: 'purple',
        order: 5,
        lessons: {
          create: [
            {
              title: 'AI Tutor: Saturation Diving Overview',
              content: '# AI Tutor: Saturation Diving Overview\n\nWelcome to your Saturation Diving AI Tutor. This lesson covers saturation principles and system components.',
              order: 1,
            }
          ]
        }
      }
    }),
    prisma.track.create({
      data: {
        title: 'Assistant Life Support Technician (ALST)',
        description: 'AI Tutor for Assistant Life Support Technician',
        color: 'indigo',
        order: 6,
        lessons: {
          create: [
            {
              title: 'AI Tutor: ALST Fundamentals',
              content: '# AI Tutor: ALST Fundamentals\n\nWelcome to your ALST AI Tutor. This lesson covers life support system components and gas management.',
              order: 1,
            }
          ]
        }
      }
    }),
    prisma.track.create({
      data: {
        title: 'Life Support Technician (LST)',
        description: 'AI Tutor for Life Support Technician',
        color: 'teal',
        order: 7,
        lessons: {
          create: [
            {
              title: 'AI Tutor: LST Advanced Systems',
              content: '# AI Tutor: LST Advanced Systems\n\nWelcome to your LST AI Tutor. This lesson covers advanced life support systems and troubleshooting.',
              order: 1,
            }
          ]
        }
      }
    })
  ]);

  console.log(`✅ Created ${tracks.length} tracks with AI tutor content`);

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@diverwell.com' },
    update: {},
    create: {
      email: 'admin@diverwell.com',
      name: 'Admin User',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbQJhKz8O',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user (email: admin@diverwell.com, password: admin123)');
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
