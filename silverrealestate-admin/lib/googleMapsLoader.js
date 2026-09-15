/**
 * Safe client-side Google Maps JavaScript API script loader & helpers
 */

let googleMapsPromise = null;

export function loadGoogleMapsScript(apiKey) {
  if (typeof window === "undefined") return Promise.reject(new Error("Window is not defined"));

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script tag is already in DOM
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
        return;
      }
      existingScript.addEventListener("load", () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error("Google Maps object not found"));
        }
      });
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.type = "text/javascript";
    const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : "";
    script.src = `https://maps.googleapis.com/maps/api/js?libraries=places,geometry${keyParam}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error("Google Maps API loaded but google.maps is missing"));
      }
    };

    script.onerror = (error) => {
      googleMapsPromise = null;
      reject(error);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export function parseGooglePlace(place) {
  if (!place) return null;
  const lat =
    typeof place.geometry?.location?.lat === "function"
      ? place.geometry.location.lat()
      : typeof place.geometry?.location?.lat === "number"
      ? place.geometry.location.lat
      : null;
  const lng =
    typeof place.geometry?.location?.lng === "function"
      ? place.geometry.location.lng()
      : typeof place.geometry?.location?.lng === "number"
      ? place.geometry.location.lng
      : null;

  let streetNumber = "";
  let route = "";
  let sublocality = "";
  let city = "";
  let state = "";
  let postalCode = "";
  let country = "India";

  if (Array.isArray(place.address_components)) {
    for (const comp of place.address_components) {
      const types = comp.types || [];
      if (types.includes("street_number")) streetNumber = comp.long_name;
      if (types.includes("route")) route = comp.long_name;
      if (types.includes("sublocality") || types.includes("sublocality_level_1") || types.includes("neighborhood")) {
        sublocality = comp.long_name;
      }
      if (types.includes("locality")) {
        city = comp.long_name;
      } else if (!city && (types.includes("administrative_area_level_2") || types.includes("administrative_area_level_3"))) {
        city = comp.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        state = comp.long_name;
      }
      if (types.includes("postal_code")) {
        postalCode = comp.long_name;
      }
      if (types.includes("country")) {
        country = comp.long_name;
      }
    }
  }

  const placeName =
    place.name && place.name !== place.formatted_address
      ? place.name
      : sublocality || route || (streetNumber ? `${streetNumber} ${route}` : "");

  const address = place.formatted_address || `${placeName ? placeName + ", " : ""}${city} ${state}`.trim();

  return {
    latitude: lat != null ? Number(lat.toFixed(6)) : null,
    longitude: lng != null ? Number(lng.toFixed(6)) : null,
    address,
    placeName: placeName.trim(),
    city: city.trim(),
    state: state.trim(),
    postalCode: postalCode.trim(),
    country: country.trim() || "India",
  };
}
