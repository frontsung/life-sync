import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value || '';

  try {
    // Optionally revoke the session ID from Firebase
    // If the token was verified in middleware, we could get the uid from there
    // For simplicity here, we just clear the cookie on the client side

    const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
    response.cookies.set('__session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return response;
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.json({ success: false, message: 'Error signing out' }, { status: 500 });
  }
}
