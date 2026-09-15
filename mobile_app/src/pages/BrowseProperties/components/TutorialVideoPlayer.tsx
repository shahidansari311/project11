import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Animated as RNAnimated } from 'react-native';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useFocusEffect } from 'expo-router';

interface TutorialVideoPlayerProps {
  url: string;
  isRefreshing?: boolean;
}

export default function TutorialVideoPlayer({ url, isRefreshing }: TutorialVideoPlayerProps) {
  const webViewRef = useRef<WebView>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false); // Defer webview load
  
  // Scrubber state
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubberWidth, setScrubberWidth] = useState(0);
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  // Extract video ID safely
  const videoId = useMemo(() => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url.split('/embed/')[1].split('?')[0];
    if (url.includes('watch?v=')) return url.split('watch?v=')[1].split('&')[0];
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split('?')[0];
    return '';
  }, [url]);

  useEffect(() => {
    RNAnimated.timing(fadeAnim, {
      toValue: playing ? 0 : 1,
      duration: playing ? 2500 : 300,
      useNativeDriver: true,
    }).start();
  }, [playing, fadeAnim]);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body { margin: 0; padding: 0; background-color: #000; overflow: hidden; }
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
        <script src="https://www.youtube.com/iframe_api"></script>
        <script>
          var player;
          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              height: '100%',
              width: '100%',
              videoId: '${videoId}',
              playerVars: {
                'autoplay': 0,
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
                'onError': function(event) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', code: event.data }));
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
        // Play automatically once player is ready (since it was deferred)
        webViewRef.current?.injectJavaScript(`if(player && player.playVideo) player.playVideo(); true;`);
      } else if (msg === 'playing') {
        setPlaying(true);
        setIsLoading(false);
        if (!hasStarted) setHasStarted(true);
      } else if (msg === 'paused' || msg === 'ended') {
        setPlaying(false);
      } else {
        const data = JSON.parse(msg);
        if (data.type === 'progress') {
          setProgress(data.time);
          setDuration(data.duration);
        } else if (data.type === 'error') {
          console.error('YouTube Player Error:', data.code);
          setIsLoading(false);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // Pause video when screen loses focus (e.g., navigating away)
  useFocusEffect(
    useCallback(() => {
      // Focused
      return () => {
        // Blurred
        if (playing) {
          setPlaying(false);
          webViewRef.current?.injectJavaScript(`if(player && player.pauseVideo) player.pauseVideo(); true;`);
        }
      };
    }, [playing])
  );

  // Pause video when parent passes isRefreshing = true
  useEffect(() => {
    if (isRefreshing && playing) {
      setPlaying(false);
      webViewRef.current?.injectJavaScript(`if(player && player.pauseVideo) player.pauseVideo(); true;`);
    }
  }, [isRefreshing, playing]);

  const togglePlay = () => {
    if (!loadVideo) {
      setLoadVideo(true);
      setIsLoading(true);
      return;
    }

    if (!playing) {
      setIsLoading(true);
      webViewRef.current?.injectJavaScript(`if(player && player.playVideo) player.playVideo(); true;`);
    } else {
      setPlaying(false);
      webViewRef.current?.injectJavaScript(`if(player && player.pauseVideo) player.pauseVideo(); true;`);
    }
  };

  if (!videoId) return null;

  return (
    <View style={styles.container}>
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
            {isLoading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Ionicons name="play" size={32} color="#fff" style={{ marginLeft: 4 }} />
            )}
          </View>
        </Pressable>
      )}

      {loadVideo && (
        <View pointerEvents="none" style={{ flex: 1, backgroundColor: '#000' }}>
          <WebView
            ref={webViewRef}
            source={{ html, baseUrl: 'https://silverrealestate.com/' }}
            style={{ flex: 1, backgroundColor: '#000' }}
            scrollEnabled={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            originWhitelist={["*"]}
            onMessage={handleMessage}
          />
        </View>
      )}

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
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  centerPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
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
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#FF0000',
  }
});
