import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList, BackHandler, KeyboardAvoidingView, Platform, Keyboard, Modal, Animated } from "react-native";
import { propertyService } from "@/services/property.service";
import { Colors } from "@/constants/colors";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { addPropertySchema } from "@/utils/validationSchemas";
import BouncingDots from "@/components/BouncingDots";

const CATEGORIES = [
  { id: "RESIDENTIAL", label: "Residential" },
  { id: "COMMERCIAL", label: "Commercial" },
  { id: "INDUSTRIAL", label: "Industrial" },
  { id: "LAND", label: "Land/Plot" },
  { id: "VILLA", label: "Villa" },
];

export default function BuilderAddTab() {
  const router = useRouter();
  const params = useLocalSearchParams<{ draftId?: string }>();
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    totalSize: "",
    totalPrice: "",
    targetReturn: "",
    category: "RESIDENTIAL",
    youtubeVideoUrl: "",
    latitude: 28.6139,
    longitude: 77.2090,
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Map Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialCoordsRef = useRef({ latitude: 28.6139, longitude: 77.2090 });
  
  const scrollRef = useRef<ScrollView>(null);
  const webViewRef = useRef<WebView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [submitStep, setSubmitStep] = useState("Preparing submission...");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load draft data if draftId is provided
  useEffect(() => {
    if (params.draftId) {
      setEditingDraftId(params.draftId);
      setIsLoadingDraft(true);
      propertyService.getPropertyById(params.draftId)
        .then((res) => {
          const p = res?.data;
          if (p) {
            let loc: any = {};
            if (typeof p.location === "string") {
              try {
                loc = JSON.parse(p.location);
              } catch (e) {
                loc = { address: p.location };
              }
            } else if (p.location && typeof p.location === "object") {
              loc = p.location;
            }

            const lat = Number(loc.latitude) || 28.6139;
            const lon = Number(loc.longitude) || 77.2090;

            setFormData({
              title: p.title || "",
              description: p.description || "",
              address: loc.address || "",
              city: loc.city || "",
              state: loc.state || "",
              postalCode: loc.postalCode || "",
              totalSize: p.totalUnits ? p.totalUnits.toString() : (p.totalSize ? p.totalSize.toString() : ""),
              totalPrice: p.totalPrice ? p.totalPrice.toString() : (p.minInvestment ? p.minInvestment.toString() : ""),
              targetReturn: p.targetReturn ? p.targetReturn.toString() : "",
              category: p.category || "RESIDENTIAL",
              youtubeVideoUrl: (p as any).youtubeVideoUrl || "",
              latitude: lat,
              longitude: lon,
            });

            if (p.images && Array.isArray(p.images)) {
              setImages(p.images);
            }

            setTimeout(() => {
              webViewRef.current?.injectJavaScript(`
                if (typeof map !== 'undefined') {
                  map.flyTo([${lat}, ${lon}], 17, { animate: true, duration: 1.0 });
                }
                true;
              `);
            }, 600);
          }
        })
        .catch((err) => {
          console.error("Failed to load draft property:", err);
        })
        .finally(() => {
          setIsLoadingDraft(false);
          setHasUnsavedChanges(false);
        });
    }
  }, [params.draftId]);

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (isSubmitting) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [isSubmitting, pulseAnim]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToInput = (yOffset: number) => {
    scrollRef.current?.scrollTo({ y: yOffset, animated: true });
  };

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript(`if (typeof map !== 'undefined') { map.zoomIn(); } true;`);
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript(`if (typeof map !== 'undefined') { map.zoomOut(); } true;`);
  };

  // Mark as unsaved on any change
  useEffect(() => {
    if (formData.title || formData.description || images.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [formData, images]);

  // Handle back button for unsaved changes
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasUnsavedChanges) {
          Alert.alert(
            "Unsaved Changes",
            "You have unsaved changes. Are you sure you want to go back? You can save as a Draft instead.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Discard", style: "destructive", onPress: () => router.back() },
              { text: "Save as Draft", onPress: () => handleSubmit("DRAFT") }
            ]
          );
          return true; // prevent default behavior
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => backHandler.remove();
    }, [hasUnsavedChanges, formData, images])
  );

  const fetchAddressFromCoords = async (lat: number, lon: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, { headers: { 'User-Agent': 'SilverRealEstateApp/1.0 (contact@silverrealestate.com)', 'Accept-Language': 'en' } });
      const data = await response.json();
      
      if (data && data.address) {
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          address: data.display_name || "",
          city: data.address.city || data.address.town || data.address.village || "",
          state: data.address.state || "",
          postalCode: data.address.postcode || "",
        }));
      }
    } catch (err) {
      console.log("Reverse geocoding error:", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (text.trim().length >= 3) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5`, { headers: { 'User-Agent': 'SilverRealEstateApp/1.0 (contact@silverrealestate.com)', 'Accept-Language': 'en' } });
          const data = await res.json();
          setSearchResults(data);
        } catch(e) {}
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setSearchQuery(item.display_name);
    setSearchResults([]);
    
    // Fly map to new location with street-level zoom (17)
    webViewRef.current?.injectJavaScript(`
      if (typeof map !== 'undefined') {
        map.flyTo([${lat}, ${lon}], 17, { animate: true, duration: 1.2 });
      }
      true;
    `);
    fetchAddressFromCoords(lat, lon);
  };

  const handleGetLiveGPS = async () => {
    setIsLocatingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Location permission is required to use GPS.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      
      // Fly map to live GPS location with street-level zoom (17)
      webViewRef.current?.injectJavaScript(`
        if (typeof map !== 'undefined') {
          map.flyTo([${lat}, ${lon}], 17, { animate: true, duration: 1.2 });
        }
        true;
      `);
      fetchAddressFromCoords(lat, lon);
    } catch (err) {
      Alert.alert("GPS Error", "Failed to get current location.");
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
      setErrors(prev => ({ ...prev, images: "" }));
    }
  };

  const validateForm = () => {
    const result = addPropertySchema.safeParse(formData);
    const newErrors: Record<string, string> = {};
    
    if (!result.success) {
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          newErrors[issue.path[0].toString()] = issue.message;
        }
      });
    }
    
    if (images.length === 0) {
      newErrors.images = "Please upload at least one image.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (submitStatus: "PENDING_APPROVAL" | "DRAFT") => {
    if (submitStatus === "PENDING_APPROVAL") {
      if (!validateForm()) {
        Alert.alert("Validation Error", "Please fill all required fields before submitting for approval.");
        return;
      }
    } else {
      if (!formData.title.trim()) {
        Alert.alert("Title Required", "Please enter at least a Property Title to save as a draft.");
        return;
      }
    }
    
    setIsSubmitting(true);
    setSubmitStep(submitStatus === "DRAFT" ? (editingDraftId ? "Updating draft property..." : "Saving draft property...") : "Uploading property photos & media...");

    const step1Timer = setTimeout(() => {
      setSubmitStep("Processing coordinates & valuation data...");
    }, 1500);

    const step2Timer = setTimeout(() => {
      setSubmitStep(submitStatus === "DRAFT" ? "Saving draft listing..." : "Submitting listing for admin verification...");
    }, 3200);

    try {
      const data = new FormData();
      
      const locationObj = {
        address: formData.address || "Draft Location",
        city: formData.city || "",
        state: formData.state || "",
        postalCode: formData.postalCode || "",
        latitude: formData.latitude,
        longitude: formData.longitude
      };
      
      Object.entries(formData).forEach(([key, value]) => {
        if (!['address', 'city', 'state', 'postalCode', 'latitude', 'longitude'].includes(key) && value) {
          data.append(key, value.toString());
        }
      });
      data.append('location', JSON.stringify(locationObj));
      data.append('status', submitStatus);

      images.forEach((uri, index) => {
        if (uri.startsWith("http://") || uri.startsWith("https://")) {
          data.append("images", uri);
        } else {
          const filename = uri.split('/').pop() || `image_${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          data.append("images", { uri, name: filename, type } as any);
        }
      });
      
      if (editingDraftId) {
        await propertyService.updateBuilderProperty(editingDraftId, data);
      } else {
        await propertyService.addBuilderProperty(data);
      }
      setHasUnsavedChanges(false);
      
      if (submitStatus === "DRAFT") {
        Alert.alert("Draft Saved", "Property saved to your Drafts tab successfully.");
        router.replace("/(tabs)/builder-drafts");
      } else {
        Alert.alert("Success", "Property submitted for admin verification.");
        router.replace("/(tabs)/builder-pending");
      }
      
    } catch (error: any) {
      Alert.alert("Submission Failed", error?.response?.data?.message || "An error occurred.");
    } finally {
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
      setIsSubmitting(false);
    }
  };

  const numPrice = Number(formData.totalPrice) || 0;
  const numUnits = Number(formData.totalSize) || 0;
  const perUnitPrice = numUnits > 0 ? numPrice / numUnits : 0;

  const mapHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            * { box-sizing: border-box; }
            body { padding: 0; margin: 0; background: #F3F4F6; }
            html, body, #map { height: 100%; width: 100%; }
            #crosshair {
                position: absolute;
                top: 50%;
                left: 50%;
                margin-left: -16px;
                margin-top: -32px;
                font-size: 32px;
                z-index: 1000;
                pointer-events: none;
                filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));
            }
            .zoom-controls {
                position: absolute;
                bottom: 14px;
                right: 14px;
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .zoom-btn {
                width: 42px;
                height: 42px;
                background: #FFFFFF;
                border: 1px solid #D1D5DB;
                border-radius: 10px;
                font-size: 24px;
                font-weight: bold;
                color: #111827;
                box-shadow: 0 4px 10px rgba(0,0,0,0.18);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                outline: none;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
            }
            .zoom-btn:active {
                background: #E5E7EB;
                transform: scale(0.92);
            }
            .zoom-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #E5E7EB;
                border-radius: 6px;
                padding: 4px 10px;
                font-size: 11px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-weight: 700;
                color: #374151;
                z-index: 1000;
                pointer-events: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <div id="crosshair">📍</div>
        <div id="zoom-badge" class="zoom-badge">Zoom: 14x</div>
        <div class="zoom-controls">
            <button type="button" class="zoom-btn" onclick="map.zoomIn()" aria-label="Zoom In">+</button>
            <button type="button" class="zoom-btn" onclick="map.zoomOut()" aria-label="Zoom Out">−</button>
        </div>
        <script>
            var map = L.map('map', {
                center: [${initialCoordsRef.current.latitude}, ${initialCoordsRef.current.longitude}],
                zoom: 14,
                minZoom: 3,
                maxZoom: 19,
                zoomControl: false,
                attributionControl: false,
                touchZoom: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                boxZoom: true,
                dragging: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                maxNativeZoom: 19,
                attribution: '© OSM'
            }).addTo(map);

            function updateZoomBadge() {
                var z = map.getZoom();
                var badge = document.getElementById('zoom-badge');
                if (badge) badge.innerText = 'Zoom: ' + z + 'x';
            }

            map.on('zoomend', updateZoomBadge);

            map.on('click', function(e) {
                map.panTo(e.latlng, { animate: true });
            });

            map.on('moveend', function() {
                var center = map.getCenter();
                var zoom = map.getZoom();
                updateZoomBadge();
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        lat: center.lat,
                        lon: center.lng,
                        zoom: zoom
                    }));
                }
            });
        </script>
    </body>
    </html>
  `, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F3F4F6" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.root}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 160 }
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>
            {editingDraftId ? "Edit Draft Listing" : "Add Property"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {editingDraftId ? "Update your saved draft or submit it for review" : "Create a new listing"}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.cancelBtn}
          onPress={() => {
            if (hasUnsavedChanges) {
              Alert.alert(
                "Discard Changes?",
                "You have unsaved changes. Are you sure you want to exit?",
                [
                  { text: "No", style: "cancel" },
                  { text: "Yes, Discard", style: "destructive", onPress: () => router.back() }
                ]
              );
            } else {
              router.back();
            }
          }}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Draft Banner if editing draft */}
      {editingDraftId && (
        <View style={styles.draftEditBanner}>
          <Ionicons name="document-text" size={18} color="#4F46E5" />
          <View style={{ flex: 1 }}>
            <Text style={styles.draftEditBannerTitle}>Editing Saved Draft</Text>
            <Text style={styles.draftEditBannerText}>
              You can update any field, save changes as draft, or submit for approval.
            </Text>
          </View>
        </View>
      )}

      {isLoadingDraft && (
        <View style={styles.loadingDraftCard}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingDraftText}>Loading draft details...</Text>
        </View>
      )}
      
      {/* Basic Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="business" size={18} color={Colors.primary} />
          <Text style={styles.cardTitle}>Basic Information</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Property Title *</Text>
          <TextInput 
            style={[styles.input, errors.title && styles.inputError]} 
            placeholder="e.g. Silver Heights 3BHK Luxury Apartments"
            placeholderTextColor="#9CA3AF"
            value={formData.title}
            onFocus={() => scrollToInput(0)}
            onChangeText={(val) => {
              setFormData(prev => ({...prev, title: val}));
              if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
            }}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, formData.category === cat.id && styles.chipActive]}
                onPress={() => setFormData(prev => ({ ...prev, category: cat.id }))}
              >
                <Text style={[styles.chipText, formData.category === cat.id && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput 
            style={[styles.input, styles.textArea, errors.description && styles.inputError]} 
            placeholder="Detailed overview: key features, floor area, luxury amenities, road access, and builder specifications..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={formData.description}
            onFocus={() => scrollToInput(120)}
            onChangeText={(val) => {
              setFormData(prev => ({...prev, description: val}));
              if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
            }}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>YouTube Video / Virtual Tour URL</Text>
          <TextInput 
            style={[styles.input, errors.youtubeVideoUrl && styles.inputError]} 
            placeholder="e.g. https://www.youtube.com/watch?v=xyz123 (Optional)"
            placeholderTextColor="#9CA3AF"
            value={formData.youtubeVideoUrl}
            onFocus={() => scrollToInput(250)}
            onChangeText={(val) => {
              setFormData(prev => ({...prev, youtubeVideoUrl: val}));
              if (errors.youtubeVideoUrl) setErrors(prev => ({ ...prev, youtubeVideoUrl: "" }));
            }}
          />
          {errors.youtubeVideoUrl && <Text style={styles.errorText}>{errors.youtubeVideoUrl}</Text>}
        </View>
      </View>

      {/* Map & Location */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="location" size={18} color={Colors.primary} />
          <Text style={styles.cardTitle}>Property Location & Coordinates</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, searchQuery.length > 0 && { paddingRight: 36 }]}
              placeholder="Search area, landmark, street, city or PIN code..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onFocus={() => scrollToInput(400)}
              onChangeText={handleSearchChange}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.searchLoader} />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.gpsBtn} onPress={handleGetLiveGPS} disabled={isLocatingGPS}>
            {isLocatingGPS ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="locate" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.searchResultItem} onPress={() => selectSearchResult(item)}>
                <Ionicons name="location-outline" size={16} color={Colors.primary} />
                <Text style={styles.searchResultText} numberOfLines={2}>{item.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.mapContainer}>
          <WebView
            ref={webViewRef}
            style={styles.map}
            source={{ html: mapHtml }}
            nestedScrollEnabled={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={false}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.lat && data.lon) {
                  fetchAddressFromCoords(data.lat, data.lon);
                }
              } catch(e) {}
            }}
          />
        </View>

        <Text style={styles.mapHintText}>
          📍 Drag map or tap to reposition pin. Use + / − buttons to zoom in to exact street & plot level.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Formatted Address *</Text>
          <TextInput 
            style={[styles.input, styles.inputDisabled, errors.address && styles.inputError]} 
            placeholder="Address will auto-fill when location is selected on map"
            placeholderTextColor="#9CA3AF"
            value={formData.address}
            editable={false}
            multiline
          />
          {isReverseGeocoding && <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />}
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        </View>
      </View>

      {/* Financials */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="cash" size={18} color={Colors.primary} />
          <Text style={styles.cardTitle}>Investment & Valuation</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Total Valuation (INR ₹) *</Text>
            <TextInput 
              style={[styles.input, errors.totalPrice && styles.inputError]} 
              placeholder="e.g. 50000000 (₹5 Cr)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={formData.totalPrice}
              onFocus={() => scrollToInput(760)}
              onChangeText={(val) => {
                setFormData(prev => ({...prev, totalPrice: val}));
                if (errors.totalPrice) setErrors(prev => ({ ...prev, totalPrice: "" }));
              }}
            />
            {errors.totalPrice && <Text style={styles.errorText}>{errors.totalPrice}</Text>}
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Total Fractional Units *</Text>
            <TextInput 
              style={[styles.input, errors.totalSize && styles.inputError]} 
              placeholder="e.g. 1000 (Units)"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={formData.totalSize}
              onFocus={() => scrollToInput(760)}
              onChangeText={(val) => {
                setFormData(prev => ({...prev, totalSize: val}));
                if (errors.totalSize) setErrors(prev => ({ ...prev, totalSize: "" }));
              }}
            />
            {errors.totalSize && <Text style={styles.errorText}>{errors.totalSize}</Text>}
          </View>
        </View>

        <View style={styles.perUnitBox}>
          <Text style={styles.perUnitLabel}>Per Unit Price:</Text>
          <Text style={styles.perUnitValue}>
            ₹{perUnitPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Target Return (% p.a.)</Text>
          <TextInput 
            style={[styles.input, errors.targetReturn && styles.inputError]} 
            placeholder="e.g. 12.5 (% per year)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={formData.targetReturn}
            onFocus={() => scrollToInput(860)}
            onChangeText={(val) => {
              setFormData(prev => ({...prev, targetReturn: val}));
              if (errors.targetReturn) setErrors(prev => ({ ...prev, targetReturn: "" }));
            }}
          />
          {errors.targetReturn && <Text style={styles.errorText}>{errors.targetReturn}</Text>}
        </View>
      </View>

      {/* Images */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="images" size={18} color={Colors.primary} />
          <Text style={styles.cardTitle}>Property Photos</Text>
        </View>
        
        <TouchableOpacity style={[styles.uploadButton, errors.images && styles.inputError]} onPress={pickImages}>
          <Ionicons name="cloud-upload" size={24} color={Colors.primary} style={{marginBottom: 4}}/>
          <Text style={styles.uploadButtonTitle}>Click to Upload Images</Text>
          <Text style={styles.uploadButtonSub}>PNG, JPG up to 10MB each</Text>
        </TouchableOpacity>
        {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}
        
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
            {images.map((uri, idx) => (
              <View key={idx} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageBtn}
                  onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                >
                  <Text style={styles.removeImageText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.draftButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={() => handleSubmit("DRAFT")}
          disabled={isSubmitting}
        >
          <Text style={styles.draftButtonText}>
            {editingDraftId ? "Update Draft" : "Save Draft"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={() => handleSubmit("PENDING_APPROVAL")}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>{isSubmitting ? "Submitting..." : "Submit for Approval"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

    {keyboardHeight > 0 && (
      <TouchableOpacity
        style={[styles.floatingDoneBtn, { bottom: Platform.OS === 'ios' ? keyboardHeight + 10 : 16 }]}
        onPress={() => Keyboard.dismiss()}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark-circle" size={16} color="#FFF" />
        <Text style={styles.floatingDoneText}>Done</Text>
      </TouchableOpacity>
    )}

    {/* ── Submitting Animation Overlay Modal ── */}
    <Modal visible={isSubmitting} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.submittingModalOverlay}>
        <View style={styles.submittingCard}>
          <Animated.View style={[styles.submittingIconCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="cloud-upload" size={40} color={Colors.primary} />
          </Animated.View>

          <Text style={styles.submittingTitle}>
            {formData.title ? `Submitting "${formData.title}"` : "Submitting Property"}
          </Text>

          <Text style={styles.submittingStepText}>
            {submitStep}
          </Text>

          <View style={styles.submittingLoaderRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <BouncingDots label="Please wait" color={Colors.primary} />
          </View>

          <Text style={styles.submittingHint}>
            Please do not close or minimize the app while photos and details are being uploaded.
          </Text>
        </View>
      </View>
    </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F4F6" },
  scrollContent: { padding: 16, paddingBottom: 160 },
  submittingModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 99999,
  },
  submittingCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  submittingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F9FF",
    borderWidth: 2,
    borderColor: "#BAE6FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  submittingTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  submittingStepText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
    minHeight: 20,
  },
  submittingLoaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  submittingHint: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 16,
  },
  floatingDoneBtn: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 9999,
  },
  floatingDoneText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#111827" },
  headerSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#FFF", borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  cancelBtnText: { color: "#374151", fontSize: 13, fontWeight: "600" },

  draftEditBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  draftEditBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3730A3",
    marginBottom: 2,
  },
  draftEditBannerText: {
    fontSize: 12,
    color: "#4338CA",
    lineHeight: 16,
  },

  loadingDraftCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  loadingDraftText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingBottom: 12, marginBottom: 16, gap: 8 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#111827", textTransform: "uppercase", letterSpacing: 0.5 },
  
  formGroup: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 6 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 12, fontSize: 14, color: "#111827" },
  inputDisabled: { backgroundColor: "#F3F4F6", color: "#6B7280" },
  inputError: { borderColor: "#EF4444", borderWidth: 1 },
  errorText: { color: "#EF4444", fontSize: 11, marginTop: 4 },
  textArea: { minHeight: 90 },
  
  chipsContainer: { flexDirection: "row", marginBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F3F4F6", marginRight: 8, borderWidth: 1, borderColor: "transparent" },
  chipActive: { backgroundColor: Colors.primary + "15", borderColor: Colors.primary },
  chipText: { fontSize: 13, color: "#4B5563", fontWeight: "600" },
  chipTextActive: { color: Colors.primary },
  
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  searchInputContainer: { flex: 1, position: "relative", justifyContent: "center" },
  searchIcon: { position: "absolute", left: 12, zIndex: 1 },
  searchInput: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, padding: 10, paddingLeft: 36, fontSize: 13, color: "#111827" },
  searchLoader: { position: "absolute", right: 12 },
  clearSearchBtn: { position: "absolute", right: 10, height: "100%", justifyContent: "center", alignItems: "center", paddingHorizontal: 4, zIndex: 2 },
  gpsBtn: { width: 44, height: 44, backgroundColor: "#F0F9FF", borderRadius: 10, borderWidth: 1, borderColor: "#BAE6FD", alignItems: "center", justifyContent: "center" },
  
  searchResults: { backgroundColor: "#FFF", borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", maxHeight: 150, marginBottom: 12, overflow: "hidden" },
  searchResultItem: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", gap: 8 },
  searchResultText: { fontSize: 12, color: "#374151", flex: 1 },
  
  mapContainer: { height: 280, borderRadius: 12, overflow: "hidden", marginBottom: 8, position: "relative", borderWidth: 1, borderColor: "#E5E7EB" },
  map: { flex: 1 },
  mapHintText: { fontSize: 11, color: "#6B7280", marginBottom: 16, lineHeight: 16 },
  loader: { position: "absolute", right: 12, top: 38 },
  
  perUnitBox: { backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0", borderRadius: 10, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  perUnitLabel: { fontSize: 12, fontWeight: "700", color: "#065F46" },
  perUnitValue: { fontSize: 15, fontWeight: "700", color: "#047857", fontFamily: "monospace" },
  
  uploadButton: { backgroundColor: "#F9FAFB", borderWidth: 2, borderColor: "#E5E7EB", borderStyle: "dashed", borderRadius: 12, padding: 20, alignItems: "center" },
  uploadButtonTitle: { color: "#374151", fontWeight: "700", fontSize: 13, marginTop: 4 },
  uploadButtonSub: { color: "#9CA3AF", fontSize: 11, marginTop: 2 },
  imagesContainer: { marginTop: 16, flexDirection: "row" },
  imageWrapper: { marginRight: 12, position: "relative" },
  previewImage: { width: 72, height: 72, borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  removeImageBtn: { position: "absolute", top: -6, right: -6, backgroundColor: "#EF4444", width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF" },
  removeImageText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  
  actionRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  draftButton: { flex: 1, backgroundColor: "#FFF", borderRadius: 10, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#D1D5DB" },
  draftButtonText: { color: "#374151", fontSize: 15, fontWeight: "700" },
  submitButton: { flex: 2, backgroundColor: Colors.primary, borderRadius: 10, padding: 16, alignItems: "center" },
  submitButtonText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  submitButtonDisabled: { opacity: 0.7 },
});
