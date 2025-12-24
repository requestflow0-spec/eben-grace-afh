
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
    // This is a simple check; more robust multi-tenant apps would handle this differently.
    const users = await adminAuth.listUsers();
    const adminExists = users.users.some(u => u.customClaims?.admin);

    if (adminExists) {
        // Find if the existing admin is the one trying to sign up again
        const existingUser = await adminAuth.getUserByEmail(email).catch(() => null);
        if (!existingUser || !existingUser.customClaims?.admin) {
             return NextResponse.json({ error: 'An administrator account already exists.' }, { status: 409 });
        }
    }

    // 1. Create the user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true, 
    });

    // 2. Set a custom claim to identify the user as an admin
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    // 3. Create a corresponding profile in the 'users' collection for consistency
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      email,
      displayName: name,
      role: 'admin', // Storing role in Firestore doc as well for easy querying/display
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });

  } catch (error: any) {
    console.error('Admin signup error:', error);
     let errorMessage = 'Failed to create admin account.';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'A user with this email address already exists.';
    } else if (error.code === 'auth/invalid-password') {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
