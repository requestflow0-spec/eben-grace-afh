import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields: name, email, and password.' }, { status: 400 });
    }
     if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // 1. Check for a pending staff invitation for this email
    const staffQuery = adminDb.collection('staff')
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .limit(1);

    const staffSnapshot = await staffQuery.get();

    if (staffSnapshot.empty) {
      return NextResponse.json({ error: 'This email is not registered for staff sign-up. Please contact an administrator.' }, { status: 403 });
    }

    const staffDoc = staffSnapshot.docs[0];

    // 2. Create the user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true, // Assuming verification is handled, or can be set to false.
    });

    const batch = adminDb.batch();

    // 3. Create the user's profile document in 'users'
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    batch.set(userDocRef, {
      email,
      displayName: name,
      role: 'staff',
      createdAt: Timestamp.now(),
    });

    // 4. Update the original staff invitation to 'active'
    batch.update(staffDoc.ref, {
      status: 'active',
      id: userRecord.uid, // Link the staff profile to the auth user
      name: name, // Update name from signup form
      updatedAt: Timestamp.now(),
    });

    await batch.commit();

    return NextResponse.json({ success: true, uid: userRecord.uid });

  } catch (error: any) {
    console.error('Staff signup error:', error);
    let errorMessage = 'Failed to create staff account.';
    let statusCode = 500;

    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'A user with this email address already exists.';
      statusCode = 409; // Conflict
    } else if (error.code === 'auth/invalid-password') {
      errorMessage = error.message;
       statusCode = 400;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
