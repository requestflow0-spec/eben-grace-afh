import {NextRequest, NextResponse} from 'next/server';
import {adminAuth, adminDb} from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const {name, email, password} = await request.json();

    // Check if a user with this email already exists
    try {
      await adminAuth.getUserByEmail(email);
      // If the above line doesn't throw, the user exists.
      return NextResponse.json(
        {error: 'An account with this email already exists.'},
        {status: 409} // 409 Conflict
      );
    } catch (error: any) {
      // "auth/user-not-found" is the expected error if the user doesn't exist.
      // Any other error should be re-thrown.
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true, // Assuming admin emails are trusted
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
    // Avoid sending detailed internal error messages to the client
    const message =
      error.code === 'auth/email-already-exists'
        ? 'An account with this email already exists.'
        : 'Failed to create admin account.';
    const status = error.code === 'auth/email-already-exists' ? 409 : 500;

    return NextResponse.json({error: message}, {status});
  }
}
