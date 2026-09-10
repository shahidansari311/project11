import { useState, useRef, useEffect, useMemo } from "react";
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
  paginationBottomOffset?: number;
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
  paginationBottomOffset = 16,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const normalizedImages = Array.isArray(images) ? images : (typeof images === 'string' ? [images] : []);
  const displayImages = normalizedImages.length > 0 ? normalizedImages : [PLACEHOLDER_IMAGE];
  // Memoize image sources to prevent expo-image from re-triggering transition={200} on re-renders
  const imageSources = useMemo(() => displayImages.map(img => (typeof img === 'string' ? { uri: img } : img)), [JSON.stringify(displayImages)]);
  const hasVideo = !!youtubeVideoUrl;
  // Total slides = images + (1 video slide if present)
  const totalSlides = displayImages.length + (hasVideo ? 1 : 0);

  const isAutoScrolling = useRef(false);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isAutoScrolling.current) return;
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    if (index !== activeIndex && index >= 0 && index < totalSlides) {
      setActiveIndex(index);
    }
  };

  const handleArrowPress = (targetIndex: number) => {
    if (targetIndex >= 0 && targetIndex < totalSlides) {
      isAutoScrolling.current = true;
      setActiveIndex(targetIndex);
      scrollViewRef.current?.scrollTo({ x: targetIndex * width, animated: true });
      setTimeout(() => { isAutoScrolling.current = false; }, 400);
    }
  };

  const handleThumbnailPress = (index: number) => {
    isAutoScrolling.current = true;
    setActiveIndex(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setTimeout(() => { isAutoScrolling.current = false; }, 400);
  };

  // Check if current slide is the video slide
  const isVideoSlide = hasVideo && activeIndex === 0;

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
          {/* ── YouTube Video Slide (first slide) ── */}
          {hasVideo && (
            <YouTubeSlide
              url={youtubeVideoUrl!}
              width={width}
              height={height}
              isActive={isVideoSlide}
            />
          )}

          {displayImages.map((img, index) => (
            <Pressable
              key={`img-${index}`}
              style={{ width, height }}
              onPress={() => onPress?.(index)}
              disabled={!onPress}
            >
              <AnimatedImage
                source={imageSources[index]}
                style={{ width, height }}
                contentFit="cover"
                transition={200}
                sharedTransitionTag={
                  sharedTransitionTagBase && index === 0
                    ? sharedTransitionTagBase
                    : undefined
                }
              />
            </Pressable>
          ))}
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
          <View style={[styles.paginationWrapper, { bottom: paginationBottomOffset }]} pointerEvents="none">
            <View style={styles.paginationContainer}>
              {Array.from({ length: totalSlides }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activeIndex === index ? styles.activeDot : styles.inactiveDot,
                    // Make the video dot a different color
                    hasVideo && index === 0 && activeIndex !== index
                      ? styles.videoDot
                      : null,
                  ]}
                />
              ))}
            </View>
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
          {displayImages.map((img, index) => {
            const slideIndex = hasVideo ? index + 1 : index;
            return (
              <TouchableOpacity
                key={`thumb-${index}`}
                activeOpacity={0.8}
                onPress={() => handleThumbnailPress(slideIndex)}
                style={[
                  styles.thumbnailWrapper,
                  activeIndex === slideIndex && styles.thumbnailActive,
                ]}
              >
                <Image source={imageSources[index]} style={styles.thumbnailImage} contentFit="cover" />
              </TouchableOpacity>
            );
          })}
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
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.timing(fadeAnim, {
      toValue: playing ? 0 : 1,
      duration: playing ? 2500 : 300,
      useNativeDriver: true,
    }).start();
  }, [playing]);

  // Auto-play/pause when user scrolls to/from this slide or when player becomes ready
  useEffect(() => {
    if (!isPlayerReady) return;
    if (isActive) {
      setPlaying(true);
      webViewRef.current?.injectJavaScript(`if(player && player.playVideo) player.playVideo(); true;`);
    } else {
      setPlaying(false);
      webViewRef.current?.injectJavaScript(`if(player && player.pauseVideo) player.pauseVideo(); true;`);
    }
  }, [isActive, isPlayerReady]);

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
            -webkit-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
          }
          #player-wrapper {
            position: absolute;
            top: -50%;
            left: 0;
            width: 100%;
            height: 200%;
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
                'autoplay': ${isActive ? 1 : 0},
                'playsinline': 1,
                'controls': 0,
                'rel': 0,
                'modestbranding': 1,
                'iv_load_policy': 3,
                'fs': 0,
                'disablekb': 1,
                'enablejsapi': 1,
                'origin': 'https://silverrealestate.com'
              },
              events: {
                'onReady': function(event) {
                  window.ReactNativeWebView.postMessage('ready');
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
      if (msg === 'ready') {
        setIsPlayerReady(true);
      }
      else if (msg === 'playing') {
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
      {/* Thumbnail cover perfectly hides the giant red YouTube play button and all paused UI */}
      {!playing && (
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

      <View pointerEvents="none" style={{ width, height, backgroundColor: '#000' }}>
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
      </View>

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
  paginationWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 25,
  },
  paginationContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
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
