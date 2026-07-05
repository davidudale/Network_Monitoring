"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { auth } from "./firebase";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authMessage, setAuthMessage] = useState("Checking authentication...");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAuthMessage(
        "Authentication is taking longer than expected. Check your network and Firebase Auth settings.",
      );
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeoutId);
      setUser(currentUser);
      setIsCheckingAuth(false);

      if (!currentUser) {
        router.replace("/login");
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [router]);

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <p className="text-sm font-medium text-slate-600">
          {authMessage}
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}
