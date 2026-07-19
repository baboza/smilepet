"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

interface AuthUser extends User {
  role?: string;
  clinicId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch additional user role from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          let role = "staff";
          let clinicId = "demo-clinic";

          if (userDoc.exists()) {
            const data = userDoc.data();
            role = data.role || "staff";
            clinicId = data.clinicId || "demo-clinic";
          }

          // Force admin role for specific user
          if (firebaseUser.email === "jirawat.s@msu.ac.th") {
            role = "admin";
          }

          // Auto-create document if it doesn't exist
          if (!userDoc.exists()) {
            try {
              const { setDoc } = await import("firebase/firestore");
              await setDoc(doc(db, "users", firebaseUser.uid), {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || "",
                role,
                clinicId,
                createdAt: new Date().toISOString()
              });
            } catch (err) {
              console.error("Failed to auto-create user doc:", err);
            }
          }

          setUser({
            ...firebaseUser,
            role,
            clinicId,
          });
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
