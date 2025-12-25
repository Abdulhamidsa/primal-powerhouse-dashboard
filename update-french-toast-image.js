const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAnabolicFrenchToastImage() {
  try {
    // Find the anabolic french toast meal
    const meal = await prisma.meal.findFirst({
      where: { name: 'Anabolic French Toast' },
      orderBy: { createdAt: 'desc' },
    });

    if (!meal) {
      console.error('Anabolic French Toast meal not found');
      return;
    }

    // Update the meal with the image URL
    const updatedMeal = await prisma.meal.update({
      where: { id: meal.id },
      data: {
        imageUrl: '/toast.png',
      },
    });

    console.log('✅ Successfully updated Anabolic French Toast with image!');
    console.log('Meal ID:', updatedMeal.id);
    console.log('Image URL:', updatedMeal.imageUrl);
    console.log('Meal Name:', updatedMeal.name);
  } catch (error) {
    console.error('❌ Error updating meal image:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAnabolicFrenchToastImage();
