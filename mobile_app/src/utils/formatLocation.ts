export const formatLocationText = (location: any): string => {
  if (!location) return "Unknown Location";
  
  let parsed = location;
  if (typeof location === "string") {
    try {
      parsed = JSON.parse(location);
    } catch (e) {
      // Not a JSON string, just return it as is
      return location;
    }
  }
  
  const parts = [];
  
  if (parsed.placeName) parts.push(parsed.placeName);
  else if (parsed.address) {
    // Some addresses might be very long. Try to use placeName or just first part of address
    const firstPart = parsed.address.split(',')[0];
    if (firstPart) parts.push(firstPart);
  }
  
  if (parsed.city && !parts.includes(parsed.city)) parts.push(parsed.city);
  if (parsed.state && !parts.includes(parsed.state)) parts.push(parsed.state);
  
  if (parts.length === 0) return "Unknown Location";
  
  return parts.join(", ");
};

export const parseLocation = (location: any): any => {
  if (!location) return null;
  if (typeof location === "string") {
    try {
      return JSON.parse(location);
    } catch (e) {
      return { address: location };
    }
  }
  return location;
};
