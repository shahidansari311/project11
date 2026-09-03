import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  TouchableOpacity,
  Animated as RNAnimated,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { PLACEHOLDER_IMAGE } from "../../pages/BrowseProperties/data";
import { WebView } from "react-native-webview";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface ImageCarouselProps {
  images: string[];
  width?: number;
  height?: number;
  onPress?: (index: number) => void;
  showThumbnails?: boolean;
  showArrowControls?: boolean;
  sharedTransitionTagBase?: string;
  youtubeVideoUrl?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function ImageCarousel({
  images,
  width = Dimensions.get("window").width,
  height = 280,
  onPress,
  showThumbnails = false,
  showArrowControls = true,
  sharedTransitionTagBase,
  youtubeVideoUrl,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const displayImages = images && images.length > 0 ? images : [PLACEHOLDER_IMAGE];
  const hasVideo = !!youtubeVideoUrl;
  // Total slides = images + (1 video slide if present)
  const totalSlides = displayImages.length + (hasVideo ? 1 : 0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== activeIndex && index >= 0 && index < totalSlides) {
      setActiveIndex(index);
    }
  };

  const handleArrowPress = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < totalSlides) {
      scrollViewRef.current?.scrollTo({ x: targetIndex * width, animated: true });
      setActiveIndex(targetIndex);
    }
  };

  const handleThumbnailPress = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setActiveIndex(index);
  };

  // Check if current slide is the video slide
  const isVideoSlide = hasVideo && activeIndex === displayImages.length;

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

          {/* ── YouTube Video Slide (last slide) ── */}
          {hasVideo && (
            <YouTubeSlide
              url={youtubeVideoUrl!}
              width={width}
              height={height}
              isActive={isVideoSlide}
            />
          )}
        </ScrollView>

        {/* ── Arrow Controls ── */}
        {showArrowControls && totalSlides > 1 && (
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

            {activeIndex < totalSlides - 1 && (
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
        {totalSlides > 1 && (
          <View style={styles.paginationContainer} pointerEvents="none">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index ? styles.activeDot : styles.inactiveDot,
                  // Make the video dot a different color
                  hasVideo && index === totalSlides - 1 && activeIndex !== index
                    ? styles.videoDot
                    : null,
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

/**
 * Embedded YouTube player — only play/pause, no other controls.
 * Uses an iframe embed with minimal YouTube parameters.
 */
function YouTubeSlide({
  url,
  width,
  height,
  isActive,
}: {
  url: string;
  width: number;
  height: number;
  isActive: boolean;
}) {
  const videoId = extractYouTubeId(url);
  const webViewRef = useRef<WebView>(null);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubberWidth, setScrubberWidth] = useState(0);
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.timing(fadeAnim, {
      toValue: playing ? 0 : 1,
      duration: playing ? 2500 : 300,
      useNativeDriver: true,
    }).start();
  }, [playing]);

  // Auto-pause when user scrolls away from this slide
  useEffect(() => {
    if (!isActive && playing) {
      setPlaying(false);
      webViewRef.current?.injectJavaScript(`if(player && player.pauseVideo) player.pauseVideo(); true;`);
    }
  }, [isActive]);

  if (!videoId) {
    return (
      <View style={[{ width, height }, styles.videoSlideContainer]}>
        <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.5)" />
      </View>
    );
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://www.youtube.com/iframe_api"></script>
        <style>
          body, html { 
            margin: 0; 
            padding: 0; 
            background-color: #000; 
            width: 100%; 
            height: 100%; 
            overflow: hidden; 
          }
          #player-wrapper {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(1.45);
            width: 100vw;
            height: 100vh;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div id="player-wrapper">
          <div id="player"></div>
        </div>
        <script>
          var player;
          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              height: '100%',
              width: '100%',
              videoId: '${videoId}',
              playerVars: {
                'playsinline': 1,
                'controls': 0,
                'rel': 0,
                'modestbranding': 1,
                'iv_load_policy': 3,
                'fs': 0,
                'disablekb': 1,
                'origin': 'https://silverrealestate.com'
              },
              events: {
                'onReady': function(event) {
                  setInterval(function() {
                    if (player && player.getPlayerState() === YT.PlayerState.PLAYING) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'progress',
                        time: player.getCurrentTime(),
                        duration: player.getDuration()
                      }));
                    }
                  }, 500);
                },
                'onStateChange': function(event) {
                  if (event.data === YT.PlayerState.PLAYING) {
                    window.ReactNativeWebView.postMessage('playing');
                  } else if (event.data === YT.PlayerState.PAUSED) {
                    window.ReactNativeWebView.postMessage('paused');
                  } else if (event.data === YT.PlayerState.ENDED) {
                    player.seekTo(0);
                    player.pauseVideo();
                    window.ReactNativeWebView.postMessage('ended');
                  }
                }
              }
            });
          }
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const msg = event.nativeEvent.data;
      if (msg === 'playing') {
        setPlaying(true);
        if (!hasStarted) setHasStarted(true);
      }
      else if (msg === 'paused' || msg === 'ended') setPlaying(false);
      else {
        const data = JSON.parse(msg);
        if (data.type === 'progress') {
          setProgress(data.time);
          setDuration(data.duration);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const togglePlay = () => {
    const newState = !playing;
    setPlaying(newState);
    const js = newState 
      ? `if(player && player.playVideo) player.playVideo(); true;`
      : `if(player && player.pauseVideo) player.pauseVideo(); true;`;
    webViewRef.current?.injectJavaScript(js);
  };

  return (
    <View style={[{ width, height }, styles.videoSlideContainer]}>
      {/* Thumbnail cover perfectly hides the giant red YouTube play button before playback */}
      {!hasStarted && (
        <Pressable 
          style={[StyleSheet.absoluteFill, { zIndex: 10, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}
          onPress={togglePlay}
        >
          <Image 
            source={{ uri: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }} 
            style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.45 }] }]} 
            contentFit="cover"
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
          <View style={styles.centerPlayButton}>
            <Ionicons name="play" size={32} color="#fff" style={{ marginLeft: 4 }} />
          </View>
        </Pressable>
      )}

      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: 'https://silverrealestate.com/' }}
        style={{ width, height, backgroundColor: '#000' }}
        scrollEnabled={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        originWhitelist={["*"]}
        onMessage={handleMessage}
      />

      {/* Invisible overlay to toggle play/pause by tapping the video */}
      {hasStarted && (
        <Pressable 
          style={[StyleSheet.absoluteFill, { zIndex: 20 }]} 
          onPress={togglePlay}
        />
      )}

      {/* Unified Bottom Control Bar (Fades out when playing) */}
      {hasStarted && (
        <RNAnimated.View 
          style={[styles.controlBar, { opacity: fadeAnim }]}
          pointerEvents={playing ? "none" : "auto"}
        >
          <Pressable onPress={togglePlay} style={styles.playPauseBtn} hitSlop={10}>
            <Ionicons name={playing ? "pause" : "play"} size={22} color="#fff" />
          </Pressable>

          <Pressable 
            style={styles.scrubberHitArea}
            onLayout={(e) => setScrubberWidth(e.nativeEvent.layout.width)}
            onPress={(e) => {
              if (duration === 0 || scrubberWidth === 0) return;
              const { locationX } = e.nativeEvent;
              const percent = Math.max(0, Math.min(1, locationX / scrubberWidth));
              const seekTime = percent * duration;
              webViewRef.current?.injectJavaScript(`if(player) player.seekTo(${seekTime}, true); true;`);
              setProgress(seekTime);
            }}
          >
            <View style={styles.scrubberTrack}>
              <View style={[styles.scrubberFill, { width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }]} />
            </View>
          </Pressable>
        </RNAnimated.View>
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
  videoDot: {
    backgroundColor: "#FF0000",
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
  // ── Video Slide Styles ──
  videoSlideContainer: {
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  videoBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    padding: 6,
    zIndex: 10,
  },
  centerPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  controlBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 25,
  },
  playPauseBtn: {
    marginRight: 16,
  },
  scrubberHitArea: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});
