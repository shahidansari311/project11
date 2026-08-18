import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/colors";
import { authService, UserProfile } from "../../services/auth.service";
import { useFavorites } from "../../contexts/FavoritesContext";

export default function ProfilePage() {
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { clearFavorites } = useFavorites();

  const checkAuthAndFetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await SecureStore.getItemAsync("refresh_token");
      if (!token) {
        setIsGuest(true);
        setIsLoading(false);
        return;
      }
      setIsGuest(false);
      
      const res = await authService.getProfile();
      if (res && res.data) {
        setUserProfile(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setIsGuest(true); // If fetch fails, fallback to guest/login prompt to be safe
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, [checkAuthAndFetchProfile]);

  const handleLogout = useCallback(async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    clearFavorites();
    router.replace("/");
  }, [router, clearFavorites]);

  if (isLoading) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isGuest) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <Ionicons name="person-circle-outline" size={80} color={Colors.outlineVariant} />
        <Text style={styles.guestTitle}>Login Required</Text>
        <Text style={styles.guestSubtitle}>Please login to view your profile and manage your portfolio.</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/")}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Login to Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Hero / Avatar Section ── */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            {userProfile?.profileUrl ? (
              <Image
                source={{ uri: userProfile.profileUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceContainerHighest }]}>
                <Ionicons name="person" size={48} color={Colors.onSurfaceVariant} />
              </View>
            )}
            <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
              <Ionicons name="pencil" size={12} color={Colors.onPrimaryContainer} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userProfile?.fullName || "Guest"}</Text>
          <Text style={styles.userRole}>Accredited Investor</Text>
        </View>

        {/* ── Content Area ── */}
        <View style={styles.contentArea}>
          {/* Portfolio Management */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Portfolio Management</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.listItem, styles.listItemBorder]}
                activeOpacity={0.7}
              >
                <View style={styles.listItemLeft}>
                  <Ionicons name="business" size={22} color={Colors.primaryContainer} />
                  <Text style={styles.listItemText}>My Properties</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.outlineVariant} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
                <View style={styles.listItemLeft}>
                  <Ionicons name="stats-chart" size={22} color={Colors.primaryContainer} />
                  <Text style={styles.listItemText}>Performance History</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.outlineVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account & Documents */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account & Documents</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.listItem, styles.listItemBorder]}
                activeOpacity={0.7}
              >
                <View style={styles.listItemLeft}>
                  <View style={styles.iconWithBadge}>
                    <Ionicons
                      name="document-text"
                      size={22}
                      color={Colors.primaryContainer}
                    />
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>2</Text>
                    </View>
                  </View>
                  <Text style={styles.listItemText}>Pending Documents</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.outlineVariant} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.listItem, styles.listItemBorder]}
                activeOpacity={0.7}
              >
                <View style={styles.listItemLeft}>
                  <Ionicons name="hand-right" size={22} color={Colors.primaryContainer} />
                  <Text style={styles.listItemText}>Agreements</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.outlineVariant} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
                <View style={styles.listItemLeft}>
                  <Ionicons
                    name="settings-sharp"
                    size={22}
                    color={Colors.primaryContainer}
                  />
                  <Text style={styles.listItemText}>Account Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.outlineVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.primaryContainer} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onPrimaryContainer,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  avatarContainer: {
    position: "relative",
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
    borderWidth: 4,
    borderColor: Colors.surface,
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primaryContainer,
    padding: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.onSurface,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  contentArea: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 24,
  },
  section: {},
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primaryContainer,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0f1e22",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainer,
  },
  listItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  listItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.onSurface,
  },
  iconWithBadge: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: Colors.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: Colors.onError,
    fontSize: 10,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.primaryContainer,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primaryContainer,
  },
});
