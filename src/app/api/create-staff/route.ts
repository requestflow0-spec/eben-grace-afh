'use server';

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// Helper to check if the request is from an authenticated admin
async function isAdmin(request: NextRequest): Promise<boolean> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        return userDoc.exists && userDoc.data()?.role === 'admin';
    } catch (error) {
        console.error("Admin verification error:", error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    if (!await isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized: Only admins can create staff.' }, { status: 403 });
    }

    try {
        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields: name, email, and password.' }, { status: 400 });
        }

        // 1. Create the user in Firebase Authentication
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true, // Assuming admin-created users are trusted
        });

        const uid = userRecord.uid;
        const batch = adminDb.batch();

        // 2. Create the user's role document in the `/users` collection
        const userDocRef = adminDb.collection('users').doc(uid);
        batch.set(userDocRef, {
            email,
            displayName: name,
            role: 'staff',
            createdAt: new Date(),
        });

        // 3. Create the staff profile in the `/staff` collection
        const staffDocRef = adminDb.collection('staff').doc(uid);
        batch.set(staffDocRef, {
            id: uid,
            name: name,
            email: email,
            phone: '', // Can be updated later
            role: 'Staff',
            schedule: 'Not Set',
            certifications: [],
            status: 'active', // Active immediately
            available: true,
            avatarUrl: `https://picsum.photos/seed/${email}/200/200`,
            avatarHint: 'person professional',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Commit the batch write
        await batch.commit();

        return NextResponse.json({ success: true, uid: userRecord.uid });

    } catch (error: any) {
        console.error('Create staff error:', error);
        let errorMessage = 'Failed to create staff account.';
        if (error.code === 'auth/email-already-exists') {
            errorMessage = 'A user with this email address already exists.';
        } else if (error.code === 'auth/invalid-password') {
            errorMessage = 'Password must be at least 6 characters long.';
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
