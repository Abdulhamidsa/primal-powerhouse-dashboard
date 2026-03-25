// /api/meals/generate.ts

import { NextResponse } from 'next/server';
import { generateMeals } from '@/lib/meal-generator';

export async function POST(req: Request) {
  const body = await req.json();

  const meals = await generateMeals({
    calories: body.calories,
    protein: body.protein,
    type: body.type, // breakfast/lunch/dinner
  });

  return NextResponse.json(meals);
}
