
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if the email matches the designated admin email from environment variables
    if (process.env.ADMIN_EMAIL && email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'This email is not authorized to be an administrator.' }, { status: 403 });
    }
    
    // Check if an admin already exists.
    const adminQuery = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();

    if (!adminQuery.empty) {
        // If an admin exists, check if it's the same user trying to sign up again.
        const existingAdmin = adminQuery.docs[0];
        const existingAdminData = existingAdmin.data();
        if (existingAdminData.email !== email) {
            return NextResponse.json({ error: 'An administrator account already exists.' }, { status: 409 });
        }
    }


    // 1. Create the user with Firebase Admin SDK (or get if exists)
    let userRecord;
    try {
        userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true,
        });
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            userRecord = await adminAuth.getUserByEmail(email);
        } else {
            throw error; // Re-throw other errors
        }
    }


    // 2. Create a corresponding profile in the 'users' collection with the 'admin' role
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      email,
      displayName: name,
      role: 'admin',
      createdAt: new Date(),
    }, { merge: true });

    return NextResponse.json({ success: true, uid: userRecord.uid });

  } catch (error: any)
  {
    console.error('Admin signup error:', error);
     let errorMessage = 'Failed to create admin account.';
    if (error.code === 'auth/email-already-exists') {
        // This case is handled above, but as a fallback.
        errorMessage = 'A user with this email address already exists.';
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
