import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAssignments() {
  try {
    // Get the client
    const client = await prisma.client.findFirst();
    if (!client) {
      throw new Error('No client found');
    }

    // Get videos
    const videos = await prisma.video.findMany();
    if (videos.length === 0) {
      throw new Error('No videos found');
    }

    // Get meals
    const meals = await prisma.meal.findMany();
    if (meals.length === 0) {
      throw new Error('No meals found');
    }

    console.log(`Found client: ${client.name}`);
    console.log(`Found ${videos.length} videos`);
    console.log(`Found ${meals.length} meals`);

    // Clear existing assignments
    await prisma.videoAssignment.deleteMany({
      where: { clientId: client.id },
    });
    await prisma.mealPlan.deleteMany({
      where: { clientId: client.id },
    });

    // Create video assignments (assign 3 videos)
    const videoAssignments = [];
    for (let i = 0; i < Math.min(3, videos.length); i++) {
      const assignment = await prisma.videoAssignment.create({
        data: {
          clientId: client.id,
          videoId: videos[i].id,
          assignedDate: new Date(),
          notes: `Week ${i + 1} workout - Focus on proper form and technique`,
          progress: 0,
          isCompleted: false,
        },
      });
      videoAssignments.push(assignment);
    }

    // Create meal plan with assignments
    const mealPlan = await prisma.mealPlan.create({
      data: {
        clientId: client.id,
        name: 'Weekly Nutrition Plan',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        isActive: true,
        notes: 'Balanced nutrition plan for fitness goals',
        mealAssignments: {
          create: meals.slice(0, 6).map((meal, index) => ({
            mealId: meal.id,
            dayOfWeek: Math.floor(index / 2) + 1, // Spread across 3 days
            mealType: meal.type,
            portion: 1.0,
            notes: `Day ${Math.floor(index / 2) + 1} ${meal.type.toLowerCase()}`,
          })),
        },
      },
      include: {
        mealAssignments: {
          include: {
            meal: true,
          },
        },
      },
    });

    console.log('✅ Assignments created successfully!');
    console.log(`📹 Video assignments: ${videoAssignments.length}`);
    console.log(`🍽️ Meal assignments: ${mealPlan.mealAssignments.length}`);
  } catch (error) {
    console.error('❌ Error seeding assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAssignments();
