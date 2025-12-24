
import {NextRequest, NextResponse} from 'next/server';
import {adminAuth, adminDb} from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const {name, email, password} = await request.json();

    // Server-side check against non-public env variable
    if (email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        {error: 'This email address is not authorized for admin registration.'},
        {status: 403} // 403 Forbidden
      );
    }
    
    // Check if an admin with this email already exists
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json(
        {error: 'An admin account with this email already exists.'},
        {status: 409} // 409 Conflict
      );
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error; // Re-throw unexpected errors
      }
      // This is the expected case: the user does not exist yet.
    }

    // Create user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true, // Admins are trusted
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
    const message = error.message || 'Failed to create admin account.';
    return NextResponse.json({error: message}, {status: 500});
  }
}
