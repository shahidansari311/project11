import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { authService, UserProfile } from "../services/auth.service";

interface AuthContextType {
  isGuest: boolean;
  userProfile: UserProfile | null;
  isLoading: boolean;
  refreshAuth: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType>({
  isGuest: true,
  userProfile: null,
  isLoading: true,
  refreshAuth: async () => null,
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
        return null;
      }
      setIsGuest(false);

      const res = await authService.getProfile();
      if (res && res.data) {
        setUserProfile(res.data);
        
        // Register for push notifications and send token to backend
        // try {
        //   const { registerForPushNotificationsAsync, sendPushTokenToBackend } = require('../services/push.service');
        //   const token = await registerForPushNotificationsAsync();
        //   if (token) {
        //     await sendPushTokenToBackend(token);
        //   }
        // } catch (pushErr) {
        //   console.log('Push notification registration failed', pushErr);
        // }

        return res.data;
      }
      return null;
    } catch (e) {
      setIsGuest(true);
      setUserProfile(null);
      return null;
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
