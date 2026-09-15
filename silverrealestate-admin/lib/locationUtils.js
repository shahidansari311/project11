/**
 * Utility functions for handling Property Location (supports both string and coordinate/JSON object formats)
 */

export function formatLocation(location) {
  if (!location) return "Location not specified";
  if (typeof location === "string") {
    try {
      // Handle case where location was stringified JSON
      if (location.startsWith("{") && location.endsWith("}")) {
        const parsed = JSON.parse(location);
        return formatLocation(parsed);
      }
    } catch {
      // It's a plain string
    }
    return location.trim() || "Location not specified";
  }

  if (typeof location === "object") {
    if (location.address && location.address.trim()) {
      return location.address.trim();
    }
    if (location.placeName && location.city) {
      return `${location.placeName.trim()}, ${location.city.trim()}`;
    }
    if (location.placeName) {
      return location.placeName.trim();
    }
    if (location.city) {
      return `${location.city.trim()}${location.state ? ", " + location.state.trim() : ""}`;
    }
    if (
      typeof location.latitude === "number" &&
      typeof location.longitude === "number" &&
      !isNaN(location.latitude) &&
      !isNaN(location.longitude)
    ) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
  }

  return "Location not specified";
}

export function getCoordinates(location) {
  if (!location) return null;
  let locObj = location;
  if (typeof location === "string") {
    try {
      if (location.startsWith("{") && location.endsWith("}")) {
        locObj = JSON.parse(location);
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (typeof locObj === "object" && locObj !== null) {
    const rawLat = locObj.latitude ?? locObj.lat;
    const rawLng = locObj.longitude ?? locObj.lng ?? locObj.lon;
    if (rawLat === undefined || rawLng === undefined || rawLat === null || rawLng === null) {
      return null;
    }
    const lat = typeof rawLat === "number" ? rawLat : parseFloat(rawLat);
    const lng = typeof rawLng === "number" ? rawLng : parseFloat(rawLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { latitude: lat, longitude: lng, lat, lng };
    }
  }
  return null;
}

export function getGoogleMapsUrl(location) {
  const coords = getCoordinates(location);
  if (coords) {
    return `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
  }
  const display = formatLocation(location);
  if (display && display !== "Location not specified") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(display)}`;
  }
  return null;
}

export function getGoogleMapsEmbedUrl(location) {
  const coords = getCoordinates(location);
  if (coords) {
    return `https://maps.google.com/maps?q=${coords.latitude},${coords.longitude}&hl=en&z=15&output=embed`;
  }
  const display = formatLocation(location);
  if (display && display !== "Location not specified") {
    return `https://maps.google.com/maps?q=${encodeURIComponent(display)}&hl=en&z=15&output=embed`;
  }
  return null;
}

/**
 * Search locations via OpenStreetMap Nominatim API (Free, no API key needed)
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query.trim()
    )}&addressdetails=1&limit=6`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      const addr = item.address || {};
      const placeName =
        item.name ||
        addr.building ||
        addr.commercial ||
        addr.amenity ||
        addr.neighbourhood ||
        addr.suburb ||
        addr.road ||
        "";
      const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || "";
      const state = addr.state || addr.state_district || "";
      const postalCode = addr.postcode || "";
      const country = addr.country || "India";

      return {
        id: item.place_id,
        displayName: item.display_name,
        placeName: placeName.trim(),
        address: item.display_name,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };
    });
  } catch (err) {
    console.warn("Geocoding search failed:", err);
    return [];
  }
}

/**
 * Reverse geocode latitude & longitude to address object via Nominatim API
 */
export async function reverseGeocodeLocation(latitude, longitude) {
  if (latitude == null || longitude == null) return null;
  const lat = typeof latitude === "number" ? latitude : parseFloat(latitude);
  const lng = typeof longitude === "number" ? longitude : parseFloat(longitude);
  if (isNaN(lat) || isNaN(lng)) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.address) return null;

    const addr = data.address || {};
    const placeName =
      data.name ||
      addr.building ||
      addr.commercial ||
      addr.amenity ||
      addr.neighbourhood ||
      addr.suburb ||
      addr.road ||
      "";
    const city = addr.city || addr.town || addr.municipality || addr.village || addr.county || "";
    const state = addr.state || addr.state_district || "";
    const postalCode = addr.postcode || "";
    const country = addr.country || "India";

    return {
      displayName: data.display_name,
      placeName: placeName.trim(),
      address: data.display_name,
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      latitude: lat,
      longitude: lng,
    };
  } catch (err) {
    console.warn("Reverse geocoding failed:", err);
    return null;
  }
}



