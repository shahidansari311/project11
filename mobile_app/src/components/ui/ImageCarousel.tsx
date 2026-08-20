import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { PLACEHOLDER_IMAGE } from "../../pages/BrowseProperties/data";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface ImageCarouselProps {
  images: string[];
  width?: number;
  height?: number;
  onPress?: (index: number) => void;
  showThumbnails?: boolean;
  showArrowControls?: boolean;
  sharedTransitionTagBase?: string;
}

export default function ImageCarousel({
  images,
  width = Dimensions.get("window").width,
  height = 280,
  onPress,
  showThumbnails = false,
  showArrowControls = true,
  sharedTransitionTagBase,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const displayImages = images && images.length > 0 ? images : [PLACEHOLDER_IMAGE];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== activeIndex && index >= 0 && index < displayImages.length) {
      setActiveIndex(index);
    }
  };

  const handleArrowPress = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < displayImages.length) {
      scrollViewRef.current?.scrollTo({ x: targetIndex * width, animated: true });
      setActiveIndex(targetIndex);
    }
  };

  const handleThumbnailPress = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveIndex(index);
  };

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={[{ width, height }, styles.mainCarousel]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
        >
          {displayImages.map((img, index) => (
            <Pressable
              key={index}
              style={{ width, height }}
              onPress={() => onPress?.(index)}
              disabled={!onPress}
            >
              <AnimatedImage
                source={{ uri: img }}
                style={{ width, height }}
                contentFit="cover"
                transition={200}
                sharedTransitionTag={
                  sharedTransitionTagBase && activeIndex === index
                    ? `${sharedTransitionTagBase}-${index}`
                    : undefined
                }
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Arrow Controls ── */}
        {showArrowControls && displayImages.length > 1 && (
          <>
            {activeIndex > 0 && (
              <TouchableOpacity
                style={[styles.arrowButton, styles.leftArrow]}
                onPress={() => handleArrowPress(activeIndex - 1)}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
            )}

            {activeIndex < displayImages.length - 1 && (
              <TouchableOpacity
                style={[styles.arrowButton, styles.rightArrow]}
                onPress={() => handleArrowPress(activeIndex + 1)}
                activeOpacity={0.8}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-forward" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── Pagination Dots Indicator ── */}
        {displayImages.length > 1 && (
          <View style={styles.paginationContainer} pointerEvents="none">
            {displayImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Thumbnails */}
      {showThumbnails && displayImages.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailsContainer}
        >
          {displayImages.map((img, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => handleThumbnailPress(index)}
              style={[
                styles.thumbnailWrapper,
                activeIndex === index && styles.thumbnailActive,
              ]}
            >
              <Image source={{ uri: img }} style={styles.thumbnailImage} contentFit="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
  },
  mainCarousel: {
    position: "relative",
    backgroundColor: Colors.surfaceContainerHigh,
  },
  arrowButton: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  leftArrow: {
    left: 14,
  },
  rightArrow: {
    right: 14,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 42,
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 25,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 16,
    backgroundColor: "#ffffff",
  },
  inactiveDot: {
    width: 6,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  thumbnailsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  thumbnailWrapper: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailActive: {
    borderColor: Colors.primary,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
});
