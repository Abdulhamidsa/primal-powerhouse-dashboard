import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Clear existing data
    await prisma.workout.deleteMany();
    await prisma.client.deleteMany();
    await prisma.meal.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();

    // Create default coach
    const coach = await prisma.user.create({
      data: {
        email: 'coach@example.com',
        name: 'Default Coach',
        password: 'hashedpassword',
        role: 'COACH',
      },
    });

    // Create meals
    const meals = await Promise.all([
      prisma.meal.create({
        data: {
          name: 'Mediterranean Avocado Toast',
          type: 'BREAKFAST',
          calories: 420,
          protein: 18,
          carbs: 28,
          fat: 24,
          fiber: 12,
          ingredients: JSON.stringify([
            '2 slices whole grain bread',
            '1 ripe avocado',
            '2 organic eggs',
            '1 tsp extra virgin olive oil',
            'Sea salt and black pepper',
            'Red pepper flakes',
            'Fresh herbs (optional)',
          ]),
          instructions: JSON.stringify([
            'Toast bread slices until golden brown',
            'Mash avocado with salt, pepper, and olive oil',
            'Poach eggs in simmering water for 3-4 minutes',
            'Spread avocado mixture on toast',
            'Top with poached eggs',
            'Garnish with red pepper flakes and herbs',
          ]),
          prepTime: 10,
          cookTime: 8,
          servings: 1,
          tags: JSON.stringify(['vegetarian', 'high-protein', 'healthy', 'mediterranean']),
          imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500',
          coachId: coach.id,
        },
      }),
      prisma.meal.create({
        data: {
          name: 'Grilled Chicken Caesar Salad',
          type: 'LUNCH',
          calories: 380,
          protein: 35,
          carbs: 12,
          fat: 22,
          fiber: 6,
          ingredients: JSON.stringify([
            '6 oz chicken breast',
            '4 cups romaine lettuce',
            '2 tbsp Caesar dressing',
            '2 tbsp parmesan cheese',
            '1/4 cup whole grain croutons',
            'Fresh black pepper',
          ]),
          instructions: JSON.stringify([
            'Season chicken breast with salt and pepper',
            'Grill chicken for 6-7 minutes per side',
            'Chop romaine lettuce into bite-sized pieces',
            'Slice grilled chicken into strips',
            'Toss lettuce with Caesar dressing',
            'Top with chicken, cheese, and croutons',
          ]),
          prepTime: 15,
          cookTime: 12,
          servings: 1,
          tags: JSON.stringify(['high-protein', 'low-carb', 'gluten-free-option']),
          imageUrl: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=500',
          coachId: coach.id,
        },
      }),
      prisma.meal.create({
        data: {
          name: 'Herb-Crusted Salmon Bowl',
          type: 'DINNER',
          calories: 520,
          protein: 42,
          carbs: 45,
          fat: 18,
          fiber: 8,
          ingredients: JSON.stringify([
            '6 oz wild salmon fillet',
            '1/2 cup quinoa',
            '1 cup mixed vegetables (broccoli, carrots, bell peppers)',
            '1 tbsp olive oil',
            'Fresh herbs (dill, parsley)',
            'Lemon juice',
            'Garlic powder',
          ]),
          instructions: JSON.stringify([
            'Cook quinoa according to package instructions',
            'Season salmon with herbs, salt, and pepper',
            'Heat olive oil in pan over medium-high heat',
            'Pan-sear salmon for 4-5 minutes per side',
            'Steam or sauté mixed vegetables',
            'Assemble bowl with quinoa, vegetables, and salmon',
            'Finish with fresh herbs and lemon juice',
          ]),
          prepTime: 10,
          cookTime: 20,
          servings: 1,
          tags: JSON.stringify(['high-protein', 'omega-3', 'gluten-free', 'nutrient-dense']),
          imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
          coachId: coach.id,
        },
      }),
    ]);

    // Create clients
    const clients = await Promise.all([
      prisma.client.create({
        data: {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+1 (555) 123-4567',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          status: 'ACTIVE',
          currentWeight: 145,
          targetWeight: 135,
          height: 165,
          age: 28,
          activityLevel: 'MODERATE',
          dietaryRestrictions: JSON.stringify(['vegetarian']),
          goals: JSON.stringify(['weight-loss', 'muscle-gain']),
          notes: 'Prefers morning workouts, loves plant-based proteins',
          lastSession: new Date('2024-07-15'),
          nextSession: new Date('2024-07-22'),
          sessionsCompleted: 24,
          progressPhotos: JSON.stringify(['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300']),
          coachId: coach.id,
        },
      }),
      prisma.client.create({
        data: {
          name: 'Michael Chen',
          email: 'michael.chen@email.com',
          phone: '+1 (555) 234-5678',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          status: 'ACTIVE',
          currentWeight: 180,
          targetWeight: 190,
          height: 178,
          age: 32,
          activityLevel: 'HIGH',
          dietaryRestrictions: JSON.stringify([]),
          goals: JSON.stringify(['muscle-gain', 'strength']),
          notes: 'Experienced lifter, focuses on compound movements',
          lastSession: new Date('2024-07-16'),
          nextSession: new Date('2024-07-19'),
          sessionsCompleted: 18,
          progressPhotos: JSON.stringify(['https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=300']),
          coachId: coach.id,
        },
      }),
    ]);

    // Create workouts
    await Promise.all([
      prisma.workout.create({
        data: {
          date: new Date('2024-07-15'),
          type: 'STRENGTH_TRAINING',
          duration: 60,
          exercises: JSON.stringify([
            {
              name: 'Squats',
              sets: 3,
              reps: 12,
              weight: 65,
              restTime: 90,
            },
            {
              name: 'Deadlifts',
              sets: 3,
              reps: 10,
              weight: 80,
              restTime: 120,
            },
          ]),
          notes: 'Great form improvement on squats, increased weight by 5lbs',
          caloriesBurned: 280,
          rating: 4,
          clientId: clients[0].id,
          coachId: coach.id,
        },
      }),
      prisma.workout.create({
        data: {
          date: new Date('2024-07-16'),
          type: 'STRENGTH_TRAINING',
          duration: 75,
          exercises: JSON.stringify([
            {
              name: 'Squats',
              sets: 4,
              reps: 8,
              weight: 120,
              restTime: 120,
            },
            {
              name: 'Overhead Press',
              sets: 3,
              reps: 10,
              weight: 70,
              restTime: 90,
            },
          ]),
          notes: 'Strong session, hitting personal records',
          caloriesBurned: 350,
          rating: 5,
          clientId: clients[1].id,
          coachId: coach.id,
        },
      }),
    ]);

    // Create upcoming sessions
    await Promise.all([
      prisma.session.create({
        data: {
          clientId: clients[0].id,
          coachId: coach.id,
          date: new Date('2024-07-22T16:00:00.000Z'),
          type: 'STRENGTH_TRAINING',
          duration: 60,
          status: 'SCHEDULED',
        },
      }),
      prisma.session.create({
        data: {
          clientId: clients[1].id,
          coachId: coach.id,
          date: new Date('2024-07-19T10:00:00.000Z'),
          type: 'STRENGTH_TRAINING',
          duration: 75,
          status: 'SCHEDULED',
        },
      }),
    ]);

    return NextResponse.json({
      message: 'Database seeded successfully',
      coachId: coach.id,
      data: {
        meals: meals.length,
        clients: clients.length,
        workouts: 2,
        sessions: 2,
      },
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
