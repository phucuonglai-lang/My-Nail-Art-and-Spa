import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); // Ensure loading is true when state changes
      try {
        console.log("Auth State Changed:", firebaseUser?.email);
        setUser(firebaseUser);
        
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userDoc;
          try {
            userDoc = await getDoc(userDocRef);
          } catch (e) {
            console.error("Error fetching user profile:", e);
            // If we can't read the profile, it might be a rules issue or network issue
            // We'll still allow the user to be "logged in" at the auth level
          }

          const isAdminEmail = firebaseUser.email?.toLowerCase() === 'phucuonglai@gmail.com';

          if (userDoc && userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            // Auto-upgrade existing student to admin if they match the admin email
            if (isAdminEmail && data.role !== 'admin') {
              const updatedProfile = { ...data, role: 'admin' as const };
              try {
                await setDoc(doc(db, 'users', firebaseUser.uid), updatedProfile);
                setProfile(updatedProfile);
              } catch (e) {
                console.error("Error upgrading to admin:", e);
                setProfile(data); // Revert to existing data if update fails
              }
            } else {
              setProfile(data);
            }
          } else {
            // Initialize profile if not exists
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Học viên',
              role: isAdminEmail ? 'admin' : 'student',
              enrolledCourses: [],
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
              setProfile(newProfile);
            } catch (e) {
              console.error("Error creating user profile:", e);
              // If profile creation fails, we might still want to let them see the UI
              setProfile(newProfile); 
            }
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Global Auth Profile Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
