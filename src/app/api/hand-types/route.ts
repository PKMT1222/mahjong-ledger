import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { HAND_TYPES, GameVariant } from '@/types';

// GET /api/hand-types?variant=taiwan
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const variant = searchParams.get('variant') as GameVariant || 'taiwan';
    
    const handTypes = HAND_TYPES[variant] || HAND_TYPES.taiwan;
    
    return NextResponse.json(handTypes);
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
