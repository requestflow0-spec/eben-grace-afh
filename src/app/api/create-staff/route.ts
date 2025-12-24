
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the requesting user is an admin by checking their Firestore document
    const authorization = (await (headers())).get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const adminUserDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!adminUserDoc.exists || adminUserDoc.data()?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can create staff.' }, { status: 403 });
    }

    // 2. Get new staff details from request body
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and password.' },
        { status: 400 }
      );
    }

    // 3. Create the user with Firebase Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true, // Or send a verification email
    });
    
    // 4. Create a user profile in the 'users' collection with the 'staff' role
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      email,
      displayName: name,
      role: 'staff',
      createdAt: new Date(),
    });

    // 5. Create a corresponding profile in the 'staff' collection
    const staffDocRef = adminDb.collection('staff').doc(userRecord.uid);
    await staffDocRef.set({
      id: userRecord.uid,
      name,
      email,
      phone: phone || '',
      role: 'Staff', // Role within the context of the staff collection
      certifications: ['Basic Care'],
      schedule: 'Mon-Fri, 9am-5pm',
      available: true,
      avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/200/200`,
      avatarHint: 'person professional',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedPatients: [],
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });

  } catch (error: any) {
    console.error('Create staff error:', error);
    let errorMessage = 'Failed to create staff account.';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'A user with this email address already exists.';
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
