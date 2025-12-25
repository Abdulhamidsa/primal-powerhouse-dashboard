const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignAnabolicFrenchToastToClient() {
  try {
    // Find the client
    const client = await prisma.client.findFirst({
      where: { email: 'aboood7000syw@gmail.com' },
    });

    if (!client) {
      console.error('Client not found');
      return;
    }

    // Find the anabolic french toast meal we just added
    const meal = await prisma.meal.findFirst({
      where: { name: 'Anabolic French Toast' },
      orderBy: { createdAt: 'desc' },
    });

    if (!meal) {
      console.error('Anabolic French Toast meal not found');
      return;
    }

    // Find the client's active meal plan
    let mealPlan = await prisma.mealPlan.findFirst({
      where: {
        clientId: client.id,
        isActive: true,
      },
    });

    // If no active meal plan exists, create one
    if (!mealPlan) {
      mealPlan = await prisma.mealPlan.create({
        data: {
          id: 'plan-' + client.id + '-' + Date.now(),
          name: 'Updated Weekly Nutrition Plan',
          startDate: new Date(),
          isActive: true,
          clientId: client.id,
        },
      });
      console.log('Created new meal plan for client');
    }

    // Add the anabolic french toast as a breakfast option for multiple days
    const breakfastAssignments = [];

    // Add it as breakfast option for Monday (1), Wednesday (3), and Friday (5)
    for (const dayOfWeek of [1, 3, 5]) {
      const assignment = await prisma.mealAssignment.create({
        data: {
          id: `assignment-anabolic-french-toast-day${dayOfWeek}-` + Date.now(),
          dayOfWeek: dayOfWeek,
          mealType: 'BREAKFAST',
          portion: 1.0,
          scheduledTime: '08:00',
          notes: 'High-protein anabolic breakfast - perfect for muscle building!',
          mealPlanId: mealPlan.id,
          mealId: meal.id,
        },
      });
      breakfastAssignments.push(assignment);
    }

    console.log('✅ Successfully assigned Anabolic French Toast to client!');
    console.log(`Added ${breakfastAssignments.length} breakfast assignments`);
    console.log('Days: Monday, Wednesday, Friday');
    console.log('Scheduled time: 8:00 AM');
  } catch (error) {
    console.error('❌ Error assigning meal to client:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignAnabolicFrenchToastToClient();
