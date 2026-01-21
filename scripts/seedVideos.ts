import { prisma } from '@/lib/prisma'; // adjust path to your prisma singleton file
import { Prisma, DifficultyLevel, VideoCategory } from '@prisma/client';

const sampleVideos: Prisma.VideoCreateInput[] = [
  {
    title: 'Morning Yoga Flow',
    description: 'A gentle 20-minute yoga flow perfect for starting your day',
    category: VideoCategory.YOGA,
    difficulty: DifficultyLevel.BEGINNER,
    duration: 1200,
    videoUrl: 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    equipment: JSON.stringify(['Yoga Mat']),
    muscleGroups: JSON.stringify(['Full Body', 'Core']),
    tags: JSON.stringify(['morning', 'flexibility', 'beginner']),
    instructions: JSON.stringify([
      "Start in child's pose",
      'Move through cat-cow stretches',
      'Flow through sun salutations',
      'End in savasana',
    ]),
    tips: JSON.stringify(['Listen to your body', 'Focus on breathing', 'Modify poses as needed']),
    coach: { connect: { id: '' } }, // placeholder, set below
  },
  {
    title: 'HIIT Cardio Blast',
    description: 'High-intensity interval training for maximum fat burn',
    category: VideoCategory.CARDIO,
    difficulty: DifficultyLevel.INTERMEDIATE,
    duration: 1800,
    videoUrl: 'https://www.youtube.com/watch?v=Nz6jLGICRgE',
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    equipment: JSON.stringify(['None']),
    muscleGroups: JSON.stringify(['Full Body', 'Cardiovascular']),
    tags: JSON.stringify(['cardio', 'hiit', 'fat-burn']),
    instructions: JSON.stringify([
      'Warm up for 5 minutes',
      '30 seconds work, 15 seconds rest',
      'Repeat for 8 rounds',
      'Cool down for 5 minutes',
    ]),
    tips: JSON.stringify(['Push yourself during work intervals', 'Use rest periods to recover', 'Stay hydrated']),
    coach: { connect: { id: '' } },
  },
  {
    title: 'Strength Training Basics',
    description: 'Learn proper form for fundamental strength exercises',
    category: VideoCategory.STRENGTH_TRAINING,
    difficulty: DifficultyLevel.BEGINNER,
    duration: 2400,
    videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    thumbnailUrl: 'https://example.com/thumb3.jpg',
    equipment: JSON.stringify(['Dumbbells', 'Resistance Bands']),
    muscleGroups: JSON.stringify(['Arms', 'Legs', 'Core', 'Back']),
    tags: JSON.stringify(['strength', 'basics', 'form']),
    instructions: JSON.stringify([
      'Start with bodyweight movements',
      'Add resistance gradually',
      'Focus on proper form',
      'Rest between sets',
    ]),
    tips: JSON.stringify(['Quality over quantity', 'Start with lighter weights', 'Progress gradually']),
    coach: { connect: { id: '' } },
  },
  {
    title: 'Post-Workout Stretch',
    description: 'Essential stretches to cool down after your workout',
    category: VideoCategory.MOBILITY,
    difficulty: DifficultyLevel.BEGINNER,
    duration: 900,
    videoUrl: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
    thumbnailUrl: 'https://example.com/thumb4.jpg',
    equipment: JSON.stringify(['Yoga Mat']),
    muscleGroups: JSON.stringify(['Full Body']),
    tags: JSON.stringify(['cooldown', 'stretching', 'recovery']),
    instructions: JSON.stringify([
      'Hold each stretch for 30 seconds',
      'Breathe deeply',
      "Don't bounce",
      'Focus on tight areas',
    ]),
    tips: JSON.stringify(['Stretch when muscles are warm', 'Never stretch to pain', 'Consistency is key']),
    coach: { connect: { id: '' } },
  },
  {
    title: 'Advanced Pilates Core',
    description: 'Challenge your core with advanced pilates movements',
    category: VideoCategory.PILATES,
    difficulty: DifficultyLevel.ADVANCED,
    duration: 1500,
    videoUrl: 'https://www.youtube.com/watch?v=K56Z12j1Uw4',
    thumbnailUrl: 'https://example.com/thumb5.jpg',
    equipment: JSON.stringify(['Pilates Mat', 'Pilates Ball']),
    muscleGroups: JSON.stringify(['Core', 'Stabilizers']),
    tags: JSON.stringify(['pilates', 'core', 'advanced']),
    instructions: JSON.stringify([
      'Engage core throughout',
      'Control every movement',
      'Focus on precision',
      'Maintain neutral spine',
    ]),
    tips: JSON.stringify(['Quality over speed', 'Engage deep abdominals', "Don't hold your breath"]),
    coach: { connect: { id: '' } },
  },
];

async function seedVideos() {
  try {
    const coach = await prisma.user.findFirst({
      where: { role: 'COACH' },
      select: { id: true },
    });

    if (!coach) {
      throw new Error('No coach found (role=COACH). Create a coach user first.');
    }

    await prisma.video.deleteMany({});

    const data = sampleVideos.map(v => ({
      ...v,
      coach: { connect: { id: coach.id } },
    }));

    await prisma.video.createMany({
      data: data.map(({ coach, ...rest }) => rest as Prisma.VideoCreateManyInput),
    });

    console.log('✅ Sample videos seeded successfully!');
  } catch (error) {
    console.error('Error seeding videos:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedVideos();
