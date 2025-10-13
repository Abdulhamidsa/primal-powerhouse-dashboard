import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the default coach
    const coach = await prisma.user.findFirst({
      where: { email: 'coach@example.com' },
    });

    if (!coach) {
      console.error('Default coach not found');
      return;
    }

    // Create a sample client
    const client = await prisma.client.create({
      data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        status: 'ACTIVE',
        coachId: coach.id,
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    console.log('Sample client created:', client);
  } catch (error) {
    console.error('Error creating sample client:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
