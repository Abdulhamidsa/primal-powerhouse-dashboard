const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testPrisma() {
  console.log("Available Prisma client methods:");
  console.log(Object.getOwnPropertyNames(prisma).filter((prop) => typeof prisma[prop] === "object" && prisma[prop] !== null));

  try {
    // Test if mealPlan exists
    const result = await prisma.mealPlan.findMany();
    console.log("mealPlan works:", result.length);
  } catch (error) {
    console.log("mealPlan error:", error.message);

    // Try meal_plan instead
    try {
      const result2 = await prisma.meal_plan.findMany();
      console.log("meal_plan works:", result2.length);
    } catch (error2) {
      console.log("meal_plan error:", error2.message);
    }
  }

  await prisma.$disconnect();
}

testPrisma().catch(console.error);
