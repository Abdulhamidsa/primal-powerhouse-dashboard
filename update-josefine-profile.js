const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateJosefineProfile() {
  try {
    const client = await prisma.client.findFirst({
      where: { name: 'josefine' },
    });

    if (!client) {
      console.log('Josefine not found');
      return;
    }

    // Update Josefine's profile with the provided information
    const updatedClient = await prisma.client.update({
      where: { id: client.id },
      data: {
        age: 28,
        height: 165.0, // cm
        currentWeight: 48.0, // kg
        activityLevel: 'LOW', // Beginner level
        goals: JSON.stringify(['lean-build', 'ab-lines', 'bikini-confidence']),
        notes:
          'Health: No major conditions, takes vitamins. Feels cold and sometimes dizzy, irregular menstrual cycle, not on birth control. Nutrition: Currently 1.5–2 meals/day, sometimes skips or binges. Loves veggie-based foods and oatmeal. Low budget, needs protein and meal structure. Plan: Focus on three balanced meals/day until Jan 6, no restriction. After Jan 6, add a beginner-friendly gym routine.',
      },
    });

    console.log("✅ Josefine's profile updated successfully!");
    console.log('Updated fields:');
    console.log(`- Age: ${updatedClient.age}`);
    console.log(`- Height: ${updatedClient.height} cm`);
    console.log(`- Current Weight: ${updatedClient.currentWeight} kg`);
    console.log(`- Activity Level: ${updatedClient.activityLevel}`);
    console.log(`- Goals: ${updatedClient.goals}`);
    console.log(`- Notes: ${updatedClient.notes}`);
  } catch (error) {
    console.error("Error updating Josefine's profile:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateJosefineProfile();
