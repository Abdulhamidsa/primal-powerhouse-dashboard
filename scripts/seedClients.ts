import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedClients() {
  try {
    // Create a default coach first
    const coach = await prisma.user.upsert({
      where: { email: 'coach@example.com' },
      update: {},
      create: {
        email: 'coach@example.com',
        name: 'Default Coach',
        password: 'hashedpassword',
        role: 'COACH',
      },
    });

    // Sample clients data
    const sampleClients = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 123-4567',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b490?w=150&h=150&fit=crop&crop=face',
        status: 'ACTIVE' as const,
        goals: JSON.stringify(['weight-loss', 'muscle-building']),
        currentWeight: 150,
        targetWeight: 135,
        height: 165,
        age: 28,
        activityLevel: 'MODERATE' as const,
        dietaryRestrictions: JSON.stringify(['vegetarian']),
        notes: 'Motivated client, prefers morning workouts',
        sessionsCompleted: 24,
        coachId: coach.id,
      },
      {
        name: 'Mike Chen',
        email: 'mike.chen@email.com',
        phone: '+1 (555) 234-5678',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        status: 'ACTIVE' as const,
        goals: JSON.stringify(['muscle-building', 'strength']),
        currentWeight: 180,
        targetWeight: 190,
        height: 178,
        age: 32,
        activityLevel: 'HIGH' as const,
        dietaryRestrictions: JSON.stringify([]),
        notes: 'Experienced lifter, focused on strength gains',
        sessionsCompleted: 36,
        coachId: coach.id,
      },
      {
        name: 'Emma Wilson',
        email: 'emma.wilson@email.com',
        phone: '+1 (555) 345-6789',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        status: 'ACTIVE' as const,
        goals: JSON.stringify(['endurance', 'weight-loss']),
        currentWeight: 140,
        targetWeight: 130,
        height: 162,
        age: 25,
        activityLevel: 'MODERATE' as const,
        dietaryRestrictions: JSON.stringify(['gluten-free']),
        notes: 'Marathon runner, needs nutrition guidance',
        sessionsCompleted: 18,
        coachId: coach.id,
      },
      {
        name: 'David Rodriguez',
        email: 'david.rodriguez@email.com',
        phone: '+1 (555) 456-7890',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        status: 'INACTIVE' as const,
        goals: JSON.stringify(['weight-loss']),
        currentWeight: 220,
        targetWeight: 190,
        height: 185,
        age: 35,
        activityLevel: 'LOW' as const,
        dietaryRestrictions: JSON.stringify([]),
        notes: 'Taking a break, planning to return next month',
        sessionsCompleted: 12,
        coachId: coach.id,
      },
      {
        name: 'Lisa Thompson',
        email: 'lisa.thompson@email.com',
        phone: '+1 (555) 567-8901',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        status: 'ACTIVE' as const,
        goals: JSON.stringify(['flexibility', 'wellness']),
        currentWeight: 125,
        targetWeight: 125,
        height: 160,
        age: 29,
        activityLevel: 'MODERATE' as const,
        dietaryRestrictions: JSON.stringify(['dairy-free']),
        notes: 'Yoga enthusiast, focuses on mind-body connection',
        sessionsCompleted: 30,
        coachId: coach.id,
      },
    ];

    // Delete existing clients to avoid duplicates
    await prisma.client.deleteMany({
      where: { coachId: coach.id },
    });

    // Create sample clients
    for (const clientData of sampleClients) {
      await prisma.client.create({
        data: clientData,
      });
    }

    console.log('✅ Sample clients seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding clients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedClients();
