"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { searchLocations, reverseGeocodeLocation } from "@/lib/locationUtils";
import toast from "react-hot-toast";

// Default coordinate: Connaught Place, New Delhi
const DEFAULT_LAT = 28.613939;
const DEFAULT_LNG = 77.209021;

export default function InteractiveMapPicker({
  initialLatitude,
  initialLongitude,
  initialAddress = "",
  initialPlaceName = "",
  onLocationSelect,
  height = "420px",
  showBottomDetails = true,
  isModal = false,
  onCloseModal,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialAddress || "");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Current pinned position & location info
  const parsedInitLat = parseFloat(initialLatitude);
  const parsedInitLng = parseFloat(initialLongitude);
  const hasValidInit = !isNaN(parsedInitLat) && !isNaN(parsedInitLng);

  const [currentCoords, setCurrentCoords] = useState({
    latitude: hasValidInit ? parsedInitLat : DEFAULT_LAT,
    longitude: hasValidInit ? parsedInitLng : DEFAULT_LNG,
  });

  const [locationDetails, setLocationDetails] = useState({
    address: initialAddress || "",
    placeName: initialPlaceName || "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const [zoomLevel, setZoomLevel] = useState(hasValidInit ? 17 : 15);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  // Load Leaflet CSS dynamically if not present
  useEffect(() => {
    if (typeof document !== "undefined") {
      const existingLink = document.getElementById("leaflet-css");
      if (!existingLink) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
    }
  }, []);

  // Reverse geocode handler (Free OpenStreetMap Nominatim)
  const handleReverseGeocode = useCallback(
    async (lat, lng, notifyParent = true) => {
      setIsReverseGeocoding(true);
      try {
        const res = await reverseGeocodeLocation(lat, lng);
        if (res) {
          const updated = {
            address: res.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            placeName: res.placeName || "",
            city: res.city || "",
            state: res.state || "",
            postalCode: res.postalCode || "",
            country: res.country || "India",
          };
          setLocationDetails(updated);
          setSearchQuery(updated.address);

          if (notifyParent && onLocationSelect) {
            onLocationSelect({
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
              ...updated,
            });
          }
        }
      } catch (err) {
        console.warn("Reverse geocode error:", err);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [onLocationSelect]
  );

  // Initialize Map with 100% Free OpenStreetMap Tiles (Zero API Key, Zero Watermark)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    // Dynamically import Leaflet to prevent Next.js SSR errors
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialCenter = [currentCoords.latitude, currentCoords.longitude];
      const initialZoom = hasValidInit ? 17 : 15;

      // Vibrant Red/Orange Marker Pin (Matching Image 1)
      const customPinIcon = L.divIcon({
        className: "custom-map-pin-container",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: grab;">
            <div style="
              width: 36px;
              height: 36px;
              background: #FF4D30;
              color: white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 14px rgba(255, 77, 48, 0.45), 0 2px 6px rgba(0,0,0,0.2);
              border: 2.5px solid #ffffff;
            ">
              <div style="transform: rotate(45deg); width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
            </div>
            <div style="
              width: 14px;
              height: 5px;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 50%;
              margin-top: 3px;
              filter: blur(1px);
            "></div>
          </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
      });

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      });

      // 100% Free OpenStreetMap Standard Tiles (No API key, No watermark)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      // Create Draggable Marker
      const marker = L.marker(initialCenter, {
        icon: customPinIcon,
        draggable: true,
        autoPan: true,
      }).addTo(map);

      // Marker Drag End Event
      marker.on("dragend", (event) => {
        const position = event.target.getLatLng();
        const lat = Number(position.lat.toFixed(6));
        const lng = Number(position.lng.toFixed(6));
        setCurrentCoords({ latitude: lat, longitude: lng });
        handleReverseGeocode(lat, lng, true);
      });

      // Map Click Event (Move Pin directly to clicked location)
      map.on("click", (e) => {
        const lat = Number(e.latlng.lat.toFixed(6));
        const lng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([lat, lng]);
        setCurrentCoords({ latitude: lat, longitude: lng });
        handleReverseGeocode(lat, lng, true);
      });

      // Track Zoom Level
      map.on("zoomend", () => {
        setZoomLevel(map.getZoom());
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Auto trigger initial reverse geocode if no address details provided
      if (hasValidInit && !initialAddress) {
        handleReverseGeocode(parsedInitLat, parsedInitLng, false);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map pin when external coordinates change
  useEffect(() => {
    const lat = parseFloat(initialLatitude);
    const lng = parseFloat(initialLongitude);
    if (!isNaN(lat) && !isNaN(lng) && mapInstanceRef.current && markerRef.current) {
      if (Math.abs(lat - currentCoords.latitude) > 0.0001 || Math.abs(lng - currentCoords.longitude) > 0.0001) {
        setCurrentCoords({ latitude: lat, longitude: lng });
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.panTo([lat, lng]);
      }
    }
  }, [initialLatitude, initialLongitude]);

  // Handle Search Input Change with Debounce (Free Nominatim Search)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchLocations(val);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
  };

  // Handle Place Selection from Dropdown
  const handleSelectPlace = (place) => {
    setShowDropdown(false);
    setSearchQuery(place.address || place.placeName || place.displayName);

    const lat = Number(place.latitude.toFixed(6));
    const lng = Number(place.longitude.toFixed(6));

    setCurrentCoords({ latitude: lat, longitude: lng });

    const updated = {
      address: place.address,
      placeName: place.placeName || "",
      city: place.city || "",
      state: place.state || "",
      postalCode: place.postalCode || "",
      country: place.country || "India",
    };
    setLocationDetails(updated);

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.flyTo([lat, lng], 17, {
        animate: true,
        duration: 1.2,
      });
    }

    if (onLocationSelect) {
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        ...updated,
      });
    }

    toast.success(`Location set: ${place.placeName || place.city || "Selected location"}`);
  };

  // Live GPS Locate Me Button (Free navigator.geolocation + Smooth flyTo)
  const handleGetLiveGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocatingGPS(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        setCurrentCoords({ latitude: lat, longitude: lng });

        // Smooth fly to live GPS location (like mobile app WebView)
        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
        }

        await handleReverseGeocode(lat, lng, true);
        toast.success("Live GPS Location detected!");
      },
      (error) => {
        setIsLocatingGPS(false);
        if (error.code === 1) {
          toast.error("Location permission denied. Please allow GPS access in your browser.");
        } else if (error.code === 2) {
          toast.error("GPS position unavailable. Please check your device location settings.");
        } else if (error.code === 3) {
          toast.error("GPS request timed out. Please try again.");
        } else {
          toast.error(error.message || "Failed to retrieve your current location");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Zoom In / Out
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className="relative w-full flex flex-col rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      {/* Top Floating / Embedded Search Header (Matching Image 1) */}
      <div className="p-3 bg-white border-b border-gray-100 flex flex-col gap-2 z-30">
        <div className="flex items-center justify-between gap-2 pb-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-gray-800 uppercase tracking-wider text-[11px]">
            <Icon icon="lucide:map-pin" className="text-primary" width="15" height="15" />
            <span>Property Location & Coordinates</span>
          </div>
          <button
            type="button"
            onClick={handleGetLiveGPS}
            disabled={isLocatingGPS}
            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-60"
            title="Locate via GPS"
          >
            {isLocatingGPS ? (
              <Icon icon="lucide:loader-2" className="animate-spin" width="13" height="13" />
            ) : (
              <Icon icon="lucide:locate-fixed" width="13" height="13" />
            )}
            <span>{isLocatingGPS ? "Locating..." : "Live GPS"}</span>
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
            {isSearching ? (
              <Icon icon="lucide:loader-2" className="animate-spin text-primary" width="16" height="16" />
            ) : (
              <Icon icon="lucide:search" width="16" height="16" />
            )}
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            placeholder="Search address, area, landmark (e.g. Phase 1, Crossings Republik, Ghaziabad)..."
            className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-slate-50/70 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowDropdown(false);
              }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <Icon icon="lucide:x" width="16" height="16" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-24 left-3 right-3 bg-white rounded-xl border border-gray-200 shadow-2xl max-h-64 overflow-y-auto custom-scrollbar z-50 divide-y divide-gray-100">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPlace(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon icon="lucide:map-pin" width="15" height="15" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                    {item.placeName || item.city || "Selected Place"}
                  </span>
                  <span className="text-[11px] text-gray-500 line-clamp-1">{item.displayName}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Canvas Area (Matching Image 1 with exact floating controls) */}
      <div className="relative w-full overflow-hidden bg-slate-100" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Bottom-Left Floating Zoom Controls */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-200 overflow-hidden divide-y divide-gray-100">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-9 h-9 flex items-center justify-center text-gray-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            title="Zoom In"
          >
            <Icon icon="lucide:plus" width="16" height="16" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-9 h-9 flex items-center justify-center text-gray-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            title="Zoom Out"
          >
            <Icon icon="lucide:minus" width="16" height="16" />
          </button>
        </div>

        {/* Bottom-Right Floating Zoom Badge & Live GPS Button (Matching Image 1) */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          {/* Zoom: 17x Pill Indicator */}
          <div className="bg-white/95 backdrop-blur-md text-gray-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-md border border-gray-200 flex items-center gap-1 select-none">
            <span>Zoom: {zoomLevel}x</span>
          </div>

          {/* GPS Locate Me Button */}
          <button
            type="button"
            onClick={handleGetLiveGPS}
            disabled={isLocatingGPS}
            className="w-9 h-9 bg-white/95 hover:bg-white text-gray-800 hover:text-primary rounded-xl shadow-md border border-gray-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-60 active:scale-95"
            title="Get Live GPS Location"
          >
            {isLocatingGPS ? (
              <Icon icon="lucide:loader-2" className="animate-spin text-primary" width="18" height="18" />
            ) : (
              <Icon icon="lucide:crosshair" width="18" height="18" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Pinned Location Details Card */}
      {showBottomDetails && (
        <div className="p-3.5 bg-slate-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-20">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              {isReverseGeocoding ? (
                <Icon icon="lucide:loader-2" className="animate-spin" width="16" height="16" />
              ) : (
                <Icon icon="lucide:map-pin" width="16" height="16" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-900">
                  {locationDetails.placeName || locationDetails.city || "Pinned Location"}
                </span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  {currentCoords.latitude.toFixed(6)}, {currentCoords.longitude.toFixed(6)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                {isReverseGeocoding
                  ? "Fetching address details from pin..."
                  : locationDetails.address || "Click or drag the pin to select a spot"}
              </p>
            </div>
          </div>

          {isModal && (
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={onCloseModal}
                className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onLocationSelect) {
                    onLocationSelect({
                      latitude: Number(currentCoords.latitude.toFixed(6)),
                      longitude: Number(currentCoords.longitude.toFixed(6)),
                      ...locationDetails,
                    });
                  }
                  if (onCloseModal) onCloseModal();
                  toast.success("Location coordinates updated successfully!");
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Icon icon="lucide:check" width="14" height="14" />
                <span>Confirm & Set Location</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
