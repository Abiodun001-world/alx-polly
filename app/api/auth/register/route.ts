import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // TODO: Implement actual registration logic
    console.log('Registration attempt:', { name, email, password });

    // Mock response
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: '1',
        name,
        email
      }
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 400 }
    );
  }
}
