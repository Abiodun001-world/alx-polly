import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // TODO: Implement actual authentication logic
    console.log('Login attempt:', { email, password });

    // Mock response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: '1',
        email,
        name: 'John Doe'
      }
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 400 }
    );
  }
}
