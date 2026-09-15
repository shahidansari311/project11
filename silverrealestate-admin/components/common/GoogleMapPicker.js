"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import { loadGoogleMapsScript, parseGooglePlace } from "@/lib/googleMapsLoader";
import toast from "react-hot-toast";

const DEFAULT_LAT = 28.613939;
const DEFAULT_LNG = 77.209021;

export default function GoogleMapPicker({
  apiKey,
  initialLatitude,
  initialLongitude,
  initialAddress = "",
  initialPlaceName = "",
  onLocationSelect,
  height = "380px",
  showBottomDetails = true,
  isModal = false,
  onCloseModal,
}) {
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const geocoderRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Reverse geocode via Google Geocoder
  const reverseGeocodeGoogle = useCallback(
    (lat, lng, notifyParent = true) => {
      if (!geocoderRef.current) return;
      setIsReverseGeocoding(true);

      geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        setIsReverseGeocoding(false);
        if (status === "OK" && results && results[0]) {
          const parsed = parseGooglePlace(results[0]);
          if (parsed) {
            const updated = {
              address: parsed.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              placeName: parsed.placeName || "",
              city: parsed.city || "",
              state: parsed.state || "",
              postalCode: parsed.postalCode || "",
              country: parsed.country || "India",
            };
            setLocationDetails(updated);

            if (notifyParent && onLocationSelect) {
              onLocationSelect({
                latitude: Number(lat.toFixed(6)),
                longitude: Number(lng.toFixed(6)),
                ...updated,
              });
            }
          }
        }
      });
    },
    [onLocationSelect]
  );

  // Initialize Google Map & Autocomplete
  useEffect(() => {
    let isMounted = true;
    const effectiveKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!effectiveKey || effectiveKey.trim() === "") {
      setMapError("GOOGLE_MAPS_KEY_MISSING");
      return;
    }

    loadGoogleMapsScript(effectiveKey)
      .then((googleMaps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const initialPos = {
          lat: currentCoords.latitude,
          lng: currentCoords.longitude,
        };

        // Create Map
        const map = new googleMaps.Map(mapContainerRef.current, {
          center: initialPos,
          zoom: hasValidInit ? 16 : 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          gestureHandling: "greedy",
        });

        // Create Draggable Pin Marker (Swiggy / Zomato red pin)
        const marker = new googleMaps.Marker({
          position: initialPos,
          map: map,
          draggable: true,
          animation: googleMaps.Animation.DROP,
          title: "Drag to pinpoint exact location",
        });

        // Initialize Geocoder
        geocoderRef.current = new googleMaps.Geocoder();

        // Marker Drag End Listener
        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (!pos) return;
          const lat = Number(pos.lat().toFixed(6));
          const lng = Number(pos.lng().toFixed(6));
          setCurrentCoords({ latitude: lat, longitude: lng });
          reverseGeocodeGoogle(lat, lng, true);
        });

        // Map Click Listener
        map.addListener("click", (e) => {
          if (!e.latLng) return;
          const lat = Number(e.latLng.lat().toFixed(6));
          const lng = Number(e.latLng.lng().toFixed(6));
          marker.setPosition({ lat, lng });
          setCurrentCoords({ latitude: lat, longitude: lng });
          reverseGeocodeGoogle(lat, lng, true);
        });

        // Places Autocomplete Setup (Swiggy / Zomato search experience)
        if (searchInputRef.current && googleMaps.places) {
          const autocomplete = new googleMaps.places.Autocomplete(searchInputRef.current, {
            fields: ["formatted_address", "geometry", "name", "address_components"],
          });
          autocomplete.bindTo("bounds", map);

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
              toast.error("No details available for selected place");
              return;
            }

            const lat = Number(place.geometry.location.lat().toFixed(6));
            const lng = Number(place.geometry.location.lng().toFixed(6));

            map.setCenter({ lat, lng });
            map.setZoom(17);
            marker.setPosition({ lat, lng });
            setCurrentCoords({ latitude: lat, longitude: lng });

            const parsed = parseGooglePlace(place);
            if (parsed) {
              const updated = {
                address: parsed.address || place.formatted_address,
                placeName: parsed.placeName || place.name || "",
                city: parsed.city || "",
                state: parsed.state || "",
                postalCode: parsed.postalCode || "",
                country: parsed.country || "India",
              };
              setLocationDetails(updated);

              if (onLocationSelect) {
                onLocationSelect({
                  latitude: lat,
                  longitude: lng,
                  ...updated,
                });
              }
            }

            toast.success(`Location set: ${place.name || "Selected spot"}`);
          });

          autocompleteRef.current = autocomplete;
        }

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setIsLoaded(true);

        if (hasValidInit && !initialAddress) {
          reverseGeocodeGoogle(parsedInitLat, parsedInitLng, false);
        }
      })
      .catch((err) => {
        console.warn("Google Maps load error:", err);
        if (isMounted) {
          setMapError(err.message || "Failed to load Google Maps");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // GPS Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGPS(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        setCurrentCoords({ latitude: lat, longitude: lng });

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(17);
          markerRef.current.setPosition({ lat, lng });
        }

        reverseGeocodeGoogle(lat, lng, true);
        toast.success("Detected your current GPS location!");
      },
      (error) => {
        setIsLocatingGPS(false);
        toast.error(error.message || "Failed to retrieve your current location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
    }
  };

  return (
    <div className="relative w-full flex flex-col rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      {/* Top Search Bar with Google Places Autocomplete */}
      <div className="p-3 bg-white border-b border-gray-100 flex flex-col gap-2 z-20">
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-primary pointer-events-none">
            <Icon icon="logos:google-maps" width="18" height="18" />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search area, landmark, society, building on Google Maps..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-slate-50/70 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm font-medium text-gray-900 outline-none transition-all placeholder:text-gray-400 shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <Icon icon="lucide:x" width="16" height="16" />
            </button>
          )}
        </div>
      </div>

      {/* Google Map Container */}
      <div className="relative w-full overflow-hidden bg-slate-100 flex items-center justify-center" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Missing API Key Setup Card Overlay */}
        {mapError && (
          <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3 shadow-sm">
              <Icon icon="logos:google-maps" width="26" height="26" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Google Maps API Key Required</h3>
            <p className="text-xs text-gray-600 max-w-md mb-4 leading-relaxed">
              To enable live Google Places search and interactive pin drop, add your Google Maps API key to the <code className="bg-slate-200 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold text-gray-800">.env</code> file:
            </p>
            <div className="bg-slate-900 text-slate-100 px-3.5 py-2 rounded-xl text-xs font-mono mb-4 text-left select-all shadow-inner border border-slate-800 flex items-center gap-2">
              <span className="text-emerald-400">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</span>=<span>your_api_key_here</span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap justify-center">
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocatingGPS}
                className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Icon icon="lucide:crosshair" width="14" height="14" />
                <span>Auto-detect My GPS Location</span>
              </button>
            </div>
          </div>
        )}


        {/* Floating Controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          {/* GPS Locate Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocatingGPS}
            className="w-9 h-9 bg-white hover:bg-slate-50 text-gray-700 hover:text-primary rounded-xl shadow-md border border-gray-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-60"
            title="Use My Current GPS Location"
          >
            {isLocatingGPS ? (
              <Icon icon="lucide:loader-2" className="animate-spin text-primary" width="18" height="18" />
            ) : (
              <Icon icon="lucide:crosshair" className="text-primary" width="18" height="18" />
            )}
          </button>

          {/* Zoom Buttons */}
          <div className="flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden divide-y divide-gray-100">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-slate-50 hover:text-gray-900 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <Icon icon="lucide:plus" width="16" height="16" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-slate-50 hover:text-gray-900 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <Icon icon="lucide:minus" width="16" height="16" />
            </button>
          </div>
        </div>

        {/* Pin Tip Badge */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] sm:text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm border border-gray-200/80 flex items-center gap-1.5">
            <Icon icon="lucide:mouse-pointer-click" width="13" height="13" className="text-primary" />
            <span>Click on Google Map or drag pin to pinpoint exact location</span>
          </span>
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
                  ? "Fetching address details from Google Maps..."
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
