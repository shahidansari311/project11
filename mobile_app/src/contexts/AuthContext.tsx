import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { authService, UserProfile } from "../services/auth.service";
import { registerForPushNotificationsAsync, sendPushTokenToBackend } from "../services/push.service";

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

      const res = await authService.getProfile();
      if (res && res.data) {
        setUserProfile(res.data);
        setIsGuest(false);

        // Register push token and send to backend
        // (Commented out temporarily because rebuilding the app is required to use Firebase on Android)
        /*
        registerForPushNotificationsAsync().then((pushToken) => {
          if (pushToken) {
            sendPushTokenToBackend(pushToken);
          }
        });
        */

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
