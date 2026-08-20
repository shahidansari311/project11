import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { UserProfile } from "@/services/auth.service";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

interface UserDetailsCardProps {
  user: UserProfile | null;
}

export default function UserDetailsCard({ user }: UserDetailsCardProps) {
  if (!user) return null;

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        {user.profileUrl ? (
          <Image source={{ uri: user.profileUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{user.fullName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{user.fullName}</Text>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color={Colors.onSurfaceVariant} />
            <Text style={styles.contactText}>+91 {user.phone}</Text>
          </View>
          {user.email ? (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color={Colors.onSurfaceVariant} />
              <Text style={styles.contactText}>{user.email}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: Colors.background,
  },
  placeholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.onSurface,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  contactText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginLeft: 6,
  },
});
