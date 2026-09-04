import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../data';
import HorizontalPropertyCard from './HorizontalPropertyCard';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
  properties: Property[];
  onRequireLogin: () => void;
}

export default function DashboardHeader({ properties, onRequireLogin }: DashboardHeaderProps) {
  const { userProfile, isGuest } = useAuth();
  const router = useRouter();
  
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  const userName = userProfile?.fullName || 'Investor';

  const popularProperties = useMemo(() => {
    if (!properties || properties.length === 0) return [];
    return [...properties].sort((a, b) => (b.investors || 0) - (a.investors || 0)).slice(0, 5);
  }, [properties]);

  return (
    <View style={styles.container}>
      {/* ── Greeting Section ── */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{greeting},</Text>
        <Text style={styles.nameText}>{userName}</Text>
        <Text style={styles.subText}>Ready to build your wealth today?</Text>
      </View>

      {/* ── Popular Places Section ── */}
      {popularProperties.length > 0 && (
        <View style={styles.popularContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Popular Places</Text>
            <TouchableOpacity onPress={() => router.navigate("/(tabs)/explore" as any)}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularScrollContent}
            decelerationRate="fast"
            snapToInterval={Math.round(require('react-native').Dimensions.get('window').width * 0.65) + 16}
          >
            {popularProperties.map((prop) => (
              <HorizontalPropertyCard 
                key={prop.id} 
                property={prop} 
                isGuest={isGuest} 
                onRequireLogin={onRequireLogin} 
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Company Trust Section ── */}
      <View style={styles.companyContainer}>
        <Text style={styles.companyTitle}>Why Silver Real Estate?</Text>
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconWrap}>
              <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.featureText}>10+ Years{"\n"}of Trust</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIconWrap}>
              <Ionicons name="diamond" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.featureText}>Curated{"\n"}Premium Assets</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIconWrap}>
              <Ionicons name="trending-up" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.featureText}>Transparent{"\n"}Returns</Text>
          </View>
        </View>
      </View>

      {/* ── User Review Section ── */}
      <View style={styles.reviewContainer}>
        <View style={styles.starsRow}>
          {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={16} color="#C99A3A" style={{ marginHorizontal: 1 }} />)}
        </View>
        <Text style={styles.reviewText}>
          "Silver Real Estate made commercial investing accessible and stress-free. Highly recommended."
        </Text>
        <Text style={styles.reviewAuthor}>- A. Sharma, Verified Investor</Text>
      </View>

      {/* ── Explore All Button ── */}
      <TouchableOpacity 
        style={styles.exploreAllBtn} 
        activeOpacity={0.8}
        onPress={() => router.navigate("/(tabs)/explore" as any)}
      >
        <Text style={styles.exploreAllBtnText}>Explore All Properties</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  
  /* Greeting */
  greetingContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  greetingText: {
    fontSize: 16,
    color: Colors.outline,
    fontWeight: "500",
  },
  nameText: {
    fontSize: 28,
    color: Colors.onSurface,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
    marginTop: 6,
  },

  /* Popular Places Section */
  popularContainer: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.outline,
  },
  popularScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24, // extra space for the floating bookmark button
  },

  /* Company Trust Section */
  companyContainer: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  companyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  featureItem: {
    flex: 1,
    alignItems: "center",
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  featureText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },

  /* Review Section */
  reviewContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: "500",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.outline,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* Explore All Button */
  exploreAllBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreAllBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
