// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🌱 Starting database seed...');

//   // Create a coach user
//   const coach = await prisma.user.upsert({
//     where: { email: 'coach@primal.com' },
//     update: {},
//     create: {
//       email: 'coach@primal.com',
//       name: 'Coach Mike',
//       password: 'hashed_password_here',
//       role: 'COACH',
//     },
//   });
//   console.log('✅ Created coach user');

//   // Create sample clients
//   const clients = await Promise.all([
//     prisma.client.upsert({
//       where: { email: 'john@example.com' },
//       update: {},
//       create: {
//         name: 'John Doe',
//         email: 'john@example.com',
//         phone: '+1234567890',
//         status: 'ACTIVE',
//         currentWeight: 180.0,
//         targetWeight: 170.0,
//         height: 5.8,
//         age: 30,
//         activityLevel: 'MODERATE',
//         goals: '["Weight Loss", "Muscle Gain"]',
//         coachId: coach.id,
//       },
//     }),
//     prisma.client.upsert({
//       where: { email: 'jane@example.com' },
//       update: {},
//       create: {
//         name: 'Jane Smith',
//         email: 'jane@example.com',
//         phone: '+1234567891',
//         status: 'ACTIVE',
//         currentWeight: 140.0,
//         targetWeight: 135.0,
//         height: 5.4,
//         age: 28,
//         activityLevel: 'HIGH',
//         goals: '["Tone Up", "Endurance"]',
//         coachId: coach.id,
//       },
//     }),
//   ]);
//   console.log('✅ Created sample clients');

//   // Create sample meals
//   const meals = await Promise.all([
//     // Breakfast meals
//     prisma.meal.upsert({
//       where: { id: 'breakfast-oatmeal' },
//       update: {},
//       create: {
//         id: 'breakfast-oatmeal',
//         name: 'Protein Oatmeal Bowl',
//         type: 'BREAKFAST',
//         calories: 420,
//         protein: 25,
//         carbs: 45,
//         fat: 12,
//         fiber: 8,
//         ingredients:
//           '["1 cup oats", "1 scoop protein powder", "1 banana", "1 tbsp almond butter", "1 cup almond milk"]',
//         instructions:
//           '["Cook oats with almond milk", "Stir in protein powder", "Top with sliced banana and almond butter"]',
//         prepTime: 5,
//         cookTime: 10,
//         servings: 1,
//         tags: '["High Protein", "Gluten Free"]',
//         coachId: coach.id,
//       },
//     }),
//     prisma.meal.upsert({
//       where: { id: 'breakfast-eggs' },
//       update: {},
//       create: {
//         id: 'breakfast-eggs',
//         name: 'Veggie Scrambled Eggs',
//         type: 'BREAKFAST',
//         calories: 380,
//         protein: 28,
//         carbs: 8,
//         fat: 24,
//         fiber: 3,
//         ingredients:
//           '["3 whole eggs", "1 cup spinach", "1/2 bell pepper", "1/4 cup cheese", "1 tbsp olive oil"]',
//         instructions:
//           '["Heat oil in pan", "Sauté vegetables", "Add beaten eggs", "Scramble and add cheese"]',
//         prepTime: 5,
//         cookTime: 8,
//         servings: 1,
//         tags: '["High Protein", "Keto Friendly"]',
//         coachId: coach.id,
//       },
//     }),

//     // Lunch meals
//     prisma.meal.upsert({
//       where: { id: 'lunch-chicken-salad' },
//       update: {},
//       create: {
//         id: 'lunch-chicken-salad',
//         name: 'Grilled Chicken Caesar Salad',
//         type: 'LUNCH',
//         calories: 450,
//         protein: 35,
//         carbs: 12,
//         fat: 28,
//         fiber: 6,
//         ingredients:
//           '["6oz grilled chicken breast", "2 cups romaine lettuce", "2 tbsp caesar dressing", "1/4 cup parmesan", "Croutons"]',
//         instructions:
//           '["Grill chicken breast", "Chop romaine lettuce", "Toss with dressing", "Top with chicken and parmesan"]',
//         prepTime: 10,
//         cookTime: 15,
//         servings: 1,
//         tags: '["High Protein", "Low Carb"]',
//         coachId: coach.id,
//       },
//     }),
//     prisma.meal.upsert({
//       where: { id: 'lunch-quinoa-bowl' },
//       update: {},
//       create: {
//         id: 'lunch-quinoa-bowl',
//         name: 'Quinoa Power Bowl',
//         type: 'LUNCH',
//         calories: 520,
//         protein: 22,
//         carbs: 65,
//         fat: 16,
//         fiber: 12,
//         ingredients:
//           '["1 cup cooked quinoa", "1/2 cup black beans", "1/2 avocado", "Cherry tomatoes", "Lime vinaigrette"]',
//         instructions:
//           '["Cook quinoa", "Combine beans and vegetables", "Top with avocado", "Drizzle with dressing"]',
//         prepTime: 15,
//         cookTime: 20,
//         servings: 1,
//         tags: '["Vegetarian", "High Fiber"]',
//         coachId: coach.id,
//       },
//     }),

