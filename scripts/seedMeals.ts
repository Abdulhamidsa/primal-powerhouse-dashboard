import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMeals() {
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

    // Sample meals data
    const sampleMeals = [
      // Breakfast meals
      {
        name: 'Greek Yogurt Parfait',
        type: 'BREAKFAST' as const,
        calories: 350,
        protein: 20,
        carbs: 45,
        fat: 8,
        fiber: 5,
        ingredients: JSON.stringify([
          '1 cup Greek yogurt',
          '1/2 cup mixed berries',
          '1/4 cup granola',
          '1 tbsp honey',
          '1 tbsp chia seeds',
        ]),
        instructions: JSON.stringify([
          'Layer Greek yogurt in a bowl',
          'Add mixed berries on top',
          'Sprinkle granola and chia seeds',
          'Drizzle with honey',
          'Serve immediately',
        ]),
        prepTime: 5,
        cookTime: 0,
        servings: 1,
        tags: JSON.stringify(['high-protein', 'quick', 'vegetarian']),
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=200&fit=crop',
        coachId: coach.id,
      },
      {
        name: 'Avocado Toast with Eggs',
        type: 'BREAKFAST' as const,
        calories: 420,
        protein: 18,
        carbs: 35,
        fat: 22,
        fiber: 12,
        ingredients: JSON.stringify([
          '2 slices whole grain bread',
          '1 ripe avocado',
          '2 eggs',
          'Salt and pepper to taste',
          '1 tsp olive oil',
          'Red pepper flakes (optional)',
        ]),
        instructions: JSON.stringify([
          'Toast the bread slices',
          'Mash avocado with salt and pepper',
          'Fry eggs to your preference',
          'Spread avocado on toast',
          'Top with fried eggs',
          'Sprinkle with red pepper flakes if desired',
        ]),
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        tags: JSON.stringify(['high-fiber', 'healthy-fats', 'vegetarian']),
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&h=200&fit=crop',
        coachId: coach.id,
      },

      // Lunch meals
      {
        name: 'Quinoa Buddha Bowl',
        type: 'LUNCH' as const,
        calories: 485,
        protein: 16,
        carbs: 62,
        fat: 18,
        fiber: 10,
        ingredients: JSON.stringify([
          '1 cup cooked quinoa',
          '1/2 cup roasted chickpeas',
          '1 cup mixed greens',
          '1/2 avocado sliced',
          '1/4 cup shredded carrots',
          '2 tbsp tahini dressing',
          '1 tbsp pumpkin seeds',
        ]),
        instructions: JSON.stringify([
          'Arrange quinoa in a bowl',
          'Add mixed greens and vegetables',
          'Top with roasted chickpeas and avocado',
          'Drizzle with tahini dressing',
          'Sprinkle with pumpkin seeds',
        ]),
        prepTime: 15,
        cookTime: 0,
        servings: 1,
        tags: JSON.stringify(['vegan', 'high-fiber', 'complete-protein']),
        imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=200&fit=crop',
        coachId: coach.id,
      },
      {
        name: 'Grilled Chicken Salad',
        type: 'LUNCH' as const,
        calories: 395,
        protein: 35,
        carbs: 15,
        fat: 22,
        fiber: 8,
        ingredients: JSON.stringify([
          '6 oz grilled chicken breast',
          '2 cups mixed salad greens',
          '1/2 cup cherry tomatoes',
          '1/4 cup cucumber sliced',
          '1/4 cup red onion',
          '2 tbsp olive oil vinaigrette',
          '1 oz feta cheese',
        ]),
        instructions: JSON.stringify([
          'Grill chicken breast until cooked through',
          'Let chicken rest, then slice',
          'Combine salad greens and vegetables',
          'Top with sliced chicken and feta',
          'Drizzle with vinaigrette',
        ]),
        prepTime: 10,
        cookTime: 15,
        servings: 1,
        tags: JSON.stringify(['high-protein', 'low-carb', 'gluten-free']),
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop',
        coachId: coach.id,
      },

      // Dinner meals
      {
        name: 'Baked Salmon with Sweet Potato',
        type: 'DINNER' as const,
        calories: 520,
        protein: 40,
        carbs: 35,
        fat: 24,
        fiber: 6,
        ingredients: JSON.stringify([
          '6 oz salmon fillet',
          '1 medium baked sweet potato',
          '2 cups steamed broccoli',
          '1 tbsp olive oil',
          'Lemon juice',
          'Garlic powder',
          'Salt and pepper',
        ]),
        instructions: JSON.stringify([
          'Preheat oven to 400°F',
          'Season salmon with salt, pepper, and garlic powder',
          'Bake salmon for 12-15 minutes',
          'Bake sweet potato for 45 minutes',
          'Steam broccoli until tender',
          'Drizzle with olive oil and lemon juice',
        ]),
        prepTime: 10,
        cookTime: 45,
        servings: 1,
        tags: JSON.stringify(['omega-3', 'high-protein', 'anti-inflammatory']),
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=200&fit=crop',
        coachId: coach.id,
      },
      {
        name: 'Turkey and Vegetable Stir Fry',
        type: 'DINNER' as const,
        calories: 445,
        protein: 32,
        carbs: 25,
        fat: 24,
        fiber: 7,
        ingredients: JSON.stringify([
          '6 oz ground turkey',
          '2 cups mixed stir-fry vegetables',
          '1 tbsp coconut oil',
          '2 tbsp soy sauce',
          '1 tsp sesame oil',
          '2 cloves garlic minced',
          '1 tsp fresh ginger',
        ]),
        instructions: JSON.stringify([
          'Heat coconut oil in a large pan',
          'Cook ground turkey until browned',
          'Add garlic and ginger, cook 1 minute',
          'Add vegetables and stir-fry until tender',
          'Season with soy sauce and sesame oil',
          'Serve hot',
        ]),
        prepTime: 10,
        cookTime: 15,
        servings: 1,
        tags: JSON.stringify(['high-protein', 'low-carb', 'quick-cooking']),
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
        coachId: coach.id,
      },

      // Snack meals
      {
        name: 'Protein Smoothie',
        type: 'SNACK' as const,
        calories: 285,
        protein: 25,
        carbs: 32,
        fat: 8,
        fiber: 6,
        ingredients: JSON.stringify([
          '1 scoop protein powder',
          '1 banana',
          '1 cup unsweetened almond milk',
          '1 tbsp almond butter',
          '1 cup spinach',
          '1/2 cup ice cubes',
        ]),
        instructions: JSON.stringify([
          'Add all ingredients to blender',
          'Blend until smooth',
          'Add more almond milk if needed for consistency',
          'Pour into glass and serve immediately',
        ]),
        prepTime: 5,
        cookTime: 0,
        servings: 1,
        tags: JSON.stringify(['high-protein', 'post-workout', 'quick']),
        imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&h=200&fit=crop',
        coachId: coach.id,
      },
      {
        name: 'Apple Slices with Almond Butter',
        type: 'SNACK' as const,
        calories: 195,
        protein: 6,
        carbs: 22,
        fat: 12,
        fiber: 5,
        ingredients: JSON.stringify(['1 medium apple', '2 tbsp almond butter', 'Cinnamon to taste']),
        instructions: JSON.stringify([
          'Wash and slice apple',
          'Serve with almond butter for dipping',
          'Sprinkle with cinnamon if desired',
        ]),
        prepTime: 3,
        cookTime: 0,
        servings: 1,
        tags: JSON.stringify(['healthy-fats', 'fiber', 'natural-sugars']),
        imageUrl: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&h=200&fit=crop',
        coachId: coach.id,
      },
    ];

    // Delete existing meals to avoid duplicates
    await prisma.meal.deleteMany({
      where: { coachId: coach.id },
    });

    // Create sample meals
    for (const mealData of sampleMeals) {
      await prisma.meal.create({
        data: mealData,
      });
    }

    console.log('✅ Sample meals seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding meals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMeals();
