import { useState, useRef, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList, BackHandler } from "react-native";
import { propertyService } from "@/services/property.service";
import { Colors } from "@/constants/colors";
import { useRouter, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { addPropertySchema } from "@/utils/validationSchemas";

const CATEGORIES = [
  { id: "RESIDENTIAL", label: "Residential" },
  { id: "COMMERCIAL", label: "Commercial" },
  { id: "INDUSTRIAL", label: "Industrial" },
  { id: "LAND", label: "Land/Plot" },
  { id: "VILLA", label: "Villa" },
];

export default function BuilderAddTab() {
  const router = useRouter();
  
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
  
  const webViewRef = useRef<WebView>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    
    // Fly map to new location
    webViewRef.current?.injectJavaScript(`
      map.flyTo([${lat}, ${lon}], 16);
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

      const location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;
      
      webViewRef.current?.injectJavaScript(`
        map.flyTo([${lat}, ${lon}], 16);
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
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please check the highlighted fields.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const data = new FormData();
      
      const locationObj = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
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
        const filename = uri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        data.append("images", { uri, name: filename, type } as any);
      });
      
      await propertyService.addBuilderProperty(data);
      setHasUnsavedChanges(false); // Clear dirty state
      
      if (submitStatus === "DRAFT") {
        Alert.alert("Saved", "Property saved as Draft.");
        // If there was a drafts tab we'd go there, for now just go pending or clear
        router.replace("/(tabs)/builder-pending");
      } else {
        Alert.alert("Success", "Property submitted for admin verification.");
        router.replace("/(tabs)/builder-pending");
      }
      
    } catch (error: any) {
      Alert.alert("Submission Failed", error?.response?.data?.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const numPrice = Number(formData.totalPrice) || 0;
  const numUnits = Number(formData.totalSize) || 0;
  const perUnitPrice = numUnits > 0 ? numPrice / numUnits : 0;

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { padding: 0; margin: 0; }
            html, body, #map { height: 100%; width: 100%; }
            #crosshair {
                position: absolute;
                top: 50%;
                left: 50%;
                margin-left: -15px;
                margin-top: -30px;
                font-size: 30px;
                z-index: 1000;
                pointer-events: none;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <div id="crosshair">📍</div>
        <script>
            var map = L.map('map', {zoomControl: true}).setView([${formData.latitude}, ${formData.longitude}], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OSM'
            }).addTo(map);

            map.on('moveend', function() {
                var center = map.getCenter();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    lat: center.lat,
                    lon: center.lng
                }));
            });
        </script>
    </body>
    </html>
  `;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Add Property</Text>
          <Text style={styles.headerSubtitle}>Create a new listing</Text>
        </View>
        <TouchableOpacity 
          style={styles.cancelBtn}
          onPress={() => {
            if (hasUnsavedChanges) {
              Alert.alert(
                "Cancel Creation?",
                "You have unsaved changes. Are you sure you want to cancel?",
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
            placeholder="e.g. Silver Heights Luxury Apartments"
            value={formData.title}
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
            placeholder="Provide a detailed overview of the property..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={formData.description}
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
            placeholder="https://youtube.com/watch?v=..."
            value={formData.youtubeVideoUrl}
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
              style={styles.searchInput}
              placeholder="Search address, city..."
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            {isSearching && <ActivityIndicator size="small" color={Colors.primary} style={styles.searchLoader} />}
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Formatted Address *</Text>
          <TextInput 
            style={[styles.input, styles.inputDisabled, errors.address && styles.inputError]} 
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
              placeholder="e.g. 50000000"
              keyboardType="numeric"
              value={formData.totalPrice}
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
              placeholder="e.g. 1000"
              keyboardType="numeric"
              value={formData.totalSize}
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
            placeholder="e.g. 12.5"
            keyboardType="numeric"
            value={formData.targetReturn}
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
          <Text style={styles.draftButtonText}>Save Draft</Text>
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F3F4F6" },
  scrollContent: { padding: 16, paddingBottom: 100 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#111827" },
  headerSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#FFF", borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  cancelBtnText: { color: "#374151", fontSize: 13, fontWeight: "600" },
  
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
  gpsBtn: { width: 44, height: 44, backgroundColor: "#F0F9FF", borderRadius: 10, borderWidth: 1, borderColor: "#BAE6FD", alignItems: "center", justifyContent: "center" },
  
  searchResults: { backgroundColor: "#FFF", borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB", maxHeight: 150, marginBottom: 12, overflow: "hidden" },
  searchResultItem: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", gap: 8 },
  searchResultText: { fontSize: 12, color: "#374151", flex: 1 },
  
  mapContainer: { height: 250, borderRadius: 12, overflow: "hidden", marginBottom: 16, position: "relative", borderWidth: 1, borderColor: "#E5E7EB" },
  map: { flex: 1 },
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