//     // Dinner meals
//     prisma.meal.upsert({
//       where: { id: 'dinner-salmon' },
//       update: {},
//       create: {
//         id: 'dinner-salmon',
//         name: 'Baked Salmon with Sweet Potato',
//         type: 'DINNER',
//         calories: 580,
//         protein: 40,
//         carbs: 35,
//         fat: 26,
//         fiber: 6,
//         ingredients:
//           '["6oz salmon fillet", "1 medium sweet potato", "1 cup broccoli", "2 tbsp olive oil", "Herbs and spices"]',
//         instructions:
//           '["Bake salmon at 400°F", "Roast sweet potato", "Steam broccoli", "Season with herbs"]',
//         prepTime: 10,
//         cookTime: 25,
//         servings: 1,
//         tags: '["High Protein", "Omega-3 Rich"]',
//         coachId: coach.id,
//       },
//     }),
//     prisma.meal.upsert({
//       where: { id: 'dinner-chicken-rice' },
//       update: {},
//       create: {
//         id: 'dinner-chicken-rice',
//         name: 'Chicken Teriyaki with Brown Rice',
//         type: 'DINNER',
//         calories: 620,
//         protein: 45,
//         carbs: 55,
//         fat: 18,
//         fiber: 4,
//         ingredients:
//           '["6oz chicken breast", "1 cup brown rice", "Mixed vegetables", "2 tbsp teriyaki sauce", "1 tbsp sesame oil"]',
//         instructions:
//           '["Cook brown rice", "Stir-fry chicken", "Add vegetables", "Finish with teriyaki sauce"]',
//         prepTime: 15,
//         cookTime: 20,
//         servings: 1,
//         tags: '["High Protein", "Balanced Macros"]',
//         coachId: coach.id,
//       },
//     }),

//     // Snack meals
//     prisma.meal.upsert({
//       where: { id: 'snack-protein-smoothie' },
//       update: {},
//       create: {
//         id: 'snack-protein-smoothie',
//         name: 'Berry Protein Smoothie',
//         type: 'SNACK',
//         calories: 280,
//         protein: 25,
//         carbs: 32,
//         fat: 6,
//         fiber: 8,
//         ingredients:
//           '["1 scoop protein powder", "1 cup mixed berries", "1 cup unsweetened almond milk", "1 tbsp chia seeds"]',
//         instructions: '["Combine all ingredients", "Blend until smooth", "Add ice if desired"]',
//         prepTime: 5,
//         cookTime: 0,
//         servings: 1,
//         tags: '["High Protein", "Antioxidant Rich"]',
//         coachId: coach.id,
//       },
//     }),
//     prisma.meal.upsert({
//       where: { id: 'snack-nuts-fruit' },
//       update: {},
//       create: {
//         id: 'snack-nuts-fruit',
//         name: 'Mixed Nuts and Apple',
//         type: 'SNACK',
//         calories: 320,
//         protein: 8,
//         carbs: 28,
//         fat: 22,
//         fiber: 7,
//         ingredients: '["1 medium apple", "1 oz mixed nuts", "1 tbsp almond butter"]',
//         instructions: '["Slice apple", "Serve with nuts", "Dip in almond butter"]',
//         prepTime: 2,
//         cookTime: 0,
//         servings: 1,
//         tags: '["Natural", "Satisfying"]',
//         coachId: coach.id,
//       },
//     }),
//   ]);
//   console.log('✅ Created sample meals');

//   console.log('🎉 Database seeding completed!');
//   console.log(`Created ${clients.length} clients and ${meals.length} meals`);
// }

// main()
//   .catch(e => {
//     console.error('❌ Error during seeding:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
import { PrismaClient, Role, ClientStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1️⃣ Ensure a coach exists (required)
  const coachEmail = 'coach@primalpowerhouse.com';

  let coach = await prisma.user.findUnique({
    where: { email: coachEmail },
  });

  if (!coach) {
    const coachPassword = await bcrypt.hash('CoachTemp123', 12);

    coach = await prisma.user.create({
      data: {
        email: coachEmail,
        name: 'Default Coach',
        password: coachPassword,
        role: Role.COACH,
      },
    });

    console.log('Created coach:', coach.email);
  }

  // 2️⃣ Create client
  const clientEmail = 'client@primalpowerhouse.com';
  const clientPassword = 'ClientTemp123';

  const existingClient = await prisma.client.findUnique({
    where: { email: clientEmail },
  });

  if (existingClient) {
    console.log('Client already exists:', existingClient.email);
    return;
  }

  const hashedClientPassword = await bcrypt.hash(clientPassword, 12);

  const client = await prisma.client.create({
    data: {
      name: 'Test Client',
      email: clientEmail,
      password: hashedClientPassword,
      status: ClientStatus.ACTIVE,
      coachId: coach.id,
      age: 25,
      height: 175,
      currentWeight: 75,
      targetWeight: 70,
      goals: JSON.stringify(['fat loss', 'strength']),
    },
    select: {
      id: true,
      email: true,
      status: true,
      coachId: true,
      createdAt: true,
    },
  });

  console.log('Created client:', client);
  console.log('Client login:', clientEmail, '/', clientPassword);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
