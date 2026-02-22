import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';

type Exercise = {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
};

const filePath = path.join(process.cwd(), 'data', 'exercises.json');
const exercises = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Exercise[];

function withImageUrls(e: Exercise) {
  return {
    ...e,
    images: (e.images ?? []).map(img => `/exercises/${img}`),
  };
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    total: exercises.length,
    data: exercises.map(withImageUrls),
  });
}
