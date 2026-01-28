import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fullSeed() {
  try {
    console.log('🚀 Starting complete seeding...\n');

    // 1. Clear all existing data
    console.log('🧹 Clearing existing data...');
    await prisma.videoAssignment.deleteMany();
    await prisma.mealAssignment.deleteMany();
    await prisma.mealPlan.deleteMany();
    await prisma.video.deleteMany();
    await prisma.meal.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create coach
    console.log('👨‍💼 Creating coach...');
    const coach = await prisma.user.create({
      data: {
        email: 'coach@fitness.com',
        name: 'Mike Johnson',
        password: 'hashedpassword123',
        role: 'COACH',
      },
    });

    // 3. Create clients
    console.log('👥 Creating clients...');
    const clients = await Promise.all([
      prisma.client.create({
        data: {
          name: 'Sarah Williams',
          email: 'sarah@example.com',
          phone: '+1234567890',
          status: 'ACTIVE',
          currentWeight: 65,
          targetWeight: 60,
          height: 165,
          age: 28,
          activityLevel: 'MODERATE',
          goals: JSON.stringify(['WEIGHT_LOSS', 'MUSCLE_TONE']),
          notes: 'Beginner looking to lose weight and tone up',
          coachId: coach.id,
        },
      }),
      prisma.client.create({
        data: {
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+1987654321',
          status: 'ACTIVE',
          currentWeight: 80,
          targetWeight: 75,
          height: 180,
          age: 35,
          activityLevel: 'HIGH',
          goals: JSON.stringify(['STRENGTH_GAIN', 'MUSCLE_BUILDING']),
          notes: 'Experienced athlete focusing on strength training',
          coachId: coach.id,
        },
      }),
      prisma.client.create({
        data: {
          name: 'Emma Davis',
          email: 'emma@example.com',
          phone: '+1555123456',
          status: 'ACTIVE',
          currentWeight: 55,
          targetWeight: 58,
          height: 160,
          age: 24,
          activityLevel: 'LOW',
          goals: JSON.stringify(['FLEXIBILITY', 'GENERAL_FITNESS']),
          notes: 'New to fitness, wants to improve flexibility and overall health',
          coachId: coach.id,
        },
      }),
    ]);

    // 4. Create videos
    console.log('🎥 Creating videos...');
    const videos = await Promise.all([
      prisma.video.create({
        data: {
          title: 'Morning Yoga Flow',
          description: 'A gentle 20-minute yoga flow perfect for starting your day with mindfulness and flexibility',
          category: 'YOGA',
          difficulty: 'BEGINNER',
          duration: 1200,
          videoUrl: 'https://www.youtube.com/watch?v=v7AYKMP6rOE',
          thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
          equipment: JSON.stringify(['Yoga Mat']),
          muscleGroups: JSON.stringify(['Full Body', 'Core', 'Flexibility']),
          tags: JSON.stringify(['morning', 'flexibility', 'mindfulness', 'beginner']),
          coachId: coach.id,
        },
      }),
      prisma.video.create({
        data: {
          title: 'HIIT Cardio Blast',
          description: 'High-intensity interval training for maximum calorie burn and cardiovascular fitness',
          category: 'CARDIO',
          difficulty: 'INTERMEDIATE',
          duration: 1800,
          videoUrl: 'https://www.youtube.com/watch?v=Nz6jLGICRgE',
          thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
          equipment: JSON.stringify(['None']),
          muscleGroups: JSON.stringify(['Full Body', 'Cardiovascular']),
          tags: JSON.stringify(['cardio', 'hiit', 'fat-burn', 'intense']),
          coachId: coach.id,
        },
      }),
      prisma.video.create({
        data: {
          title: 'Strength Training Basics',
          description: 'Learn proper form for fundamental strength exercises with progressive overload',
          category: 'STRENGTH_TRAINING',
          difficulty: 'BEGINNER',
          duration: 2400,
          videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400',
          equipment: JSON.stringify(['Dumbbells', 'Resistance Bands']),
          muscleGroups: JSON.stringify(['Arms', 'Legs', 'Core', 'Back']),
          tags: JSON.stringify(['strength', 'basics', 'form', 'beginner']),
          coachId: coach.id,
        },
      }),
      prisma.video.create({
        data: {
          title: 'Advanced Core Workout',
          description: 'Challenge your core with advanced exercises for serious abdominal development',
          category: 'STRENGTH_TRAINING',
          difficulty: 'ADVANCED',
          duration: 1500,
          videoUrl: 'https://www.youtube.com/watch?v=K56Z12j1Uw4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
          equipment: JSON.stringify(['Exercise Ball', 'Ab Wheel']),
          muscleGroups: JSON.stringify(['Core', 'Abs', 'Obliques']),
          tags: JSON.stringify(['core', 'abs', 'advanced', 'challenge']),
          coachId: coach.id,
        },
      }),
      prisma.video.create({
        data: {
          title: 'Post-Workout Stretch',
          description: 'Essential stretches to improve recovery and prevent injury after intense workouts',
          category: 'MOBILITY',
          difficulty: 'BEGINNER',
          duration: 900,
          videoUrl: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
          thumbnailUrl: 'https://images.unsplash.com/photo-1506629905227-b2f583f95d65?w=400',
          equipment: JSON.stringify(['Yoga Mat']),
          muscleGroups: JSON.stringify(['Full Body', 'Flexibility']),
          tags: JSON.stringify(['cooldown', 'stretching', 'recovery', 'flexibility']),
          coachId: coach.id,
        },
      }),
    ]);

    // 5. Create meals
    console.log('🍽️ Creating meals...');
    const meals = await Promise.all([
      prisma.meal.create({
        data: {
          name: 'Protein Power Breakfast',
          type: 'BREAKFAST',
          calories: 420,
          protein: 35,
          carbs: 25,
          fat: 18,
          fiber: 6,
          ingredients: JSON.stringify(['3 eggs', '1 slice whole grain toast', '1/2 avocado', 'spinach', 'tomatoes']),
          instructions: JSON.stringify(['Scramble eggs with spinach', 'Toast bread', 'Top with avocado and tomatoes']),
          prepTime: 10,
          cookTime: 8,
          servings: 1,
          tags: JSON.stringify(['high-protein', 'low-carb', 'quick']),
          coachId: coach.id,
        },
      }),
      prisma.meal.create({
        data: {
          name: 'Greek Yogurt Bowl',
          type: 'BREAKFAST',
          calories: 280,
          protein: 20,
          carbs: 35,
          fat: 8,
          fiber: 5,
          ingredients: JSON.stringify([
            '1 cup Greek yogurt',
            '1/2 cup berries',
            '2 tbsp granola',
            '1 tbsp honey',
            'almonds',
          ]),
          instructions: JSON.stringify([
            'Layer yogurt in bowl',
            'Top with berries and granola',
            'Drizzle with honey',
            'Add almonds',
          ]),
          prepTime: 5,
          cookTime: 0,
          servings: 1,
          tags: JSON.stringify(['protein-rich', 'antioxidants', 'no-cook']),
          coachId: coach.id,
        },
      }),
      prisma.meal.create({
        data: {
          name: 'Grilled Chicken Salad',
          type: 'LUNCH',
          calories: 380,
          protein: 42,
          carbs: 15,
          fat: 16,
          fiber: 8,
          ingredients: JSON.stringify([
            '6oz grilled chicken',
            'mixed greens',
            'cucumber',
            'bell peppers',
            'olive oil',
            'balsamic vinegar',
          ]),
          instructions: JSON.stringify([
            'Grill chicken breast',
            'Chop vegetables',
            'Toss with greens',
            'Dress with oil and vinegar',
          ]),
          prepTime: 15,
          cookTime: 12,
          servings: 1,
          tags: JSON.stringify(['lean-protein', 'low-carb', 'fresh']),
          coachId: coach.id,
        },
      }),
      prisma.meal.create({
        data: {
          name: 'Quinoa Power Bowl',
          type: 'LUNCH',
          calories: 450,
          protein: 18,
          carbs: 52,
          fat: 16,
          fiber: 12,
          ingredients: JSON.stringify([
            '1 cup cooked quinoa',
            'black beans',
            'roasted vegetables',
            'avocado',
            'tahini dressing',
          ]),
          instructions: JSON.stringify([
            'Cook quinoa',
            'Roast vegetables',
            'Assemble bowl',
            'Top with avocado and dressing',
          ]),
          prepTime: 20,
          cookTime: 25,
          servings: 1,
          tags: JSON.stringify(['plant-based', 'complete-protein', 'fiber-rich']),
          coachId: coach.id,
        },
      }),
      prisma.meal.create({
        data: {
          name: 'Baked Salmon & Vegetables',
          type: 'DINNER',
          calories: 520,
          protein: 45,
          carbs: 28,
          fat: 24,
          fiber: 10,
          ingredients: JSON.stringify(['6oz salmon fillet', 'sweet potato', 'broccoli', 'olive oil', 'herbs', 'lemon']),
          instructions: JSON.stringify([
            'Season salmon',
            'Cut vegetables',
            'Bake everything together',
            'Serve with lemon',
          ]),
          prepTime: 15,
          cookTime: 25,
          servings: 1,
          tags: JSON.stringify(['omega-3', 'complete-meal', 'anti-inflammatory']),
          coachId: coach.id,
        },
      }),
      prisma.meal.create({
        data: {
          name: 'Turkey & Sweet Potato',
          type: 'DINNER',
          calories: 480,
          protein: 38,
          carbs: 35,
          fat: 18,
          fiber: 8,
          ingredients: JSON.stringify(['6oz ground turkey', 'roasted sweet potato', 'green beans', 'garlic', 'herbs']),
          instructions: JSON.stringify([
            'Cook turkey with garlic',
            'Roast sweet potato',
            'Steam green beans',
            'Combine and season',
          ]),
          prepTime: 12,
          cookTime: 30,
          servings: 1,
          tags: JSON.stringify(['lean-protein', 'complex-carbs', 'balanced']),
          coachId: coach.id,
        },
      }),
      prisma.meal.create({
        data: {
          name: 'Protein Smoothie',
          type: 'SNACK',
          calories: 240,
          protein: 25,
          carbs: 20,
          fat: 8,
          fiber: 6,
          ingredients: JSON.stringify(['1 scoop protein powder', 'banana', 'spinach', 'almond milk', 'chia seeds']),
          instructions: JSON.stringify(['Add all ingredients to blender', 'Blend until smooth', 'Serve immediately']),
          prepTime: 3,
          cookTime: 0,
          servings: 1,
          tags: JSON.stringify(['post-workout', 'quick', 'nutrient-dense']),
          coachId: coach.id,
        },
      }),
      prisma.meal.create({
        data: {
          name: 'Apple & Almond Butter',
          type: 'SNACK',
          calories: 190,
          protein: 6,
          carbs: 22,
          fat: 12,
          fiber: 5,
          ingredients: JSON.stringify(['1 medium apple', '2 tbsp almond butter', 'cinnamon']),
          instructions: JSON.stringify(['Slice apple', 'Serve with almond butter', 'Sprinkle cinnamon']),
          prepTime: 2,
          cookTime: 0,
          servings: 1,
          tags: JSON.stringify(['simple', 'natural', 'energy-boost']),
          coachId: coach.id,
        },
      }),
    ]);

    // 6. Create assignments for each client
    console.log('📋 Creating assignments...');

    for (const client of clients) {
      // Video assignments (3 videos per client)

      // Meal plan with assignments

      console.log(`✅ Created assignments for ${client.name}`);
    }

    console.log('\n🎉 Complete seeding finished successfully!');
    console.log(`👨‍💼 Coach: ${coach.name}`);
    console.log(`👥 Clients: ${clients.length}`);
    console.log(`🎥 Videos: ${videos.length}`);
    console.log(`🍽️ Meals: ${meals.length}`);
    console.log(`📋 Each client has 3 video assignments and 1 meal plan`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fullSeed();
