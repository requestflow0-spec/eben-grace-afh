import {NextRequest, NextResponse} from 'next/server';
import {adminAuth, adminDb} from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const {name, email, password} = await request.json();

    // Server-side check against the private environment variable
    if (email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        {error: 'This form is for admin registration only.'},
        {status: 403}
      );
    }

    // Check if the admin user already exists
    try {
        await adminAuth.getUserByEmail(email);
        return NextResponse.json(
            { error: 'An admin account with this email already exists.' },
            { status: 409 }
        );
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            throw error; // Re-throw unexpected errors
        }
        // If user is not found, proceed with creation
    }


    // Create user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true,
    });

    // Set a custom claim to identify the user as an admin
    await adminAuth.setCustomUserClaims(userRecord.uid, {admin: true});

    // Create the user's profile in Firestore with the 'admin' role
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      displayName: name,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({success: true, uid: userRecord.uid});
  } catch (error: any) {
    console.error('Admin signup error:', error);
    return NextResponse.json(
      {error: error.message || 'Failed to create admin account'},
      {status: 500}
    );
  }
}
