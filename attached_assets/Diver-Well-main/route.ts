import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Signup endpoint - database not configured yet' },
    { status: 200 }
  );
}
