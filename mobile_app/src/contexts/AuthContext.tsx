import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { authService, UserProfile } from "../services/auth.service";

interface AuthContextType {
  isGuest: boolean;
  userProfile: UserProfile | null;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isGuest: true,
  userProfile: null,
  isLoading: true,
  refreshAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGuest, setIsGuest] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("refresh_token");
      if (!token) {
        setIsGuest(true);
        setUserProfile(null);
        return;
      }
      setIsGuest(false);

      const res = await authService.getProfile();
      if (res && res.data) {
        setUserProfile(res.data);
      }
    } catch (e) {
      setIsGuest(true);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ isGuest, userProfile, isLoading, refreshAuth: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
