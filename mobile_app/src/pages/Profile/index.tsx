import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/constants/colors";
import api from "@/utils/api";
import { useToast } from "@/components/Toast";
import { authService, UserProfile } from "../../services/auth.service";
import { useAuth } from "../../contexts/AuthContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useFocusEffect } from "expo-router";
import Skeleton from "@/components/ui/Skeleton";

export default function ProfilePage() {
  const router = useRouter();
  const { isGuest, userProfile, isLoading, refreshAuth } = useAuth();
  const [docStatus, setDocStatus] = useState<"PENDING" | "ACTION_REQUIRED" | "VERIFIED" | "INCOMPLETE">("INCOMPLETE");
  const { clearFavorites } = useFavorites();
  const { showToast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // We only need to fetch documents here now, profile is global
      const fetchDocs = async () => {
        try {
          const docRes = await api.get("/user/document").catch(() => null);
          if (docRes && docRes.data?.data) {
            const docs = docRes.data.data;
            const pan = docs.find((d: any) => d.documentType === "PAN");
            const aadhar = docs.find((d: any) => d.documentType === "AADHAAR");
            
            if (!pan || !aadhar) {
              setDocStatus("INCOMPLETE");
            } else {
              const statuses = [pan.status, aadhar.status];
              if (statuses.some(s => s === "REJECTED" || s === "REUPLOAD_REQUIRED")) {
                setDocStatus("ACTION_REQUIRED");
              } else if (statuses.every(s => s === "APPROVED")) {
                setDocStatus("VERIFIED");
              } else {
                setDocStatus("PENDING");
              }
            }
          }
        } catch (e) {
          // Silent fallback for non-critical doc status fetch
        }
      };
      
      if (!isGuest) {
        fetchDocs();
      }
    }, [isGuest])
  );

  const handleLogout = useCallback(async () => {
    await SecureStore.deleteItemAsync("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    clearFavorites();
    await refreshAuth();
    router.replace("/");
  }, [router, clearFavorites, refreshAuth]);

  const handleUpdateProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showToast("Permission to access gallery is required!", "error");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (pickerResult.canceled) {
        return;
      }

      const asset = pickerResult.assets[0];

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        showToast("Image size exceeds 5MB limit. Please choose a smaller image.", "error");
        return;
      }

      setIsUploadingImage(true);

      const formData = new FormData();

      const filename = asset.uri.split('/').pop() || 'profile.jpg';
      let type = asset.mimeType;
      if (!type) {
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpeg';
        type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      }

      formData.append("profileImage", {
        uri: asset.uri,
        name: filename,
        type,
      } as any);

      await api.post("/auth/user/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshAuth();
      showToast("Profile image updated successfully!", "success");

    } catch (error: any) {
      console.error("Failed to update profile image:", error);
      showToast(error?.response?.data?.message || error.message || "Failed to update profile image", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };
  if (isGuest) {
    return (
      <View style={[styles.root, styles.centerContent]}>
        <View style={styles.guestIconWrapper}>
          <Ionicons name="lock-closed-outline" size={64} color={Colors.primary} />
        </View>
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
            {isLoading ? (
              <Skeleton width={96} height={96} borderRadius={48} />
            ) : userProfile?.profileUrl ? (
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
            
            {isUploadingImage && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 48, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={Colors.onPrimary} />
              </View>
            )}

            {!isLoading && (
              <TouchableOpacity 
                style={styles.editButton} 
                activeOpacity={0.8}
                onPress={handleUpdateProfileImage}
                disabled={isUploadingImage}
              >
                <Ionicons name="pencil" size={12} color={Colors.onPrimaryContainer} />
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={{ alignItems: 'center', gap: 8, marginTop: 0 }}>
              <Skeleton width={150} height={22} borderRadius={4} />
              <Skeleton width={110} height={14} borderRadius={4} />
            </View>
          ) : (
            <>
              <Text style={styles.userName}>{userProfile?.fullName || "Guest"}</Text>
              <Text style={styles.userRole}>Accredited Investor</Text>
            </>
          )}
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
                onPress={() => router.navigate("/(tabs)/portfolio" as any)}
              >
                <View style={styles.listItemLeft}>
                  <Ionicons name="business" size={22} color={Colors.primary} />
                  <Text style={styles.listItemText}>My Properties</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.outlineVariant} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.listItem} 
                activeOpacity={0.7}
                onPress={() => Alert.alert("Coming Soon", "Performance History will be available soon.")}
              >
                <View style={styles.listItemLeft}>
                  <Ionicons name="stats-chart" size={22} color={Colors.primary} />
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
                onPress={() => router.push("/profile/document-upload" as any)}
              >
                <View style={styles.listItemLeft}>
                  <Ionicons
                    name="document-text"
                    size={22}
                    color={Colors.primary}
                  />
                  <Text style={styles.listItemText}>Upload Documents</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {docStatus === "VERIFIED" && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
                  {docStatus === "ACTION_REQUIRED" && <Ionicons name="alert-circle" size={18} color={Colors.error} />}
                  {docStatus === "PENDING" && <Ionicons name="time" size={18} color={Colors.outline} />}
                  <Ionicons name="chevron-forward" size={20} color={Colors.outlineVariant} style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.listItem, styles.listItemBorder]}
                activeOpacity={0.7}
                onPress={() => router.push("/agreement" as any)}
              >
                <View style={styles.listItemLeft}>
                  <Ionicons name="hand-right" size={22} color={Colors.primary} />
                  <Text style={styles.listItemText}>Agreements</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.outlineVariant} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.listItem} 
                activeOpacity={0.7}
                onPress={() => Alert.alert("Coming Soon", "Account Settings will be available soon.")}
              >
                <View style={styles.listItemLeft}>
                  <Ionicons
                    name="settings-sharp"
                    size={22}
                    color={Colors.primary}
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
            <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
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
  guestIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.secondaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.onPrimary,
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
    backgroundColor: Colors.primary,
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
    color: Colors.primary,
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
    borderColor: Colors.primary,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
  },
});
